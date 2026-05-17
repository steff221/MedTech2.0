package com.medtech.application.dto.mapper;

import com.medtech.application.dto.response.DoctorResponse;
import com.medtech.domain.entity.Doctor;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DoctorMapper {

    @Mapping(source = "user.id",        target = "userId")
    @Mapping(source = "user.email",     target = "email")
    @Mapping(source = "user.firstName", target = "firstName")
    @Mapping(source = "user.lastName",  target = "lastName")
    @Mapping(source = "hospital.id",    target = "hospitalId")
    @Mapping(source = "hospital.name",  target = "hospitalName")
    @Mapping(source = "hospital.city",  target = "hospitalCity")
    DoctorResponse toResponse(Doctor doctor);
}
