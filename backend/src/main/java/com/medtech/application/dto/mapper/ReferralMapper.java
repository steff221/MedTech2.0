package com.medtech.application.dto.mapper;

import com.medtech.application.dto.response.ReferralResponse;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.entity.Referral;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

/**
 * MapStruct мапер: пресликува помеѓу ентитетот Referral (упат) и неговиот DTO.
 */
@Mapper(componentModel = "spring")
public interface ReferralMapper {

    @Mapping(source = "doctor.id",   target = "doctorId")
    @Mapping(source = "doctor",      target = "doctorName",  qualifiedByName = "refDoctorName")
    @Mapping(source = "patient.id",  target = "patientId")
    @Mapping(source = "patient",     target = "patientName", qualifiedByName = "refPatientName")
    ReferralResponse toResponse(Referral referral);

    @Named("refDoctorName")
    default String doctorName(Doctor doctor) {
        return doctor == null || doctor.getUser() == null ? null : doctor.getUser().fullName();
    }

    @Named("refPatientName")
    default String patientName(Patient patient) {
        return patient == null || patient.getUser() == null ? null : patient.getUser().fullName();
    }
}
