package com.medtech.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.time.Instant;
import java.util.List;

/**
 * Standardised error payload returned by every non-2xx response.
 *
 * Излезен DTO: стандарден формат на одговор при грешка (код, порака, детали).
 */
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        Instant timestamp,
        int status,
        String code,
        String message,
        String path,
        List<FieldError> errors
) {
    @Builder
    public record FieldError(String field, String message, Object rejectedValue) {}
}
