package com.medtech.application.dto.mapper;

import com.medtech.application.dto.response.OperationResponse;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.Operation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

/**
 * MapStruct мапер: пресликува помеѓу ентитетот Operation (операција) и неговиот DTO.
 */
@Mapper(componentModel = "spring")
public interface OperationMapper {

    @Mapping(source = "patient.id",   target = "patientId")
    @Mapping(source = "doctor.id",    target = "doctorId")
    @Mapping(source = "doctor",       target = "doctorName", qualifiedByName = "opDoctorName")
    @Mapping(source = "hospital.id",  target = "hospitalId")
    @Mapping(source = "hospital.name", target = "hospitalName")
    OperationResponse toResponse(Operation operation);

    @Named("opDoctorName")
    default String doctorName(Doctor doctor) {
        return doctor == null || doctor.getUser() == null ? null : doctor.getUser().fullName();
    }
}
