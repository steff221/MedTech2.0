package com.medtech.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

/**
 * Влезен DTO: барање за поставување видео-линк за онлајн (видео) термин.
 */
public record SetVideoUrlRequest(
        @NotBlank @URL @Size(max = 2048) String videoCallUrl
) {}
