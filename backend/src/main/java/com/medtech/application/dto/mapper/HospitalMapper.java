package com.medtech.application.dto.mapper;

import com.medtech.application.dto.response.HospitalResponse;
import com.medtech.domain.entity.Hospital;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface HospitalMapper {

    HospitalResponse toResponse(Hospital hospital);
}
