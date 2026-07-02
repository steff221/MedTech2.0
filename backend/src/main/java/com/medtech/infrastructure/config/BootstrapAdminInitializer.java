package com.medtech.infrastructure.config;

import com.medtech.domain.entity.User;
import com.medtech.domain.repository.UserRepository;
import com.medtech.domain.vo.UserRole;
import com.medtech.domain.vo.UserStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates the first ADMIN account on startup when the database has none.
 *
 * <p>Production databases contain no seeded accounts (demo users are dev-only),
 * so without this a fresh deployment would have no way to log in and invite
 * staff. Controlled by two environment variables:
 *
 * <ul>
 *   <li>{@code MEDTECH_BOOTSTRAP_ADMIN_EMAIL}</li>
 *   <li>{@code MEDTECH_BOOTSTRAP_ADMIN_PASSWORD} (min 12 characters)</li>
 * </ul>
 *
 * <p>If either is unset the runner does nothing. If an ADMIN already exists the
 * runner does nothing — the variables can safely stay set across restarts, and
 * a compromised env file cannot overwrite an existing admin's password.
 *
 * Креира прв ADMIN при стартување ако базата нема ниту еден администратор.
 */
@Component
@Order(10)
public class BootstrapAdminInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BootstrapAdminInitializer.class);
    private static final int MIN_PASSWORD_LENGTH = 12;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;

    public BootstrapAdminInitializer(UserRepository userRepository,
                                     PasswordEncoder passwordEncoder,
                                     @Value("${medtech.bootstrap.admin.email:}") String email,
                                     @Value("${medtech.bootstrap.admin.password:}") String password) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(org.springframework.boot.ApplicationArguments args) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return;
        }
        if (userRepository.countByRole(UserRole.ADMIN) > 0) {
            log.debug("Bootstrap admin skipped — an ADMIN account already exists");
            return;
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalStateException(
                    "MEDTECH_BOOTSTRAP_ADMIN_PASSWORD must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
        final String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalStateException(
                    "MEDTECH_BOOTSTRAP_ADMIN_EMAIL already belongs to a non-admin account: refusing to promote it");
        }

        final User admin = new User();
        admin.setEmail(normalizedEmail);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setFirstName("System");
        admin.setLastName("Administrator");
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setEmailVerified(true);
        admin.setCreatedBy("BOOTSTRAP");
        userRepository.save(admin);

        log.warn("Bootstrap ADMIN account created for {} — change its password after first login "
                + "and remove MEDTECH_BOOTSTRAP_ADMIN_* from the environment", admin.getEmail());
    }
}
