package com.medtech.infrastructure.sse;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-process store of active SSE connections keyed by userId.
 * One emitter per user — a new connection replaces the previous one.
 *
 * Регистар на отворени SSE врски — овозможува испраќање настани во реално време до клиентите.
 */
@Slf4j
@Component
public class SseEmitterRegistry {

    private final ConcurrentHashMap<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter register(Long userId, long timeoutMs) {
        SseEmitter emitter = new SseEmitter(timeoutMs);

        SseEmitter previous = emitters.put(userId, emitter);
        if (previous != null) {
            previous.complete();
        }

        Runnable cleanup = () -> emitters.remove(userId, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(ex -> cleanup.run());

        log.debug("SSE registered userId={}", userId);
        return emitter;
    }

    /**
     * Pushes a named event to the user's active connection, if any.
     * Silently removes the emitter if the connection is closed.
     */
    public void push(Long userId, String eventName, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) return;
        try {
            emitter.send(SseEmitter.event().name(eventName).data(data));
        } catch (IOException | IllegalStateException ex) {
            emitters.remove(userId, emitter);
            log.debug("SSE push failed, emitter removed userId={}: {}", userId, ex.getMessage());
        }
    }

    public int activeConnections() {
        return emitters.size();
    }
}
