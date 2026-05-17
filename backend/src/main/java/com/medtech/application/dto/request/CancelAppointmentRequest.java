package com.medtech.application.dto.request;

import jakarta.validation.constraints.Size;

public record CancelAppointmentRequest(
        @Size(max = 500) String reason
) {}
