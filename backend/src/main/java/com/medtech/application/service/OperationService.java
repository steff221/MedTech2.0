package com.medtech.application.service;

import com.medtech.application.dto.request.ScheduleOperationRequest;
import com.medtech.application.dto.request.UpdateOperationStatusRequest;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.Hospital;
import com.medtech.domain.entity.Operation;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.HospitalRepository;
import com.medtech.domain.repository.OperationRepository;
import com.medtech.domain.repository.PatientRepository;
import com.medtech.domain.vo.OperationStatus;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OperationService {

    private final OperationRepository operationRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final HospitalRepository hospitalRepository;

    @Transactional
    public Operation schedule(Long surgeonUserId, ScheduleOperationRequest req) {
        Doctor surgeon = doctorRepository.findByUserId(surgeonUserId)
                .orElseThrow(() -> new AuthorizationException("Only DOCTOR users can schedule operations"));
        Patient patient = patientRepository.findById(req.patientId())
                .orElseThrow(() -> ResourceNotFoundException.of("Patient", req.patientId()));
        Hospital hospital = hospitalRepository.findById(req.hospitalId())
                .orElseThrow(() -> ResourceNotFoundException.of("Hospital", req.hospitalId()));

        Operation op = new Operation();
        op.setPatient(patient);
        op.setDoctor(surgeon);
        op.setHospital(hospital);
        op.setOperationName(req.operationName());
        op.setOperationDate(req.operationDate());
        op.setOperationTime(req.operationTime());
        op.setDurationMinutes(req.durationMinutes());
        op.setOperationRoom(req.operationRoom());
        op.setSurgicalTeam(req.surgicalTeam());
        op.setAnesthesiaType(req.anesthesiaType());
        op.setAnesthesiologist(req.anesthesiologist());
        op.setPreOperativeNotes(req.preOperativeNotes());
        op.setImplantsUsed(req.implantsUsed());
        op.setStatus(OperationStatus.SCHEDULED);

        Operation saved = operationRepository.save(op);
        log.info("Scheduled operation id={} '{}' for patient={} on {}",
                saved.getId(), saved.getOperationName(), patient.getId(), saved.getOperationDate());
        return saved;
    }

    @Transactional
    public Operation updateStatus(Long operationId, UpdateOperationStatusRequest req) {
        Operation op = getById(operationId);
        op.setStatus(req.status());
        if (req.complications() != null)        op.setComplications(req.complications());
        if (req.outcome() != null)              op.setOutcome(req.outcome());
        if (req.intraOperativeNotes() != null)  op.setIntraOperativeNotes(req.intraOperativeNotes());
        if (req.postOperativeNotes() != null)   op.setPostOperativeNotes(req.postOperativeNotes());
        return op;
    }

    public Operation getById(Long id) {
        return operationRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Operation", id));
    }

    public Page<Operation> forCurrentDoctor(Long userId, Pageable pageable) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new AuthorizationException("Only DOCTOR users can view their operations"));
        return operationRepository.findByDoctorIdOrderByOperationDateDesc(doctor.getId(), pageable);
    }

    public Page<Operation> historyOf(Long patientId, Pageable pageable) {
        return operationRepository.findByPatientIdOrderByOperationDateDesc(patientId, pageable);
    }
}
