package com.medtech.application.service;

import com.medtech.domain.entity.Notification;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.NotificationRepository;
import com.medtech.domain.repository.UserRepository;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import com.medtech.infrastructure.sse.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Map;

/**
 * Сервис: креирање и испорака на известувања до корисниците (вкл. во реално време).
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SseEmitterRegistry sseRegistry;

    @Transactional(readOnly = true)
    public Page<Notification> listForUser(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Notification> listByType(String type, Pageable pageable) {
        return notificationRepository.findByTypeOrderByCreatedAtDesc(type, pageable);
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public Notification markRead(Long notificationId, Long userId) {
        Notification n = notificationRepository.findById(notificationId)
                .filter(notif -> notif.getUser().getId().equals(userId))
                .orElseThrow(() -> ResourceNotFoundException.of("Известување", notificationId));
        n.setRead(true);
        return notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadForUser(userId);
    }

    @Transactional
    public void create(Long userId, String type, String title, String body, Long referenceId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Корисник", userId));
        notificationRepository.save(Notification.create(user, type, title, body, referenceId));

        // Push SSE event AFTER commit — count is fetched post-commit so it
        // includes the new row and needs no manual +1 adjustment.
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                long unread = notificationRepository.countByUserIdAndReadFalse(userId);
                sseRegistry.push(userId, "notification",
                        Map.of("type", type, "title", title, "unreadCount", unread));
            }
        });
    }
}
