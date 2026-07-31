package com.medtech.application.service;


import com.medtech.application.dto.request.BookAppointmentRequest;
import com.medtech.application.dto.request.CancelAppointmentRequest;
import com.medtech.application.dto.request.RescheduleAppointmentRequest;
import com.medtech.constant.ErrorCode;
import com.medtech.domain.entity.Appointment;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.DoctorAvailability;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.repository.AppointmentRepository;
import com.medtech.domain.repository.DoctorAvailabilityRepository;
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
 *
 * Сервис: бизнис-логика за термини — закажување, презакажување, откажување и потврдување.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final AppointmentProperties props;
    private final Clock clock;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Transactional
    public Appointment book(BookAppointmentRequest req) {
        if (req.appointmentDate().isBefore(LocalDate.now(clock))) {
            throw new ValidationException(ErrorCode.APPOINTMENT_IN_PAST,
                    "Датумот на терминот не може да биде во минатото");
        }

        Patient patient = patientRepository.findById(Objects.requireNonNull(req.patientId()))
                .orElseThrow(() -> ResourceNotFoundException.of("Пациент", req.patientId()));
        Doctor doctor = doctorRepository.findById(Objects.requireNonNull(req.doctorId()))
                .orElseThrow(() -> ResourceNotFoundException.of("Лекар", req.doctorId()));

        // Validate against doctor's configured working hours (if any have been set).
        List<DoctorAvailability> slots = availabilityRepository.findByDoctorId(doctor.getId());
        if (!slots.isEmpty()) {
            int dow = req.appointmentDate().getDayOfWeek().getValue();
            DoctorAvailability slot = slots.stream()
                    .filter(s -> s.getDayOfWeek() == dow && s.isActive())
                    .findFirst()
                    .orElseThrow(() -> new ValidationException(
                            ErrorCode.APPOINTMENT_OUTSIDE_AVAILABILITY,
                            "Лекарот не е достапен во " + dayNameMk(req.appointmentDate().getDayOfWeek())));
            LocalTime apptTime = req.appointmentTime();
            if (apptTime.isBefore(slot.getStartTime()) || !apptTime.isBefore(slot.getEndTime())) {
                throw new ValidationException(
                        ErrorCode.APPOINTMENT_OUTSIDE_AVAILABILITY,
                        "Часот на терминот " + apptTime + " е надвор од работното време ("
                                + slot.getStartTime() + "–" + slot.getEndTime() + ")");
            }
        }

        // Pessimistic lock on existing same-slot rows to prevent the classic
        // double-booking race between two concurrent transactions.
        var conflicts = appointmentRepository.lockConflicting(
                doctor.getId(), req.appointmentDate(), req.appointmentTime(),
                List.of(AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED));
        if (!conflicts.isEmpty()) {
            throw new ConflictException(ErrorCode.APPOINTMENT_CONFLICT,
                    "Лекарот веќе има термин на " + req.appointmentDate()
                            + " " + req.appointmentTime());
        }

        var patientConflicts = appointmentRepository.lockPatientConflicting(
                patient.getId(), req.appointmentDate(), req.appointmentTime(),
                List.of(AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED));
        if (!patientConflicts.isEmpty()) {
            throw new ConflictException(ErrorCode.APPOINTMENT_CONFLICT,
                    "Веќе имате термин на " + req.appointmentDate()
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

        // Email and in-app notification are best-effort — a transient failure must not roll back the booking.
        try {
            emailService.sendAppointmentConfirmation(patientEmail, patientName, doctorName,
                    saved.getAppointmentDate(), saved.getAppointmentTime());
        } catch (Exception ex) {
            log.warn("Appointment confirmation email failed for appointment id={}: {}", saved.getId(), ex.getMessage());
        }

        try {
            Long doctorUserId = doctor.getUser().getId();
            notificationService.create(doctorUserId, "APPOINTMENT_REMINDER",
                    "Нов термин закажан",
                    patientName + ", " + saved.getAppointmentDate() + " во " + saved.getAppointmentTime(),
                    saved.getId());
        } catch (Exception ex) {
            log.warn("Doctor booking notification failed for appointment id={}: {}", saved.getId(), ex.getMessage());
        }

        return saved;
    }

    @Transactional
    public Appointment reschedule(Long appointmentId, RescheduleAppointmentRequest req) {
        Appointment appt = getById(appointmentId);
        rejectIfTerminal(appt);

        // Lock doctor slot first, then patient slot — same order as book() to prevent deadlock
        var conflicts = appointmentRepository.lockConflicting(
                appt.getDoctor().getId(), req.newDate(), req.newTime(),
                List.of(AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED));
        conflicts.removeIf(c -> c.getId().equals(appt.getId()));
        if (!conflicts.isEmpty()) {
            throw new ConflictException(ErrorCode.APPOINTMENT_CONFLICT,
                    "Лекарот е веќе зафатен во бараниот термин");
        }

        var patientConflicts = appointmentRepository.lockPatientConflicting(
                appt.getPatient().getId(), req.newDate(), req.newTime(),
                List.of(AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED));
        patientConflicts.removeIf(c -> c.getId().equals(appt.getId()));
        if (!patientConflicts.isEmpty()) {
            throw new ConflictException(ErrorCode.APPOINTMENT_CONFLICT,
                    "Веќе имате закажано во бараниот термин");
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
                    "Не може да се откаже помалку од " + props.cancellationWindowHours() + " часа пред терминот");
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
                doctorName + ", " + appt.getAppointmentDate() + " во " + appt.getAppointmentTime(),
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
                doctorName + ", " + appt.getAppointmentDate() + " во " + appt.getAppointmentTime(),
                appt.getId());

        return appt;
    }

    @Transactional
    public Appointment markNoShow(Long appointmentId) {
        Appointment appt = getById(appointmentId);
        rejectIfTerminal(appt);
        appt.setStatus(AppointmentStatus.NO_SHOW);
        log.info("Appointment id={} marked NO_SHOW", appointmentId);
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
                .orElseThrow(() -> ResourceNotFoundException.of("Термин", id));
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

    /** Македонско име на денот — исклучоците се читаат од корисникот. */
    private static String dayNameMk(java.time.DayOfWeek day) {
        return switch (day) {
            case MONDAY    -> "понеделник";
            case TUESDAY   -> "вторник";
            case WEDNESDAY -> "среда";
            case THURSDAY  -> "четврток";
            case FRIDAY    -> "петок";
            case SATURDAY  -> "сабота";
            case SUNDAY    -> "недела";
        };
    }

    private static void rejectIfTerminal(Appointment appt) {
        if (appt.getStatus().isTerminal()) {
            throw new ConflictException("Терминот е веќе " + appt.getStatus());
        }
    }
}
