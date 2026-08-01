package com.medtech.application.dto.request;

import com.medtech.domain.vo.BloodType;
import com.medtech.domain.vo.Gender;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** All fields nullable — only non-null values are applied. */
/**
 * Влезен DTO: барање за ажурирање на податоци на пациент.
 */
public record UpdatePatientRequest(
        @Past LocalDate dateOfBirth,
        Gender gender,
        BloodType bloodType,
        @Size(max = 2000) String allergies,
        @Size(max = 2000) String chronicConditions,
        @Size(max = 255) String insuranceProvider,
        @Size(max = 100) String insuranceNumber,

        /** ЕМБГ — 13 digits. Printed on every ФЗОМ referral. */
        @Pattern(regexp = "^$|^[0-9]{13}$", message = "ЕМБГ мора да содржи точно 13 цифри")
        String embg,

        /** ЕЗБО — единствен здравствен број на осигуреникот. */
        @Size(max = 30) String ezbo,
        @Size(max = 255) String emergencyContact,
        @Size(max = 20)  String emergencyPhone,
        @Size(max = 500) String address,
        @Size(max = 100) String city,
        @Size(max = 20)  String postalCode,
        @Size(max = 100) String country
) {}
