package com.medtech.infrastructure.config;

import com.medtech.infrastructure.security.SecurityUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.Optional;

/**
 * Wires the current authenticated user id into Spring Data's auditing.
 *
 * <p>Excluded from {@code @WebMvcTest} slices via {@code excludeFilters} on those
 * test classes — slice tests have no JPA, and {@code @EnableJpaAuditing} would
 * fail there because the metamodel is empty.
 *
 * Конфигурација на JPA/Hibernate (на пр. auditing на created/updated полиња).
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class JpaConfig {

    @Bean
    public AuditorAware<String> auditorAware() {
        return () -> SecurityUtils.currentUserId().map(String::valueOf).or(() -> Optional.of("SYSTEM"));
    }
}
