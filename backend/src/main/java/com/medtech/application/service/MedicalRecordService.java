package com.medtech.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtech.application.dto.request.CreateMedicalRecordRequest;
import com.medtech.constant.ErrorCode;
import com.medtech.domain.entity.Appointment;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.MedicalRecord;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.repository.AppointmentRepository;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.MedicalRecordRepository;
import com.medtech.domain.repository.PatientRepository;
import com.medtech.domain.vo.AppointmentStatus;
import com.medtech.infrastructure.exception.AuthorizationException;
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
import java.time.Duration;
import java.time.Instant;

/**
 * SOAP-shaped medical-record lifecycle.
 *
 * <p>Business rules (system prompt, §"Medical Records"):
 * <ul>
 *   <li>Only the doctor associated with the appointment (or any doctor when no
 *       appointment is supplied) can create the record.</li>
 *   <li>Records become immutable after 7 days (regulatory anti-tampering).</li>
 *   <li>Confidentiality flag is set at creation time; toggle requires special
 *       permission (Phase 5 — currently rejected post-creation).</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MedicalRecordService {

    public static final Duration MUTABILITY_WINDOW = Duration.ofDays(7);

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Transactional
    public MedicalRecord create(Long authorUserId, CreateMedicalRecordRequest req) {
        Doctor doctor = doctorRepository.findByUserId(authorUserId)
                .orElseThrow(() -> new AuthorizationException("Only DOCTOR users can create medical records"));
        Patient patient = patientRepository.findById(req.patientId())
                .orElseThrow(() -> ResourceNotFoundException.of("Patient", req.patientId()));

        Appointment appointment = null;
        if (req.appointmentId() != null) {
            appointment = appointmentRepository.findById(req.appointmentId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Appointment", req.appointmentId()));
            if (!appointment.getDoctor().getId().equals(doctor.getId())) {
                throw new AuthorizationException("Only the assigned doctor may create the medical record for this appointment");
            }
            if (!appointment.getPatient().getId().equals(patient.getId())) {
                throw new ValidationException("Patient does not match the appointment");
            }
        }

        MedicalRecord record = new MedicalRecord();
        record.setPatient(patient);
        record.setDoctor(doctor);
        record.setHospital(doctor.getHospital());
        record.setAppointment(appointment);
        record.setDiagnosis(req.diagnosis());
        record.setMkb10Code(req.mkb10Code());
        record.setClinicalNotes(req.clinicalNotes());
        record.setVitalSignsJson(serializeVitalSigns(req));
        record.setBloodPressure(req.bloodPressure());
        record.setHeartRate(req.heartRate());
        record.setTemperature(req.temperature());
        record.setWeight(req.weight());
        record.setHeight(req.height());
        record.setBmi(req.bmi());
        record.setAssessment(req.assessment());
        record.setPlan(req.plan());
        record.setConfidential(req.confidential());

        MedicalRecord saved = medicalRecordRepository.save(record);

        // Auto-progress the parent appointment to COMPLETED if it was still SCHEDULED/RESCHEDULED.
        if (appointment != null && !appointment.getStatus().isTerminal()) {
            appointment.setStatus(AppointmentStatus.COMPLETED);
        }

        log.info("Created medical record id={} patient={} doctor={} confidential={}",
                saved.getId(), patient.getId(), doctor.getId(), saved.isConfidential());
        return saved;
    }

    public MedicalRecord getById(Long id) {
        return medicalRecordRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("MedicalRecord", id));
    }

    public Page<MedicalRecord> historyOf(Long patientId, Pageable pageable) {
        return medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patientId, pageable);
    }

    /**
     * Permission check for any future "edit medical record" endpoint.
     * Throws when the record is older than {@link #MUTABILITY_WINDOW}.
     */
    public void assertMutable(MedicalRecord record) {
        if (Instant.now(clock).isAfter(record.getCreatedAt().plus(MUTABILITY_WINDOW))) {
            throw new ConflictException(ErrorCode.MEDICAL_RECORD_IMMUTABLE,
                    "Medical record is older than " + MUTABILITY_WINDOW.toDays() + " days and is immutable");
        }
    }

    private String serializeVitalSigns(CreateMedicalRecordRequest req) {
        if (req.vitalSigns() == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(req.vitalSigns());
        } catch (JsonProcessingException e) {
            throw new ValidationException("Invalid vital signs payload: " + e.getOriginalMessage());
        }
    }
}
