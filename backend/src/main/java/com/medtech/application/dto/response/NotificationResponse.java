package com.medtech.application.dto.response;

import com.medtech.domain.entity.Notification;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String body,
        boolean read,
        Long referenceId,
        Instant createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getType(), n.getTitle(), n.getBody(),
                n.isRead(), n.getReferenceId(), n.getCreatedAt());
    }
}
