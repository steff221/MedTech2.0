package com.medtech.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Конфигурација на OpenAPI/Swagger документацијата за API-то.
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI medtechOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MedTech Medical Administration API")
                        .description("REST API for hospital management — patients, doctors, "
                                + "appointments, prescriptions, medical records, operations, and audit trails.")
                        .version("2.0.0")
                        .contact(new Contact().name("MedTech Platform Engineering").email("dev@medtech.mk"))
                        .license(new License().name("Proprietary").url("https://medtech.mk")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME,
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
