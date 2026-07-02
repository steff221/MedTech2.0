package com.medtech.application.dto.response;

import com.medtech.domain.entity.MedicalRecordEvent;

import java.time.Instant;

/**
 * Излезен DTO: настан/измена во историјата на медицинскиот картон.
 */
public record MedicalRecordEventResponse(
        Long id,
        Long recordId,
        String eventType,
        Long authorId,
        String authorName,
        String snapshot,
        String note,
        Instant createdAt
) {
    public static MedicalRecordEventResponse from(MedicalRecordEvent e) {
        return new MedicalRecordEventResponse(
                e.getId(),
                e.getRecord().getId(),
                e.getEventType(),
                e.getAuthor().getId(),
                e.getAuthor().fullName(),
                e.getSnapshot(),
                e.getNote(),
                e.getCreatedAt());
    }
}
