package com.medtech.application.service;

import com.medtech.domain.entity.Notification;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.NotificationRepository;
import com.medtech.domain.repository.UserRepository;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<Notification> listForUser(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public Notification markRead(Long notificationId, Long userId) {
        Notification n = notificationRepository.findById(notificationId)
                .filter(notif -> notif.getUser().getId().equals(userId))
                .orElseThrow(() -> ResourceNotFoundException.of("Notification", notificationId));
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
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));
        notificationRepository.save(Notification.create(user, type, title, body, referenceId));
    }
}
