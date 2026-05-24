package com.medtech.application.service;

import com.medtech.domain.entity.EmailOutbox;
import com.medtech.domain.repository.EmailOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Sends a single outbox entry via SMTP in its own transaction.
 * Keeping this in a separate bean (not EmailDispatchJob) ensures
 * Spring's AOP proxy wraps the @Transactional correctly.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailDispatcher {

    static final int MAX_ATTEMPTS = 5;

    private final JavaMailSender mailSender;
    private final EmailOutboxRepository outboxRepository;

    @Value("${spring.mail.username:noreply@medtech.mk}")
    private String fromAddress;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void dispatch(EmailOutbox entry) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(entry.getToAddress());
            msg.setSubject(entry.getSubject());
            msg.setText(entry.getBody());
            mailSender.send(msg);

            entry.setStatus("SENT");
            entry.setSentAt(Instant.now());
            log.info("Email delivered: id={} to={}", entry.getId(), entry.getToAddress());
        } catch (MailException ex) {
            int attempts = entry.getAttempts() + 1;
            entry.setAttempts(attempts);
            entry.setLastError(ex.getMessage());
            if (attempts >= MAX_ATTEMPTS) {
                entry.setStatus("FAILED");
                log.error("Email permanently failed after {} attempts: id={} to={} error={}",
                        attempts, entry.getId(), entry.getToAddress(), ex.getMessage());
            } else {
                log.warn("Email delivery failed (attempt {}/{}): id={} to={} error={}",
                        attempts, MAX_ATTEMPTS, entry.getId(), entry.getToAddress(), ex.getMessage());
            }
        }
        outboxRepository.save(entry);
    }
}
