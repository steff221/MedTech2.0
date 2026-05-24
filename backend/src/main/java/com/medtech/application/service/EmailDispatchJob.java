package com.medtech.application.service;

import com.medtech.domain.entity.EmailOutbox;
import com.medtech.domain.repository.EmailOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Polls the email_outbox table every 30 seconds and delivers PENDING messages.
 * Each message is dispatched in its own transaction via {@link EmailDispatcher}
 * so one SMTP failure does not roll back successfully sent siblings.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailDispatchJob {

    private final EmailOutboxRepository outboxRepository;
    private final EmailDispatcher dispatcher;

    @Scheduled(fixedDelay = 30_000)
    @Transactional(readOnly = true)
    public void processOutbox() {
        List<EmailOutbox> pending = outboxRepository.findPendingForDelivery(EmailDispatcher.MAX_ATTEMPTS);
        if (pending.isEmpty()) return;

        log.debug("Email outbox: dispatching {} pending message(s)", pending.size());
        for (EmailOutbox entry : pending) {
            dispatcher.dispatch(entry);
        }
    }
}
