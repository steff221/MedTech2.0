package com.medtech.application.dto.response;

import com.medtech.domain.vo.OperationStatus;
import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Излезен DTO: податоци за операција што се враќаат кон клиентот.
 */
@Builder
public record OperationResponse(
        Long id,
        Long patientId,
        Long doctorId,
        String doctorName,
        Long hospitalId,
        String hospitalName,
        String operationName,
        String mkb10Code,
        LocalDate operationDate,
        String operationTime,
        Integer durationMinutes,
        String operationRoom,
        String surgicalTeam,
        String anesthesiaType,
        String anesthesiologist,
        String preOperativeNotes,
        String intraOperativeNotes,
        String postOperativeNotes,
        String complications,
        String outcome,
        OperationStatus status,
        String implantsUsed,
        Instant createdAt
) {}
