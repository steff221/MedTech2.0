package com.medtech.presentation.controller;

import com.medtech.infrastructure.exception.GlobalExceptionHandler;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;

/**
 * Shared imports for {@code @WebMvcTest} slices: the global exception handler
 * (so {@link com.medtech.infrastructure.exception.AppException} subclasses
 * round-trip into the structured {@code ErrorResponse}).
 *
 * <p>The slices keep the production {@code SecurityConfig} active (needed so
 * {@code @PreAuthorize} fires) and supply mocked {@code JwtTokenProvider} +
 * {@code CorsConfigurationSource} via {@code @MockBean} on each test class.
 */
/**
 * Тест-конфигурација: безбедносни поставки за WebMvc слајс тестовите.
 */
@TestConfiguration
@Import(GlobalExceptionHandler.class)
public class WebMvcTestSecurityConfig {
}
