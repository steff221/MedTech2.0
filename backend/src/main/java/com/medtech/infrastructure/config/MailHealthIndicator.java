package com.medtech.infrastructure.config;

import jakarta.mail.MessagingException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

/**
 * Проверка на поврзаноста со поштенскиот сервер.
 *
 * <p>Mail failures used to surface one message at a time: the outbox retried
 * five times per email and logged a warning each round, so a wrong credential
 * looked like sporadic noise rather than a broken subsystem. Meanwhile
 * registration and password reset silently produced accounts nobody could
 * verify — the user hit a dead end with no signal anywhere.
 *
 * <p>This checks the credential once at startup and exposes the result through
 * {@code /actuator/health}, so a bad configuration is visible to a deployment
 * check instead of being discovered by the first patient who tries to register.
 *
 * <p>Startup is deliberately <em>not</em> aborted. Mail is not on the critical
 * path for a clinician already holding an account, and taking the whole
 * application down over it would turn a degraded feature into an outage.
 */
@Slf4j
@Component
public class MailHealthIndicator implements HealthIndicator {

    private final JavaMailSenderImpl mailSender;

    /** Result of the last check, so health reporting does not reconnect per poll. */
    private volatile String lastError;
    private volatile boolean checked;

    public MailHealthIndicator(JavaMailSenderImpl mailSender) {
        this.mailSender = mailSender;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void verifyOnStartup() {
        check();
        if (lastError != null) {
            log.error("""
                    MAIL IS NOT USABLE — {}
                    Registration and password-reset emails will not be delivered.
                    Verify MEDTECH_MAIL_USERNAME / MEDTECH_MAIL_PASSWORD. For Gmail the password
                    must be a 16-character App Password (no spaces), not the account password.""",
                    lastError);
        } else {
            log.info("Mail server reachable and credentials accepted ({})", mailSender.getHost());
        }
    }

    private void check() {
        try {
            mailSender.testConnection();
            lastError = null;
        } catch (MessagingException | IllegalStateException ex) {
            // The SMTP reply carries the actionable part ("Username and Password
            // not accepted"), so it is kept verbatim rather than summarised.
            lastError = ex.getMessage() == null ? ex.toString() : ex.getMessage().strip();
        } finally {
            checked = true;
        }
    }

    @Override
    public Health health() {
        if (!checked) {
            check();
        }
        if (lastError == null) {
            return Health.up().withDetail("host", mailSender.getHost()).build();
        }
        // Reported UP with a false `deliverable` flag rather than DOWN or
        // OUT_OF_SERVICE. Every non-UP indicator drags down the aggregate that
        // the container healthcheck and load balancer read, so reporting the
        // truth about mail here would pull a perfectly serving application out
        // of rotation and restart-loop it — turning a degraded feature into an
        // outage. The condition is still visible in the details and shouted
        // once at startup.
        return Health.up()
                .withDetail("host", mailSender.getHost())
                .withDetail("deliverable", false)
                .withDetail("error", lastError)
                .build();
    }
}
