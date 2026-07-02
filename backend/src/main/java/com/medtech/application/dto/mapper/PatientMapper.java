package com.medtech.application.dto.mapper;

import com.medtech.application.dto.response.PatientResponse;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.vo.BloodType;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

/**
 * MapStruct мапер: пресликува помеѓу ентитетот Patient (пациент) и неговите DTO објекти.
 */
@Mapper(componentModel = "spring")
public interface PatientMapper {

    @Mapping(source = "user.id",         target = "userId")
    @Mapping(source = "user.email",      target = "email")
    @Mapping(source = "user.firstName",  target = "firstName")
    @Mapping(source = "user.lastName",   target = "lastName")
    @Mapping(source = "user.phoneNumber", target = "phoneNumber")
    @Mapping(source = "bloodType", target = "bloodType", qualifiedByName = "stringToBloodType")
    PatientResponse toResponse(Patient patient);

    @Named("stringToBloodType")
    default BloodType stringToBloodType(String raw) {
        return BloodType.fromDbValue(raw).orElse(null);
    }
}
