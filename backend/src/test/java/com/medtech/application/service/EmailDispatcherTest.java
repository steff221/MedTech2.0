package com.medtech.application.service;

import com.medtech.domain.entity.EmailOutbox;
import com.medtech.domain.repository.EmailOutboxRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static com.medtech.application.service.EmailDispatcher.MAX_ATTEMPTS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit тестови за EmailDispatcher (ставање е-пораки во outbox).
 */
@ExtendWith(MockitoExtension.class)
class EmailDispatcherTest {

    @Mock JavaMailSender      mailSender;
    @Mock EmailOutboxRepository outboxRepository;

    EmailDispatcher dispatcher;

    @BeforeEach
    void setUp() {
        dispatcher = new EmailDispatcher(mailSender, outboxRepository);
    }

    @Test
    void dispatch_success_marksSentAndSavesEntry() {
        EmailOutbox entry = EmailOutbox.of("patient@test.mk", "Appointment reminder", "body");

        dispatcher.dispatch(entry);

        assertThat(entry.getStatus()).isEqualTo("SENT");
        assertThat(entry.getSentAt()).isNotNull();
        verify(outboxRepository).save(entry);
    }

    @Test
    void dispatch_success_sendsCorrectEmail() {
        EmailOutbox entry = EmailOutbox.of("doc@hospital.mk", "Report ready", "Here is your report.");

        dispatcher.dispatch(entry);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage sent = captor.getValue();
        assertThat(sent.getTo()).containsExactly("doc@hospital.mk");
        assertThat(sent.getSubject()).isEqualTo("Report ready");
        assertThat(sent.getText()).isEqualTo("Here is your report.");
    }

    @Test
    void dispatch_mailFailure_incrementsAttemptsAndRecordsError() {
        EmailOutbox entry = EmailOutbox.of("bad@host.mk", "Test", "body");
        doThrow(new MailSendException("Connection refused")).when(mailSender).send(any(SimpleMailMessage.class));

        dispatcher.dispatch(entry);

        assertThat(entry.getAttempts()).isEqualTo(1);
        assertThat(entry.getStatus()).isEqualTo("PENDING");
        assertThat(entry.getLastError()).contains("Connection refused");
        verify(outboxRepository).save(entry);
    }

    @Test
    void dispatch_repeatedFailures_marksFailedAfterMaxAttempts() {
        EmailOutbox entry = EmailOutbox.of("bad@host.mk", "Test", "body");
        entry.setAttempts(MAX_ATTEMPTS - 1);
        doThrow(new MailSendException("Timeout")).when(mailSender).send(any(SimpleMailMessage.class));

        dispatcher.dispatch(entry);

        assertThat(entry.getAttempts()).isEqualTo(MAX_ATTEMPTS);
        assertThat(entry.getStatus()).isEqualTo("FAILED");
        verify(outboxRepository).save(entry);
    }

    @Test
    void dispatch_failureBeforeMax_doesNotMarkFailed() {
        EmailOutbox entry = EmailOutbox.of("bad@host.mk", "Test", "body");
        entry.setAttempts(MAX_ATTEMPTS - 2);
        doThrow(new MailSendException("Timeout")).when(mailSender).send(any(SimpleMailMessage.class));

        dispatcher.dispatch(entry);

        assertThat(entry.getStatus()).isEqualTo("PENDING");
    }
}
