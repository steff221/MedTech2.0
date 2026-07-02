package com.medtech.application.dto.request;

import com.medtech.domain.vo.VitalSigns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Влезен DTO: барање за креирање нов медицински картон.
 */
public record CreateMedicalRecordRequest(
        @NotNull Long patientId,
        Long appointmentId,
        @Size(max = 500) String diagnosis,
        @Size(max = 20)  String mkb10Code,
        @NotBlank String clinicalNotes,
        VitalSigns vitalSigns,
        @Size(max = 20)  String bloodPressure,
        Integer heartRate,
        BigDecimal temperature,
        BigDecimal weight,
        BigDecimal height,
        BigDecimal bmi,
        String assessment,
        String plan,
        boolean confidential
) {}
