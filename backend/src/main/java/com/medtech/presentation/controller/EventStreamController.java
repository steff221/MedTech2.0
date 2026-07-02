package com.medtech.presentation.controller;

import com.medtech.infrastructure.security.SecurityUtils;
import com.medtech.infrastructure.sse.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * REST контролер: SSE стрим за известувања во реално време.
 */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventStreamController {

    // 3-minute timeout — client EventSource reconnects automatically
    private static final long EMITTER_TIMEOUT_MS = 180_000L;

    private final SseEmitterRegistry registry;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public SseEmitter stream() {
        Long userId = SecurityUtils.currentUserId().orElseThrow();
        return registry.register(userId, EMITTER_TIMEOUT_MS);
    }
}
