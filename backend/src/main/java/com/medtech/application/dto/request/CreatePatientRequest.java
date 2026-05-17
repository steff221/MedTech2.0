package com.medtech.application.dto.request;

import com.medtech.domain.vo.BloodType;
import com.medtech.domain.vo.Gender;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreatePatientRequest(
        @NotNull @Past LocalDate dateOfBirth,
        Gender gender,
        BloodType bloodType,
        @Size(max = 2000) String allergies,
        @Size(max = 2000) String chronicConditions,
        @Size(max = 255) String insuranceProvider,
        @Size(max = 100) String insuranceNumber,
        @Size(max = 255) String emergencyContact,
        @Size(max = 20)  String emergencyPhone,
        @Size(max = 500) String address,
        @Size(max = 100) String city,
        @Size(max = 20)  String postalCode,
        @Size(max = 100) String country
) {}
