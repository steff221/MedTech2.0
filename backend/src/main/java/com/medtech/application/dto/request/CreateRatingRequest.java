package com.medtech.application.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Влезен DTO: барање за оставање оцена за доктор.
 */
public record CreateRatingRequest(
        @NotNull @Min(1) @Max(5) Short rating,
        @Size(max = 1000) String comment
) {}
