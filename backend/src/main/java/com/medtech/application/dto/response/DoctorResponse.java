package com.medtech.application.dto.response;

import com.medtech.domain.vo.UserStatus;
import lombok.Builder;

import java.math.BigDecimal;

/**
 * Излезен DTO: податоци за доктор што се враќаат кон клиентот.
 */
@Builder
public record DoctorResponse(
        Long id,
        Long userId,
        String email,
        String firstName,
        String lastName,
        String licenseNumber,
        String specialization,
        String subSpecialization,
        String qualification,
        Integer experienceYears,
        String officeNumber,
        BigDecimal consultationFee,
        String availabilityHours,
        String bio,
        UserStatus status,
        Long hospitalId,
        String hospitalName,
        String hospitalCity,
        Double averageRating,
        int ratingCount
) {}
