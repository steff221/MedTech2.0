package com.medtech.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddAddendumRequest(
        @NotBlank @Size(max = 2000) String note,
        String clinicalNotes,
        String assessment,
        String plan
) {}
