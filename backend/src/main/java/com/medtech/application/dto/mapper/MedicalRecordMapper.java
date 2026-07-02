package com.medtech.application.dto.mapper;

import com.medtech.application.dto.response.MedicalRecordResponse;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.MedicalRecord;
import com.medtech.domain.entity.Patient;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

/**
 * MapStruct мапер: пресликува помеѓу ентитетот MedicalRecord (медицински картон) и неговите DTO.
 */
@Mapper(componentModel = "spring")
public interface MedicalRecordMapper {

    @Mapping(source = "patient.id",            target = "patientId")
    @Mapping(source = "patient",               target = "patientName", qualifiedByName = "mrPatientName")
    @Mapping(source = "doctor.id",             target = "doctorId")
    @Mapping(source = "doctor",                target = "doctorName", qualifiedByName = "mrDoctorName")
    @Mapping(source = "doctor.specialization", target = "doctorSpecialization")
    @Mapping(source = "hospital.id",           target = "hospitalId")
    @Mapping(source = "appointment.id",        target = "appointmentId")
    @Mapping(source = "vitalSignsJson",        target = "vitalSigns")
    MedicalRecordResponse toResponse(MedicalRecord record);

    @Named("mrPatientName")
    default String patientName(Patient patient) {
        if (patient == null || patient.getUser() == null) return null;
        String first = patient.getUser().getFirstName();
        String last  = patient.getUser().getLastName();
        if (first == null && last == null) return null;
        return ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
    }

    @Named("mrDoctorName")
    default String doctorName(Doctor doctor) {
        return doctor == null || doctor.getUser() == null ? null : doctor.getUser().fullName();
    }
}
