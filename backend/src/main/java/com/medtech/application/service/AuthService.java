package com.medtech.application.service;

import com.medtech.application.dto.request.LoginRequest;
import com.medtech.application.dto.request.RefreshTokenRequest;
import com.medtech.application.dto.request.RegisterRequest;
import com.medtech.application.dto.response.AuthResponse;
import com.medtech.application.dto.response.UserResponse;
import com.medtech.constant.ErrorCode;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.UserRepository;
import com.medtech.domain.vo.UserRole;
import com.medtech.domain.vo.UserStatus;
import com.medtech.infrastructure.exception.AppException;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import com.medtech.infrastructure.exception.ValidationException;
import com.medtech.infrastructure.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/**
 * Authentication use cases: registration, login, refresh.
 *
 * <p>Business rules:
 * <ul>
 *   <li>Email is unique (case-insensitive).</li>
 *   <li>Self-registration cannot grant {@link UserRole#ADMIN}.</li>
 *   <li>Locked or non-{@code ACTIVE} accounts cannot log in.</li>
 *   <li>Refresh tokens MUST carry {@code typ=refresh}; access tokens MUST carry {@code typ=access}.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    /** Bad-password attempts before the account is temporarily locked. */
    private static final int MAX_FAILED_ATTEMPTS = 5;
    /** How long an account stays locked after exceeding MAX_FAILED_ATTEMPTS. */
    private static final Duration LOCKOUT_WINDOW = Duration.ofMinutes(15);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (req.role() == UserRole.ADMIN) {
            throw new ValidationException("ADMIN accounts cannot be self-registered");
        }
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

    @Transactional(readOnly = true)
    public AuthResponse refresh(RefreshTokenRequest req) {
        Claims claims = tokenProvider.parse(req.refreshToken())
                .orElseThrow(() -> new AppException(ErrorCode.AUTH_TOKEN_INVALID,
                        HttpStatus.UNAUTHORIZED, "Refresh token is invalid or expired") {});

        if (!tokenProvider.isRefreshToken(claims)) {
            throw new AppException(ErrorCode.AUTH_TOKEN_INVALID, HttpStatus.UNAUTHORIZED,
                    "Provided token is not a refresh token") {};
        }

        Long userId = Long.valueOf(claims.getSubject());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.AUTH_ACCOUNT_INACTIVE, HttpStatus.UNAUTHORIZED,
                    "Account is not active") {};
        }
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        return AuthResponse.builder()
                .accessToken(tokenProvider.issueAccessToken(user))
                .refreshToken(tokenProvider.issueRefreshToken(user))
                .tokenType("Bearer")
                .expiresInSeconds(tokenProvider.accessTokenTtlSeconds())
                .user(UserResponse.from(user))
                .build();
    }
}
