package com.medtech.infrastructure.config;

import com.github.benmanes.caffeine.cache.CaffeineSpec;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Objects;

/**
 * Конфигурација на кеширањето (cache) во апликацијата.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String DOCTORS_LIST   = "doctors-list";
    public static final String DOCTOR_BY_ID   = "doctor-by-id";
    public static final String HOSPITALS_LIST = "hospitals-list";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(
                DOCTORS_LIST, DOCTOR_BY_ID, HOSPITALS_LIST);
        manager.setCaffeineSpec(Objects.requireNonNull(CaffeineSpec.parse("maximumSize=500,expireAfterWrite=5m")));
        return manager;
    }
}
