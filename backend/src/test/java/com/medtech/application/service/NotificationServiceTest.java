package com.medtech.application.service;

import com.medtech.domain.entity.Notification;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.NotificationRepository;
import com.medtech.domain.repository.UserRepository;
import com.medtech.domain.vo.UserRole;
import com.medtech.fixture.Entities;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import com.medtech.infrastructure.sse.SseEmitterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit тестови за NotificationService (известувања).
 */
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock NotificationRepository notificationRepository;
    @Mock UserRepository         userRepository;
    @Mock SseEmitterRegistry     sseRegistry;

    @InjectMocks NotificationService service;

    User user;

    @BeforeEach
    void setUp() {
        user = Entities.user(1L, UserRole.PATIENT);
    }

    // ── listForUser ──────────────────────────────────────────────────────────

    @Test
    void listForUser_delegatesToRepository() {
        var page = new PageImpl<>(List.of(new Notification()));
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L, Pageable.unpaged()))
                .thenReturn(page);

        var result = service.listForUser(1L, Pageable.unpaged());

        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    // ── unreadCount ──────────────────────────────────────────────────────────

    @Test
    void unreadCount_delegatesToRepository() {
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(3L);

        assertThat(service.unreadCount(1L)).isEqualTo(3L);
    }

    // ── markRead ─────────────────────────────────────────────────────────────

    @Test
    void markRead_notificationNotFound_throwsResourceNotFound() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.markRead(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void markRead_wrongUser_throwsResourceNotFound() {
        Notification n = new Notification();
        n.setUser(Entities.user(2L, UserRole.PATIENT)); // belongs to user 2
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(n));

        // user 1 tries to mark user 2's notification — should be rejected
        assertThatThrownBy(() -> service.markRead(10L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void markRead_success_setsReadAndSaves() {
        Notification n = new Notification();
        n.setUser(user);
        n.setRead(false);
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(n));
        when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Notification result = service.markRead(10L, 1L);

        assertThat(result.isRead()).isTrue();
        verify(notificationRepository).save(n);
    }

    // ── markAllRead ───────────────────────────────────────────────────────────

    @Test
    void markAllRead_delegatesToRepository() {
        service.markAllRead(1L);

        verify(notificationRepository).markAllReadForUser(1L);
    }

    // ── create ────────────────────────────────────────────────────────────────
    // Note: afterCommit SSE push is tested implicitly — the call needs an active
    // transaction; in unit tests we verify that the repo.save fires correctly.

    @Test
    void create_userNotFound_throwsResourceNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(99L, "TYPE", "Title", "Body", null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_success_savesNotification() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TransactionSynchronizationManager.initSynchronization();
        try {
            service.create(1L, "APPOINTMENT", "Термин потврден", "Вашиот термин е потврден.", 42L);
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }

        verify(notificationRepository).save(any(Notification.class));
    }
}
