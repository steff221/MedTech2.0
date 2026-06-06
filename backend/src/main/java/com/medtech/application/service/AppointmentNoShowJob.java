package com.medtech.application.service;

import com.medtech.domain.repository.AppointmentRepository;
import com.medtech.domain.vo.AppointmentStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Hourly job that closes the appointment lifecycle: any still-open (SCHEDULED or
 * RESCHEDULED) appointment whose scheduled date+time passed more than
 * {@value #GRACE_HOURS} hours ago is marked {@link AppointmentStatus#NO_SHOW}.
 *
 * <p><b>Why this exists:</b> COMPLETED is set automatically when a doctor writes the
 * visit's medical record, but nothing previously produced the NO_SHOW outcome unless a
 * human clicked it. That left missed visits stuck as SCHEDULED forever — so they never
 * became a training label for the no-show model, starving its positive class. This job
 * turns real missed appointments into real labels.
 *
 * <p><b>Why the grace period is generous:</b> marking NO_SHOW is terminal, and
 * {@code MedicalRecordService} only flips an appointment to COMPLETED while it is
 * <i>non-terminal</i>. A wide grace window therefore lets late same-day/next-day
 * documentation win first, so we only flag genuinely-missed visits.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentNoShowJob {

    /** Hours after the scheduled time before an open appointment is deemed a no-show. */
    static final long GRACE_HOURS = 24;

    private static final List<AppointmentStatus> OPEN_STATUSES =
            List.of(AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED);

    private final AppointmentRepository appointmentRepository;
    private final Clock clock;

    @Scheduled(cron = "0 30 * * * *") // hourly, at minute 30
    @Transactional
    public void markPastDueNoShows() {
        try {
            LocalDateTime cutoff = LocalDateTime.now(clock).minusHours(GRACE_HOURS);
            int count = appointmentRepository.markPastDueAsNoShow(
                    AppointmentStatus.NO_SHOW, OPEN_STATUSES,
                    cutoff.toLocalDate(), cutoff.toLocalTime());
            if (count > 0) {
                log.info("AppointmentNoShowJob: marked {} past-due appointment(s) as NO_SHOW "
                        + "(grace {}h, cutoff {})", count, GRACE_HOURS, cutoff);
            }
        } catch (Exception ex) {
            log.error("AppointmentNoShowJob failed — past-due appointments may not have been "
                    + "marked: {}", ex.getMessage(), ex);
        }
    }
}
