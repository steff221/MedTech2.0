package com.medtech.application.dto.mapper;

import com.medtech.application.dto.response.HospitalResponse;
import com.medtech.domain.entity.Hospital;
import org.mapstruct.Mapper;

/**
 * MapStruct мапер: пресликува помеѓу ентитетот Hospital (болница) и неговиот DTO.
 */
@Mapper(componentModel = "spring")
public interface HospitalMapper {

    HospitalResponse toResponse(Hospital hospital);
}
