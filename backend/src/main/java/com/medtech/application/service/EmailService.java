package com.medtech.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Fire-and-forget email notifications. Each method is @Async so callers
 * return immediately; email delivery happens on the async executor thread pool.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@medtech.mk}")
    private String fromAddress;

    @Async
    public void sendAppointmentConfirmation(String toEmail,
                                            String patientName,
                                            String doctorName,
                                            LocalDate date,
                                            String time) {
        String subject = "Потврда за термин — " + date + " во " + time;
        String body = """
                Почитуван/а %s,

                Вашиот термин е успешно закажан:

                  Доктор : %s
                  Датум  : %s
                  Час    : %s

                Ако сакате да го откажете терминот, направете го тоа најмалку 24 часа однапред.

                Со почит,
                MedTech тим
                """.formatted(patientName, doctorName, date, time);
        send(toEmail, subject, body);
    }

    @Async
    public void sendAppointmentCancellation(String toEmail,
                                            String patientName,
                                            LocalDate date,
                                            String time) {
        String subject = "Откажан термин — " + date + " во " + time;
        String body = """
                Почитуван/а %s,

                Вашиот термин на %s во %s е откажан.

                Закажете нов термин преку MedTech порталот.

                Со почит,
                MedTech тим
                """.formatted(patientName, date, time);
        send(toEmail, subject, body);
    }

    @Async
    public void sendPasswordChangedNotice(String toEmail, String fullName) {
        String subject = "Вашата лозинка е сменета";
        String body = """
                Почитуван/а %s,

                Вашата лозинка за MedTech беше успешно сменета.
                Ако не сте го направиле ова, веднаш контактирајте не.

                Со почит,
                MedTech тим
                """.formatted(fullName);
        send(toEmail, subject, body);
    }

    private void send(String to, String subject, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("Email sent to={} subject='{}'", to, subject);
        } catch (MailException ex) {
            log.error("Failed to send email to={} subject='{}': {}", to, subject, ex.getMessage());
        }
    }
}
