package com.medtech.infrastructure.config;

import com.medtech.domain.entity.User;
import com.medtech.domain.repository.UserRepository;
import com.medtech.domain.vo.UserRole;
import com.medtech.domain.vo.UserStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit тестови за BootstrapAdminInitializer (креирање прв ADMIN).
 */
@ExtendWith(MockitoExtension.class)
class BootstrapAdminInitializerTest {

    private static final String EMAIL = "admin@medtech.mk";
    private static final String PASSWORD = "Sup3r-Secret-Pass!";

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private BootstrapAdminInitializer initializer(String email, String password) {
        return new BootstrapAdminInitializer(userRepository, passwordEncoder, email, password);
    }

    @Test
    void doesNothingWhenVariablesUnset() {
        initializer("", "").run(null);
        verifyNoInteractions(userRepository, passwordEncoder);
    }

    @Test
    void skipsWhenAdminAlreadyExists() {
        when(userRepository.countByRole(UserRole.ADMIN)).thenReturn(1L);

        initializer(EMAIL, PASSWORD).run(null);

        verify(userRepository, never()).save(any());
    }

    @Test
    void rejectsShortPassword() {
        when(userRepository.countByRole(UserRole.ADMIN)).thenReturn(0L);

        assertThatThrownBy(() -> initializer(EMAIL, "short").run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 12");
        verify(userRepository, never()).save(any());
    }

    @Test
    void refusesToPromoteExistingAccount() {
        when(userRepository.countByRole(UserRole.ADMIN)).thenReturn(0L);
        when(userRepository.existsByEmailIgnoreCase(EMAIL)).thenReturn(true);

        assertThatThrownBy(() -> initializer(EMAIL, PASSWORD).run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("refusing to promote");
        verify(userRepository, never()).save(any());
    }

    @Test
    void createsActiveVerifiedAdminWithEncodedPassword() {
        when(userRepository.countByRole(UserRole.ADMIN)).thenReturn(0L);
        when(userRepository.existsByEmailIgnoreCase("admin@medtech.mk")).thenReturn(false);
        when(passwordEncoder.encode(PASSWORD)).thenReturn("$2a$12$encoded");

        initializer(" Admin@MedTech.mk ", PASSWORD).run(null);

        final ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        final User saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("admin@medtech.mk");
        assertThat(saved.getPasswordHash()).isEqualTo("$2a$12$encoded");
        assertThat(saved.getRole()).isEqualTo(UserRole.ADMIN);
        assertThat(saved.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(saved.isEmailVerified()).isTrue();
        assertThat(saved.getCreatedBy()).isEqualTo("BOOTSTRAP");
    }
}
