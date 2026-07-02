package com.medtech.presentation.controller;

import com.medtech.application.dto.response.NotificationResponse;
import com.medtech.application.service.NotificationService;
import com.medtech.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST контролер: endpoints за известувањата на корисникот.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public Page<NotificationResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtils.currentUserId().orElseThrow();
        return notificationService.listForUser(userId, PageRequest.of(page, size))
                .map(NotificationResponse::from);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount() {
        Long userId = SecurityUtils.currentUserId().orElseThrow();
        return Map.of("count", notificationService.unreadCount(userId));
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(@PathVariable Long id) {
        Long userId = SecurityUtils.currentUserId().orElseThrow();
        return NotificationResponse.from(notificationService.markRead(id, userId));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead() {
        Long userId = SecurityUtils.currentUserId().orElseThrow();
        notificationService.markAllRead(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-type")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<NotificationResponse> byType(
            @RequestParam String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return notificationService.listByType(type, PageRequest.of(page, size))
                .map(NotificationResponse::from);
    }
}
