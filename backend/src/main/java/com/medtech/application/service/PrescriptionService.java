package com.medtech.application.service;

import com.medtech.application.dto.request.IssuePrescriptionRequest;
import com.medtech.constant.ErrorCode;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.MedicalRecord;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.entity.Prescription;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.MedicalRecordRepository;
import com.medtech.domain.repository.PatientRepository;
import com.medtech.domain.repository.PrescriptionRepository;
import com.medtech.domain.vo.PrescriptionStatus;
import com.medtech.domain.vo.UserStatus;
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
import java.time.LocalDate;

/**
 * Prescription lifecycle.
 *
 * <p>Business rules (system prompt, §"Prescriptions"):
 * <ul>
 *   <li>Issued only by an ACTIVE doctor holding a valid licence.</li>
 *   <li>Refills capped by {@code refills_allowed}.</li>
 *   <li>Refills rejected after {@code end_date}.</li>
 *   <li>Auto-expire when {@code end_date} has passed.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final Clock clock;

    @Transactional
    public Prescription issue(Long doctorUserId, IssuePrescriptionRequest req) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new AuthorizationException("Only DOCTOR users can issue prescriptions"));
        if (doctor.getStatus() != UserStatus.ACTIVE) {
            throw new AuthorizationException("Doctor account is not active");
        }
        Patient patient = patientRepository.findById(req.patientId())
                .orElseThrow(() -> ResourceNotFoundException.of("Patient", req.patientId()));
        MedicalRecord medicalRecord = null;
        if (req.medicalRecordId() != null) {
            medicalRecord = medicalRecordRepository.findById(req.medicalRecordId())
                    .orElseThrow(() -> ResourceNotFoundException.of("MedicalRecord", req.medicalRecordId()));
        }
        if (req.endDate() != null && req.endDate().isBefore(req.startDate())) {
            throw new ValidationException("Prescription end date must be on or after start date");
        }

        Prescription rx = new Prescription();
        rx.setPatient(patient);
        rx.setDoctor(doctor);
        rx.setMedicalRecord(medicalRecord);
        rx.setMedicationName(req.medicationName());
        rx.setDosage(req.dosage());
        rx.setFrequency(req.frequency());
        rx.setDurationDays(req.durationDays());
        rx.setQuantity(req.quantity());
        rx.setRoute(req.route());
        rx.setInstructions(req.instructions());
        rx.setStartDate(req.startDate());
        rx.setEndDate(req.endDate());
        rx.setRefillsAllowed(req.refillsAllowed() == null ? 0 : req.refillsAllowed());
        rx.setStatus(PrescriptionStatus.ACTIVE);

        Prescription saved = prescriptionRepository.save(rx);
        log.info("Issued prescription id={} patient={} medication={} refills={}",
                saved.getId(), patient.getId(), saved.getMedicationName(), saved.getRefillsAllowed());
        return saved;
    }

    @Transactional
    public Prescription refill(Long prescriptionId) {
        Prescription rx = getById(prescriptionId);

        if (rx.getStatus() != PrescriptionStatus.ACTIVE) {
            throw new ConflictException("Prescription is not ACTIVE; cannot refill");
        }
        if (rx.getEndDate() != null && rx.getEndDate().isBefore(LocalDate.now(clock))) {
            // Auto-expire and reject
            rx.setStatus(PrescriptionStatus.COMPLETED);
            throw new ConflictException(ErrorCode.PRESCRIPTION_EXPIRED,
                    "Prescription expired on " + rx.getEndDate());
        }
        if (rx.getRefillsUsed() >= rx.getRefillsAllowed()) {
            throw new ConflictException(ErrorCode.PRESCRIPTION_REFILLS_EXHAUSTED,
                    "No refills remaining (" + rx.getRefillsUsed() + " / " + rx.getRefillsAllowed() + ")");
        }
        rx.setRefillsUsed(rx.getRefillsUsed() + 1);
        log.info("Refilled prescription id={} ({}/{})",
                rx.getId(), rx.getRefillsUsed(), rx.getRefillsAllowed());
        return rx;
    }

    @Transactional
    public Prescription cancel(Long prescriptionId) {
        Prescription rx = getById(prescriptionId);
        if (rx.getStatus() == PrescriptionStatus.CANCELLED) {
            return rx;
        }
        rx.setStatus(PrescriptionStatus.CANCELLED);
        return rx;
    }

    public Prescription getById(Long id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Prescription", id));
    }

    public Page<Prescription> activeFor(Long patientId, Pageable pageable) {
        return prescriptionRepository.findByPatientIdAndStatus(patientId, PrescriptionStatus.ACTIVE, pageable);
    }

    public Page<Prescription> listFor(Long patientId, Pageable pageable) {
        return prescriptionRepository.findByPatientId(patientId, pageable);
    }
}
