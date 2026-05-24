package com.medtech.application.service;

import com.medtech.domain.entity.EmailOutbox;
import com.medtech.domain.repository.EmailOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Writes email intents to the outbox table within the caller's transaction.
 * Actual SMTP delivery is handled by {@link EmailDispatchJob} which polls
 * the outbox on a schedule with automatic retry.
 *
 * <p>This is the Transactional Outbox pattern: if the caller's transaction
 * rolls back, the outbox row is rolled back too — no spurious emails sent.
 * If SMTP is down, the row stays PENDING and will be retried automatically.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final EmailOutboxRepository outboxRepository;

    public void sendAppointmentConfirmation(String toEmail,
                                            String patientName,
                                            String doctorName,
                                            LocalDate date,
                                            String time) {
        enqueue(toEmail,
                "Потврда за термин — " + date + " во " + time,
                """
                Почитуван/а %s,

                Вашиот термин е успешно закажан:

                  Доктор : %s
                  Датум  : %s
                  Час    : %s

                Ако сакате да го откажете терминот, направете го тоа најмалку 24 часа однапред.

                Со почит,
                MedTech тим
                """.formatted(patientName, doctorName, date, time));
    }

    public void sendAppointmentCancellation(String toEmail,
                                            String patientName,
                                            LocalDate date,
                                            String time) {
        enqueue(toEmail,
                "Откажан термин — " + date + " во " + time,
                """
                Почитуван/а %s,

                Вашиот термин на %s во %s е откажан.

                Закажете нов термин преку MedTech порталот.

                Со почит,
                MedTech тим
                """.formatted(patientName, date, time));
    }

    public void sendInviteEmail(String toEmail, String fullName, String role, String setupLink) {
        enqueue(toEmail,
                "Покана за MedTech — поставете ја вашата лозинка",
                """
                Почитуван/а %s,

                Вие бевте поканети да се приклучите на MedTech платформата како %s.

                Кликнете на линкот подолу за да ја поставите вашата лозинка и да ја активирате сметката (важи 48 часа):

                  %s

                Ако мислите дека ова е грешка, игнорирајте ја оваа порака.

                Со почит,
                MedTech тим
                """.formatted(fullName, role, setupLink));
    }

    public void sendEmailVerification(String toEmail, String fullName, String verifyLink) {
        enqueue(toEmail,
                "Потврдете ја вашата е-пошта — MedTech",
                """
                Почитуван/а %s,

                Добредојдовте во MedTech! Кликнете на линкот подолу за да ја потврдите е-поштата (важи 24 часа):

                  %s

                Ако не сте се регистрирале, игнорирајте ја оваа порака.

                Со почит,
                MedTech тим
                """.formatted(fullName, verifyLink));
    }

    public void sendPasswordResetEmail(String toEmail, String fullName, String resetLink) {
        enqueue(toEmail,
                "Ресетирање на лозинка — MedTech",
                """
                Почитуван/а %s,

                Примивме барање за ресетирање на лозинката за вашата сметка.
                Кликнете на линкот подолу (важи 30 минути):

                  %s

                Ако не сте го побарале ова, игнорирајте ја оваа порака — вашата лозинка останува непроменета.

                Со почит,
                MedTech тим
                """.formatted(fullName, resetLink));
    }

    public void sendPasswordChangedNotice(String toEmail, String fullName) {
        enqueue(toEmail,
                "Вашата лозинка е сменета",
                """
                Почитуван/а %s,

                Вашата лозинка за MedTech беше успешно сменета.
                Ако не сте го направиле ова, веднаш контактирајте не.

                Со почит,
                MedTech тим
                """.formatted(fullName));
    }

    private void enqueue(String to, String subject, String body) {
        outboxRepository.save(EmailOutbox.of(to, subject, body));
        log.debug("Email queued for delivery: to={} subject='{}'", to, subject);
    }
}
