package com.medtech.application.service;

import com.medtech.application.dto.request.LoginRequest;
import com.medtech.application.dto.request.RegisterRequest;
import com.medtech.application.dto.response.AuthResponse;
import com.medtech.domain.entity.RefreshToken;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.RefreshTokenRepository;
import com.medtech.domain.repository.UserRepository;
import com.medtech.domain.vo.UserRole;
import com.medtech.domain.vo.UserStatus;
import com.medtech.infrastructure.exception.AppException;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.security.JwtProperties;
import com.medtech.infrastructure.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider tokenProvider;
    @Mock private JwtProperties jwtProperties;

    @InjectMocks private AuthService authService;

    private RegisterRequest validRegister;

    @BeforeEach
    void setUp() {
        validRegister = new RegisterRequest(
                "new.user@medtech.mk", "Str0ng!Passw0rd#2026",
                "New", "User", "+38970000000", UserRole.PATIENT);
    }

    @Test
    void register_rejectsDuplicateEmail() {
        when(userRepository.existsByEmailIgnoreCase(validRegister.email())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(validRegister))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void register_persistsUserAndIssuesTokens() {
        when(userRepository.existsByEmailIgnoreCase(any())).thenReturn(false);
        when(passwordEncoder.encode(validRegister.password())).thenReturn("$2a$hash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            try {
                var f = User.class.getDeclaredField("id");
                f.setAccessible(true);
                f.set(u, 100L);
            } catch (ReflectiveOperationException e) {
                throw new IllegalStateException(e);
            }
            return u;
        });
        when(tokenProvider.issueAccessToken(any())).thenReturn("access");
        when(tokenProvider.issueRefreshToken(any())).thenReturn("refresh");
        when(tokenProvider.accessTokenTtlSeconds()).thenReturn(3600L);
        when(jwtProperties.refreshTokenTtlDays()).thenReturn(7L);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse response = authService.register(validRegister);

        assertThat(response.accessToken()).isEqualTo("access");
        assertThat(response.refreshToken()).isEqualTo("refresh");
        assertThat(response.user().email()).isEqualTo("new.user@medtech.mk");
        assertThat(response.user().role()).isEqualTo(UserRole.PATIENT);
    }

    @Test
    void login_rejectsUnknownEmail() {
        when(userRepository.findByEmailIgnoreCase(eq("missing@x.mk"))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("missing@x.mk", "whatever")))
                .isInstanceOf(AppException.class);
    }

    @Test
    void login_rejectsBadPassword() {
        User user = activeUser();
        when(userRepository.findByEmailIgnoreCase(any())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest(user.getEmail(), "wrong")))
                .isInstanceOf(AppException.class);
    }

    private User activeUser() {
        User u = new User();
        u.setEmail("alice@medtech.mk");
        u.setPasswordHash("$2a$hash");
        u.setRole(UserRole.PATIENT);
        u.setStatus(UserStatus.ACTIVE);
        try {
            var f = User.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(u, 7L);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
        return u;
    }
}
