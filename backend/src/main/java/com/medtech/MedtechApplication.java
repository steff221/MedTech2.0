package com.medtech;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * MedTech Medical Administration System — main entry point.
 *
 * <p>Spring Boot 3 REST API backend for hospital management. Layered DDD-style
 * architecture (domain / application / infrastructure / presentation) with
 * PostgreSQL persistence, JWT authentication, and full audit trails.
 */
@SpringBootApplication
@ConfigurationPropertiesScan("com.medtech")
@EnableTransactionManagement
@EnableAsync
@EnableScheduling
public class MedtechApplication {

    public static void main(String[] args) {
        SpringApplication.run(MedtechApplication.class, args);
    }
}
