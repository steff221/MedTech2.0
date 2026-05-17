package com.medtech.application.dto.request;

import com.medtech.domain.vo.OperationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateOperationStatusRequest(
        @NotNull OperationStatus status,
        @Size(max = 500) String complications,
        @Size(max = 500) String outcome,
        String intraOperativeNotes,
        String postOperativeNotes
) {}
