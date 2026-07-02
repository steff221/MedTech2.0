package com.medtech.application.service;

import com.medtech.application.dto.request.BookAppointmentRequest;
import com.medtech.application.dto.request.CancelAppointmentRequest;
import com.medtech.application.dto.request.RescheduleAppointmentRequest;
import com.medtech.constant.ErrorCode;
import com.medtech.domain.entity.Appointment;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.Hospital;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.AppointmentRepository;
import com.medtech.domain.repository.DoctorAvailabilityRepository;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.PatientRepository;
import com.medtech.domain.vo.AppointmentStatus;
import com.medtech.domain.vo.UserRole;
import com.medtech.fixture.Entities;
import com.medtech.infrastructure.config.AppointmentProperties;
import com.medtech.infrastructure.exception.AppException;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.exception.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Unit тестови за AppointmentService (логика за термини).
 */
@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock AppointmentRepository appointmentRepository;
    @Mock PatientRepository patientRepository;
    @Mock DoctorRepository doctorRepository;
    @Mock DoctorAvailabilityRepository availabilityRepository;
    @Mock EmailService emailService;
    @Mock NotificationService notificationService;

    AppointmentService service;

    Patient patient;
    Doctor doctor;
    final Clock fixedClock = Clock.fixed(
            ZonedDateTime.of(2026, 6, 1, 10, 0, 0, 0, ZoneId.of("UTC")).toInstant(),
            ZoneId.of("UTC"));

    @BeforeEach
    void setUp() {
        Hospital hospital = Entities.hospital(1L);
        User patientUser = Entities.user(1L, UserRole.PATIENT);
        User doctorUser  = Entities.user(2L, UserRole.DOCTOR);
        patient = Entities.patient(10L, patientUser);
        doctor  = Entities.doctor(20L, doctorUser, hospital);

        AppointmentProperties props = new AppointmentProperties(30, 24);
        service = new AppointmentService(appointmentRepository, patientRepository,
                doctorRepository, availabilityRepository, props, fixedClock, emailService, notificationService);

        // No availability configured by default → validation skipped
        lenient().when(availabilityRepository.findByDoctorId(any())).thenReturn(List.of());

        lenient().when(patientRepository.findById(patient.getId())).thenReturn(Optional.of(patient));
        lenient().when(doctorRepository.findById(doctor.getId())).thenReturn(Optional.of(doctor));
        lenient().when(appointmentRepository.save(any(Appointment.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void book_rejectsPastDate() {
        var req = new BookAppointmentRequest(
                doctor.getId(), patient.getId(),
                LocalDate.of(2026, 5, 1), LocalTime.of(9, 0),
                null, null, "checkup", null);

        assertThatThrownBy(() -> service.book(req))
                .isInstanceOf(ValidationException.class)
                .extracting(t -> ((AppException) t).getErrorCode())
                .isEqualTo(ErrorCode.APPOINTMENT_IN_PAST);
    }

    @Test
    void book_rejectsConflictingSlot() {
        var existing = Entities.appointment(99L, patient, doctor,
                LocalDate.of(2026, 6, 2), "09:00", AppointmentStatus.SCHEDULED);
        when(appointmentRepository.lockConflicting(eq(doctor.getId()),
                eq(LocalDate.of(2026, 6, 2)), eq(LocalTime.of(9, 0)), any()))
                .thenReturn(new ArrayList<>(List.of(existing)));

        var req = new BookAppointmentRequest(
                doctor.getId(), patient.getId(),
                LocalDate.of(2026, 6, 2), LocalTime.of(9, 0), null, null, null, null);

        assertThatThrownBy(() -> service.book(req))
                .isInstanceOf(ConflictException.class)
                .extracting(t -> ((AppException) t).getErrorCode())
                .isEqualTo(ErrorCode.APPOINTMENT_CONFLICT);
    }

    @Test
    void book_succeedsAndDefaultsDurationFromProps() {
        when(appointmentRepository.lockConflicting(any(), any(), any(LocalTime.class), any()))
                .thenReturn(new ArrayList<>());

        var req = new BookAppointmentRequest(
                doctor.getId(), patient.getId(),
                LocalDate.of(2026, 6, 5), LocalTime.of(10, 30),
                null, null, "check", null);

        Appointment saved = service.book(req);

        assertThat(saved.getStatus()).isEqualTo(AppointmentStatus.SCHEDULED);
        assertThat(saved.getDurationMinutes()).isEqualTo(30);
        assertThat(saved.getDoctor()).isSameAs(doctor);
        assertThat(saved.getHospital()).isSameAs(doctor.getHospital());
    }

    @Test
    void cancel_insideWindowIsRejected() {
        // Appointment is at 2026-06-01 20:00 UTC, clock is 2026-06-01 10:00 UTC -> 10h away (<24h)
        Appointment appt = Entities.appointment(50L, patient, doctor,
                LocalDate.of(2026, 6, 1), "20:00", AppointmentStatus.SCHEDULED);
        when(appointmentRepository.findById(50L)).thenReturn(Optional.of(appt));

        assertThatThrownBy(() -> service.cancel(50L, new CancelAppointmentRequest("change of plans"), "patient"))
                .isInstanceOf(ValidationException.class)
                .extracting(t -> ((AppException) t).getErrorCode())
                .isEqualTo(ErrorCode.APPOINTMENT_CANCEL_WINDOW);
    }

    @Test
    void cancel_outsideWindowSucceeds() {
        Appointment appt = Entities.appointment(51L, patient, doctor,
                LocalDate.of(2026, 6, 5), "09:00", AppointmentStatus.SCHEDULED);
        when(appointmentRepository.findById(51L)).thenReturn(Optional.of(appt));

        Appointment cancelled = service.cancel(51L, new CancelAppointmentRequest("travel"), "patient");

        assertThat(cancelled.getStatus()).isEqualTo(AppointmentStatus.CANCELLED);
        assertThat(cancelled.getCancellationReason()).isEqualTo("travel");
        assertThat(cancelled.getCancelledBy()).isEqualTo("patient");
    }

    @Test
    void cancel_rejectsTerminalStatus() {
        Appointment appt = Entities.appointment(52L, patient, doctor,
                LocalDate.of(2026, 6, 5), "09:00", AppointmentStatus.COMPLETED);
        when(appointmentRepository.findById(52L)).thenReturn(Optional.of(appt));

        assertThatThrownBy(() -> service.cancel(52L, new CancelAppointmentRequest(null), "x"))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void reschedule_succeedsWhenNewSlotIsFree() {
        Appointment appt = Entities.appointment(60L, patient, doctor,
                LocalDate.of(2026, 6, 5), "09:00", AppointmentStatus.SCHEDULED);
        when(appointmentRepository.findById(60L)).thenReturn(Optional.of(appt));
        when(appointmentRepository.lockConflicting(any(), any(), any(LocalTime.class), any()))
                .thenReturn(new ArrayList<>());

        Appointment moved = service.reschedule(60L, new RescheduleAppointmentRequest(
                LocalDate.of(2026, 6, 6), LocalTime.of(11, 0)));

        assertThat(moved.getAppointmentDate()).isEqualTo(LocalDate.of(2026, 6, 6));
        assertThat(moved.getAppointmentTime()).isEqualTo(LocalTime.of(11, 0));
        assertThat(moved.getStatus()).isEqualTo(AppointmentStatus.RESCHEDULED);
    }
}
