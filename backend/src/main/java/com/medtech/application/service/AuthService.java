package com.medtech.application.service;

import com.medtech.application.dto.request.LoginRequest;
import com.medtech.application.dto.request.LogoutRequest;
import com.medtech.application.dto.request.RefreshTokenRequest;
import com.medtech.application.dto.request.RegisterRequest;
import com.medtech.application.dto.response.AuthResponse;
import com.medtech.application.dto.response.UserResponse;
import com.medtech.constant.ErrorCode;
import com.medtech.domain.entity.RefreshToken;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.RefreshTokenRepository;
import com.medtech.domain.repository.UserRepository;
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
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration LOCKOUT_WINDOW = Duration.ofMinutes(15);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final JwtProperties jwtProperties;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new ConflictException(ErrorCode.AUTH_EMAIL_TAKEN, "Email already registered");
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
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmailIgnoreCase(req.email())
                .orElseThrow(AuthorizationException::invalidCredentials);

        if (user.isLocked()) {
            throw new AppException(ErrorCode.AUTH_ACCOUNT_LOCKED, HttpStatus.UNAUTHORIZED,
                    "Account is temporarily locked. Try again later.") {};
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.AUTH_ACCOUNT_INACTIVE, HttpStatus.UNAUTHORIZED,
                    "Account is not active") {};
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
                        "Too many failed attempts. Account locked for "
                                + LOCKOUT_WINDOW.toMinutes() + " minutes.") {};
            }
            throw AuthorizationException.invalidCredentials();
        }

        userRepository.recordSuccessfulLogin(user.getId(), Instant.now());
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest req) {
        Claims claims = tokenProvider.parse(req.refreshToken())
                .orElseThrow(() -> new AppException(ErrorCode.AUTH_TOKEN_INVALID,
                        HttpStatus.UNAUTHORIZED, "Refresh token is invalid or expired") {});

        if (!tokenProvider.isRefreshToken(claims)) {
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID, HttpStatus.UNAUTHORIZED,
                    "Provided token is not a refresh token") {};
        }

        String hash = hashToken(req.refreshToken());
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new AppException(ErrorCode.AUTH_TOKEN_INVALID,
                        HttpStatus.UNAUTHORIZED, "Refresh token not recognised") {});

        if (stored.isRevoked()) {
            // Possible token reuse — revoke all tokens for this user as a safety measure.
            refreshTokenRepository.revokeAllForUser(stored.getUser().getId(), Instant.now());
            log.warn("Refresh token reuse detected for user {}", stored.getUser().getId());
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID, HttpStatus.UNAUTHORIZED,
                    "Refresh token already used") {};
        }

        // Rotate: revoke the presented token, issue a fresh pair.
        stored.setRevoked(true);
        stored.setRevokedAt(Instant.now());
        refreshTokenRepository.save(stored);

        long userId = Long.parseLong(Objects.requireNonNull(claims.getSubject(), "JWT subject missing"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.AUTH_ACCOUNT_INACTIVE, HttpStatus.UNAUTHORIZED,
                    "Account is not active") {};
        }
        return buildAuthResponse(user);
    }

    @Transactional
    public void logout(LogoutRequest req) {
        String hash = hashToken(req.refreshToken());
        refreshTokenRepository.findByTokenHash(hash).ifPresent(t -> {
            t.setRevoked(true);
            t.setRevokedAt(Instant.now());
            refreshTokenRepository.save(t);
        });
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

    private static String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
