package com.medtech.application.dto.mapper;

import com.medtech.application.dto.response.AuditLogResponse;
import com.medtech.domain.entity.AuditLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AuditLogMapper {

    @Mapping(source = "user.id", target = "userId")
    AuditLogResponse toResponse(AuditLog log);
}
