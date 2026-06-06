package com.medtech.application.service;

import com.medtech.domain.repository.AppointmentRepository;
import com.medtech.domain.vo.AppointmentStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Collection;
import java.util.List;

import static com.medtech.application.service.AppointmentNoShowJob.GRACE_HOURS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppointmentNoShowJobTest {

    @Mock AppointmentRepository appointmentRepository;

    // Fixed "now" = 2026-06-06 10:00 UTC. Cutoff should be GRACE_HOURS earlier.
    final Clock fixedClock = Clock.fixed(
            ZonedDateTime.of(2026, 6, 6, 10, 0, 0, 0, ZoneId.of("UTC")).toInstant(),
            ZoneId.of("UTC"));

    private AppointmentNoShowJob job() {
        return new AppointmentNoShowJob(appointmentRepository, fixedClock);
    }

    @Test
    @SuppressWarnings("unchecked")
    void marksPastDue_usingGraceAdjustedCutoff_overOpenStatuses() {
        when(appointmentRepository.markPastDueAsNoShow(any(), any(), any(), any())).thenReturn(3);

        job().markPastDueNoShows();

        ArgumentCaptor<Collection<AppointmentStatus>> statuses = ArgumentCaptor.forClass(Collection.class);
        ArgumentCaptor<LocalDate> cutoffDate = ArgumentCaptor.forClass(LocalDate.class);
        ArgumentCaptor<LocalTime> cutoffTime = ArgumentCaptor.forClass(LocalTime.class);

        verify(appointmentRepository).markPastDueAsNoShow(
                eq(AppointmentStatus.NO_SHOW), statuses.capture(), cutoffDate.capture(), cutoffTime.capture());

        // now (10:00) - 24h grace -> 2026-06-05 10:00
        assertThat(cutoffDate.getValue()).isEqualTo(LocalDate.of(2026, 6, 5));
        assertThat(cutoffTime.getValue()).isEqualTo(LocalTime.of(10, 0));
        assertThat(GRACE_HOURS).isEqualTo(24);

        // Only open statuses are eligible — never terminal ones.
        assertThat(statuses.getValue())
                .containsExactlyInAnyOrder(AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED)
                .doesNotContain(AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW);
    }

    @Test
    void repositoryFailure_isSwallowed_soSchedulerKeepsRunning() {
        doThrow(new RuntimeException("db down"))
                .when(appointmentRepository).markPastDueAsNoShow(any(), any(), any(), any());

        // Must not propagate — a failed run should just retry next cycle.
        job().markPastDueNoShows();

        verify(appointmentRepository).markPastDueAsNoShow(any(), any(), any(), any());
    }
}
