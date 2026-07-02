package com.medtech.application.dto.mapper;

import com.medtech.application.dto.response.PrescriptionResponse;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.Prescription;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

/**
 * MapStruct мапер: пресликува помеѓу ентитетот Prescription (рецепт) и неговиот DTO.
 */
@Mapper(componentModel = "spring")
public interface PrescriptionMapper {

    @Mapping(source = "patient.id",        target = "patientId")
    @Mapping(source = "doctor.id",         target = "doctorId")
    @Mapping(source = "doctor",            target = "doctorName", qualifiedByName = "rxDoctorName")
    @Mapping(source = "medicalRecord.id",  target = "medicalRecordId")
    PrescriptionResponse toResponse(Prescription prescription);

    @Named("rxDoctorName")
    default String doctorName(Doctor doctor) {
        return doctor == null || doctor.getUser() == null ? null : doctor.getUser().fullName();
    }
}
