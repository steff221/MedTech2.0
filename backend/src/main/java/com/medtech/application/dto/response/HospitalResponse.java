package com.medtech.application.dto.response;

import com.medtech.domain.vo.HospitalStatus;
import com.medtech.domain.vo.HospitalType;
import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record HospitalResponse(
        Long id,
        String name,
        String city,
        String address,
        String postalCode,
        String phoneNumber,
        BigDecimal latitude,
        BigDecimal longitude,
        HospitalType type,
        String directorName,
        Integer bedCount,
        HospitalStatus status
) {}
