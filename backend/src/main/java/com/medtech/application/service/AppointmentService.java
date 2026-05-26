package com.medtech.application.service;


import com.medtech.application.dto.request.BookAppointmentRequest;
import com.medtech.application.dto.request.CancelAppointmentRequest;
import com.medtech.application.dto.request.RescheduleAppointmentRequest;
import com.medtech.constant.ErrorCode;
import com.medtech.domain.entity.Appointment;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.repository.AppointmentRepository;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.PatientRepository;
import com.medtech.domain.vo.AppointmentStatus;
import com.medtech.infrastructure.config.AppointmentProperties;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import com.medtech.infrastructure.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

/**
 * Appointment lifecycle: booking, rescheduling, cancellation, completion.
 *
 * <p>Business rules (system prompt, §"Appointments"):
 * <ul>
 *   <li>Cannot book in the past.</li>
 *   <li>No double-booking the same doctor at the same date+time
 *       — enforced under {@code PESSIMISTIC_WRITE}.</li>
 *   <li>Cancellation only outside the configured cancellation window
 *       (default 24h before).</li>
 *   <li>Status transitions out of {@link AppointmentStatus#isTerminal() terminal}
 *       states are rejected.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentProperties props;
    private final Clock clock;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Transactional
    public Appointment book(BookAppointmentRequest req) {
        if (req.appointmentDate().isBefore(LocalDate.now(clock))) {
            throw new ValidationException(ErrorCode.APPOINTMENT_IN_PAST,
                    "Appointment date cannot be in the past");
        }

        Patient patient = patientRepository.findById(Objects.requireNonNull(req.patientId()))
                .orElseThrow(() -> ResourceNotFoundException.of("Patient", req.patientId()));
        Doctor doctor = doctorRepository.findById(Objects.requireNonNull(req.doctorId()))
                .orElseThrow(() -> ResourceNotFoundException.of("Doctor", req.doctorId()));

        // Pessimistic lock on existing same-slot rows to prevent the classic
        // double-booking race between two concurrent transactions.
        var conflicts = appointmentRepository.lockConflicting(
                doctor.getId(), req.appointmentDate(), req.appointmentTime(),
                List.of(AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED));
        if (!conflicts.isEmpty()) {
            throw new ConflictException(ErrorCode.APPOINTMENT_CONFLICT,
                    "Doctor already has an appointment at " + req.appointmentDate()
                            + " " + req.appointmentTime());
        }

        Appointment appt = new Appointment();
        appt.setPatient(patient);
        appt.setDoctor(doctor);
        appt.setHospital(doctor.getHospital());
        appt.setAppointmentDate(req.appointmentDate());
        appt.setAppointmentTime(req.appointmentTime());
        appt.setDurationMinutes(req.durationMinutes() == null
                ? props.defaultDurationMinutes() : req.durationMinutes());
        appt.setAppointmentType(req.appointmentType());
        appt.setReason(req.reason());
        appt.setNotes(req.notes());
        appt.setStatus(AppointmentStatus.SCHEDULED);

        Appointment saved = appointmentRepository.save(appt);
        log.info("Booked appointment id={} doctor={} patient={} at {} {}",
                saved.getId(), doctor.getId(), patient.getId(),
                saved.getAppointmentDate(), saved.getAppointmentTime());

        String patientEmail = patient.getUser().getEmail();
        String patientName  = patient.getUser().getFirstName() + " " + patient.getUser().getLastName();
        String doctorName   = "д-р " + doctor.getUser().getFirstName() + " " + doctor.getUser().getLastName();
        emailService.sendAppointmentConfirmation(patientEmail, patientName, doctorName,
                saved.getAppointmentDate(), saved.getAppointmentTime());

        return saved;
    }

    @Transactional
    public Appointment reschedule(Long appointmentId, RescheduleAppointmentRequest req) {
        Appointment appt = getById(appointmentId);
        rejectIfTerminal(appt);

        var conflicts = appointmentRepository.lockConflicting(
                appt.getDoctor().getId(), req.newDate(), req.newTime(),
                List.of(AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED));
        // Exclude self from conflict detection (e.g. moving inside same slot is a no-op but allowed)
        conflicts.removeIf(c -> c.getId().equals(appt.getId()));
        if (!conflicts.isEmpty()) {
            throw new ConflictException(ErrorCode.APPOINTMENT_CONFLICT,
                    "Doctor already booked at the requested slot");
        }

        appt.setAppointmentDate(req.newDate());
        appt.setAppointmentTime(req.newTime());
        appt.setStatus(AppointmentStatus.RESCHEDULED);
        return appt;
    }

    @Transactional
    public Appointment cancel(Long appointmentId, CancelAppointmentRequest req, String cancelledBy) {
        Appointment appt = getById(appointmentId);
        rejectIfTerminal(appt);

        LocalDateTime startsAt = LocalDateTime.of(
                appt.getAppointmentDate(),
                appt.getAppointmentTime());
        long hoursUntil = ChronoUnit.HOURS.between(LocalDateTime.now(clock), startsAt);
        if (hoursUntil < props.cancellationWindowHours()) {
            throw new ValidationException(ErrorCode.APPOINTMENT_CANCEL_WINDOW,
                    "Cannot cancel within " + props.cancellationWindowHours() + " hours of the appointment");
        }

        appt.setStatus(AppointmentStatus.CANCELLED);
        appt.setCancelledBy(cancelledBy);
        appt.setCancellationReason(req.reason());

        String patientEmail = appt.getPatient().getUser().getEmail();
        String patientName  = appt.getPatient().getUser().getFirstName()
                + " " + appt.getPatient().getUser().getLastName();
        emailService.sendAppointmentCancellation(patientEmail, patientName,
                appt.getAppointmentDate(), appt.getAppointmentTime());

        Long patientUserId = appt.getPatient().getUser().getId();
        String doctorName = "д-р " + appt.getDoctor().getUser().getFirstName()
                + " " + appt.getDoctor().getUser().getLastName();
        notificationService.create(patientUserId, "CANCELLED",
                "Термин откажан",
                doctorName + " — " + appt.getAppointmentDate() + " во " + appt.getAppointmentTime(),
                appt.getId());

        return appt;
    }

    @Transactional
    public Appointment complete(Long appointmentId) {
        Appointment appt = getById(appointmentId);
        rejectIfTerminal(appt);
        appt.setStatus(AppointmentStatus.COMPLETED);

        Long patientUserId = appt.getPatient().getUser().getId();
        String doctorName = "д-р " + appt.getDoctor().getUser().getFirstName()
                + " " + appt.getDoctor().getUser().getLastName();
        notificationService.create(patientUserId, "COMPLETED",
                "Термин завршен",
                doctorName + " — " + appt.getAppointmentDate() + " во " + appt.getAppointmentTime(),
                appt.getId());

        return appt;
    }

    @Transactional
    public Appointment setVideoCallUrl(Long appointmentId, String url) {
        Appointment appt = getById(appointmentId);
        appt.setVideoCallUrl(url);
        return appt;
    }

    public Appointment getById(Long id) {
        return appointmentRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> ResourceNotFoundException.of("Appointment", id));
    }

    public Page<Appointment> listForPatient(Long patientId, Pageable pageable) {
        return appointmentRepository.findByPatientId(patientId, pageable);
    }

    public Page<Appointment> listForDoctorOn(Long doctorId, LocalDate date, Pageable pageable) {
        return appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, date, pageable);
    }

    public Page<Appointment> listForDoctorInRange(Long doctorId, LocalDate from, LocalDate to, Pageable pageable) {
        return appointmentRepository.findByDoctorIdAndAppointmentDateBetween(doctorId, from, to, pageable);
    }

    public List<Appointment> listForDate(LocalDate date) {
        return appointmentRepository.findAllByAppointmentDate(date);
    }

    private static void rejectIfTerminal(Appointment appt) {
        if (appt.getStatus().isTerminal()) {
            throw new ConflictException("Appointment is already " + appt.getStatus());
        }
    }
}
