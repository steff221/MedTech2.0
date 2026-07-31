package com.medtech.application.service;

import com.medtech.application.dto.request.ForgotPasswordRequest;
import com.medtech.application.dto.request.LoginRequest;
import com.medtech.application.dto.request.LogoutRequest;
import com.medtech.application.dto.request.RefreshTokenRequest;
import com.medtech.application.dto.request.RegisterRequest;
import com.medtech.application.dto.request.ResetPasswordRequest;
import com.medtech.application.dto.response.AuthResponse;
import com.medtech.application.dto.response.UserResponse;
import com.medtech.constant.ErrorCode;
import com.medtech.domain.entity.EmailVerificationToken;
import com.medtech.domain.entity.PasswordResetToken;
import com.medtech.domain.entity.RefreshToken;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.EmailVerificationTokenRepository;
import com.medtech.domain.repository.PasswordResetTokenRepository;
import com.medtech.domain.repository.RefreshTokenRepository;
import com.medtech.domain.repository.UserRepository;
import com.medtech.domain.vo.AuditAction;
import com.medtech.domain.vo.AuditStatus;
import com.medtech.domain.vo.UserStatus;
import com.medtech.infrastructure.exception.AppException;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import com.medtech.infrastructure.security.JwtProperties;
import com.medtech.infrastructure.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Objects;

/**
 * Сервис: автентикација — регистрација, најава, освежување токени, ресет на лозинка.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration LOCKOUT_WINDOW = Duration.ofMinutes(15);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /**
     * BCrypt hash (strength 12, matching {@code SecurityConfig#passwordEncoder})
     * of a random throwaway value. Matched against when the email is unknown so
     * the "no such user" path costs the same as a real password check —
     * otherwise response time leaks which emails are registered.
     */
    private static final String DUMMY_PASSWORD_HASH =
            "$2a$12$BG6E7tIhGJ0fVc8ffnhHvekrgBQvx3T9hG8cseZIu4Vg.Jjoz7wpW";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final JwtProperties jwtProperties;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    @Value("${medtech.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${medtech.password-reset-ttl-minutes:30}")
    private int passwordResetTtlMinutes;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (req.role() != com.medtech.domain.vo.UserRole.PATIENT) {
            throw new AppException(ErrorCode.AUTH_FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Самостојна регистрација е дозволена само за сметки на ПАЦИЕНТ") {};
        }

        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new ConflictException(ErrorCode.AUTH_EMAIL_TAKEN, "Е-поштата е веќе регистрирана");
        }

        User user = new User();
        user.setEmail(req.email().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setFirstName(req.firstName());
        user.setLastName(req.lastName());
        user.setPhoneNumber(req.phoneNumber());
        user.setRole(req.role());
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedBy("SELF_REGISTRATION");
        user = userRepository.save(user);

        log.info("Registered user id={} email={} role={}", user.getId(), user.getEmail(), user.getRole());
        issueVerificationToken(user);
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmailIgnoreCase(req.email())
                .orElseThrow(() -> {
                    passwordEncoder.matches(req.password(), DUMMY_PASSWORD_HASH);
                    return AuthorizationException.invalidCredentials();
                });

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.AUTH_ACCOUNT_INACTIVE, HttpStatus.UNAUTHORIZED,
                    "Сметката не е активна") {};
        }
        // Lockout must gate ALL attempts — checking it only on a wrong password
        // would let an attacker keep brute-forcing during the lockout window and
        // log straight in the moment the password is guessed.
        if (user.isLocked()) {
            throw new AppException(ErrorCode.AUTH_ACCOUNT_LOCKED, HttpStatus.UNAUTHORIZED,
                    "Сметката е привремено заклучена. Обидете се подоцна.") {};
        }
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            int attempted = user.getFailedLoginCount() + 1;
            userRepository.incrementFailedLogins(user.getId());
            if (attempted >= MAX_FAILED_ATTEMPTS) {
                Instant until = Instant.now().plus(LOCKOUT_WINDOW);
                userRepository.lockUntil(user.getId(), until);
                log.warn("Locked user {} until {} after {} failed attempts",
                        user.getId(), until, attempted);
                throw new AppException(ErrorCode.AUTH_ACCOUNT_LOCKED, HttpStatus.UNAUTHORIZED,
                        "Премногу неуспешни обиди. Сметката е заклучена "
                                + LOCKOUT_WINDOW.toMinutes() + " минути.") {};
            }
            throw AuthorizationException.invalidCredentials();
        }

        userRepository.recordSuccessfulLogin(user.getId(), Instant.now());
        AuthResponse res = buildAuthResponse(user);
        auditLogService.record(user, AuditAction.LOGIN, "User", user.getId(), null,
                "Successful login", currentIp(), currentUserAgent(), AuditStatus.SUCCESS);
        return res;
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public AuthResponse refresh(RefreshTokenRequest req) {
        Claims claims = tokenProvider.parse(req.refreshToken())
                .orElseThrow(() -> new AppException(ErrorCode.AUTH_TOKEN_INVALID,
                        HttpStatus.UNAUTHORIZED, "Токенот за освежување е неважечки или истечен") {});

        if (!tokenProvider.isRefreshToken(claims)) {
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID, HttpStatus.UNAUTHORIZED,
                    "Доставениот токен не е токен за освежување") {};
        }

        String hash = hashToken(req.refreshToken());
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new AppException(ErrorCode.AUTH_TOKEN_INVALID,
                        HttpStatus.UNAUTHORIZED, "Токенот за освежување не е препознаен") {});

        if (stored.isRevoked()) {
            // Possible token reuse — revoke all tokens for this user as a safety measure.
            refreshTokenRepository.revokeAllForUser(stored.getUser().getId(), Instant.now());
            log.warn("Refresh token reuse detected for user {}", stored.getUser().getId());
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID, HttpStatus.UNAUTHORIZED,
                    "Токенот за освежување е веќе искористен") {};
        }

        // Rotate: revoke the presented token, issue a fresh pair.
        // @Version on RefreshToken raises ObjectOptimisticLockingFailureException if two
        // concurrent requests both try to rotate the same token simultaneously.
        stored.setRevoked(true);
        stored.setRevokedAt(Instant.now());
        try {
            refreshTokenRepository.save(stored);
        } catch (ObjectOptimisticLockingFailureException ex) {
            log.warn("Concurrent refresh token rotation rejected for token hash {}", hash);
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID, HttpStatus.UNAUTHORIZED,
                    "Токенот за освежување се користи истовремено. Обидете се повторно") {};
        }

        long userId = Long.parseLong(Objects.requireNonNull(claims.getSubject(), "JWT subject missing"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Корисник", userId));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.AUTH_ACCOUNT_INACTIVE, HttpStatus.UNAUTHORIZED,
                    "Сметката не е активна") {};
        }
        return buildAuthResponse(user);
    }

    @Transactional
    public void logout(LogoutRequest req) {
        String hash = hashToken(req.refreshToken());
        Instant now = Instant.now();
        int updated = refreshTokenRepository.revokeByTokenHash(hash, now);
        if (updated > 0) {
            refreshTokenRepository.findByTokenHash(hash).ifPresent(t ->
                auditLogService.record(t.getUser(), AuditAction.LOGOUT, "User", t.getUser().getId(),
                        null, "Logout", currentIp(), currentUserAgent(), AuditStatus.SUCCESS));
        }
    }

    /**
     * Initiates the password reset flow. Always returns 200 regardless of whether
     * the email exists — prevents user enumeration.
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest req) {
        userRepository.findByEmailIgnoreCase(req.email()).ifPresent(user -> {
            // Invalidate any existing reset tokens for this user
            passwordResetTokenRepository.invalidateAllForUser(user.getId(), Instant.now());

            byte[] raw = new byte[32];
            SECURE_RANDOM.nextBytes(raw);
            String plainToken = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
            String hash = hashToken(plainToken);

            PasswordResetToken prt = new PasswordResetToken();
            prt.setUser(user);
            prt.setTokenHash(hash);
            prt.setExpiresAt(Instant.now().plus(Duration.ofMinutes(passwordResetTtlMinutes)));
            passwordResetTokenRepository.save(prt);

            String resetLink = frontendUrl + "/reset-password?token=" + plainToken;
            emailService.sendPasswordResetEmail(user.getEmail(),
                    user.getFirstName() + " " + user.getLastName(), resetLink);
            log.info("Password reset token issued for user id={}", user.getId());
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        String hash = hashToken(req.token());
        PasswordResetToken prt = passwordResetTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new AppException(ErrorCode.AUTH_RESET_TOKEN_INVALID,
                        HttpStatus.BAD_REQUEST, "Неважечки или истечен токен за ресетирање") {});

        if (prt.isUsed() || prt.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.AUTH_RESET_TOKEN_INVALID,
                    HttpStatus.BAD_REQUEST, "Токенот за ресетирање истече или е веќе искористен") {};
        }

        User user = prt.getUser();
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);

        prt.setUsed(true);
        prt.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(prt);

        // Revoke all active refresh tokens so existing sessions are invalidated
        refreshTokenRepository.revokeAllForUser(user.getId(), Instant.now());

        emailService.sendPasswordChangedNotice(user.getEmail(),
                user.getFirstName() + " " + user.getLastName());
        log.info("Password reset completed for user id={}", user.getId());
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken  = tokenProvider.issueAccessToken(user);
        String refreshToken = tokenProvider.issueRefreshToken(user);
        persistRefreshToken(user, refreshToken);
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresInSeconds(tokenProvider.accessTokenTtlSeconds())
                .user(UserResponse.from(user))
                .build();
    }

    private void persistRefreshToken(User user, String token) {
        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setTokenHash(hashToken(token));
        rt.setExpiresAt(Instant.now().plus(Duration.ofDays(jwtProperties.refreshTokenTtlDays())));
        refreshTokenRepository.save(rt);
    }

    private void issueVerificationToken(User user) {
        byte[] raw = new byte[32];
        SECURE_RANDOM.nextBytes(raw);
        String plainToken = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);

        EmailVerificationToken evt = new EmailVerificationToken();
        evt.setUser(user);
        evt.setTokenHash(hashToken(plainToken));
        evt.setExpiresAt(Instant.now().plus(Duration.ofHours(24)));
        emailVerificationTokenRepository.save(evt);

        String link = frontendUrl + "/verify-email?token=" + plainToken;
        emailService.sendEmailVerification(user.getEmail(), user.fullName(), link);
    }

    @Transactional
    public void verifyEmail(String plainToken) {
        String hash = hashToken(plainToken);
        EmailVerificationToken evt = emailVerificationTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new AppException(ErrorCode.AUTH_RESET_TOKEN_INVALID,
                        HttpStatus.BAD_REQUEST, "Линкот за потврда е неважечки или истечен") {});

        if (evt.isUsed() || evt.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.AUTH_RESET_TOKEN_INVALID,
                    HttpStatus.BAD_REQUEST, "Линкот за потврда истече") {};
        }

        User user = evt.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        evt.setUsed(true);
        evt.setUsedAt(Instant.now());
        emailVerificationTokenRepository.save(evt);

        log.info("Email verified for user id={}", user.getId());
    }

    private static String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private static String currentIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            // forward-headers-strategy: framework already resolves the real IP from
            // X-Forwarded-For via Spring's ForwardedHeaderFilter, so getRemoteAddr()
            // returns the correct value without manual header parsing (which is spoofable).
            return attrs.getRequest().getRemoteAddr();
        } catch (IllegalStateException e) {
            return null;
        }
    }

    private static String currentUserAgent() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            return attrs.getRequest().getHeader("User-Agent");
        } catch (IllegalStateException e) {
            return null;
        }
    }
}
