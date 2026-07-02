package com.medtech.application.dto.request;

import jakarta.validation.constraints.Size;

/**
 * Влезен DTO: барање за откажување на термин.
 */
public record CancelAppointmentRequest(
        @Size(max = 500) String reason
) {}
