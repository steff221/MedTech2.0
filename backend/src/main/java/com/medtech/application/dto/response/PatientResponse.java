package com.medtech.application.dto.response;

import com.medtech.domain.vo.BloodType;
import com.medtech.domain.vo.Gender;
import lombok.Builder;

import java.time.LocalDate;

/**
 * Излезен DTO: податоци за пациент што се враќаат кон клиентот.
 */
@Builder
public record PatientResponse(
        Long id,
        Long userId,
        String email,
        String firstName,
        String lastName,
        String phoneNumber,
        LocalDate dateOfBirth,
        Gender gender,
        BloodType bloodType,
        String allergies,
        String chronicConditions,
        String insuranceProvider,
        String insuranceNumber,
        String emergencyContact,
        String emergencyPhone,
        String address,
        String city,
        String postalCode,
        String country
) {}
