package com.medtech.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Single source of truth for "current time" so services are deterministically
 * testable (inject {@link Clock#fixed} in tests).
 *
 * Конфигурација на часовникот (Clock) — овозможува тестабилно мерење време.
 */
@Configuration
public class TimeConfig {

    @Bean
    public Clock systemClock() {
        return Clock.systemDefaultZone();
    }
}
