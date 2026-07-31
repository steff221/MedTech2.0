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

/**
 * Сервис: бизнис-логика за операциите — закажување и менување статус.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OperationService {

    private final OperationRepository operationRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final HospitalRepository hospitalRepository;
    private final Icd10CatalogService icd10Catalog;

    @Transactional
    public Operation schedule(Long surgeonUserId, ScheduleOperationRequest req) {
        Doctor surgeon = doctorRepository.findByUserId(surgeonUserId)
                .orElseThrow(() -> new AuthorizationException("Само корисници со улога ЛЕКАР можат да закажуваат операции"));
        Patient patient = patientRepository.findById(req.patientId())
                .orElseThrow(() -> ResourceNotFoundException.of("Пациент", req.patientId()));
        Hospital hospital = hospitalRepository.findById(req.hospitalId())
                .orElseThrow(() -> ResourceNotFoundException.of("Болница", req.hospitalId()));

        Operation op = new Operation();
        op.setPatient(patient);
        op.setDoctor(surgeon);
        op.setHospital(hospital);
        op.setOperationName(req.operationName());
        icd10Catalog.requireValidCode(req.mkb10Code());
        op.setMkb10Code(req.mkb10Code());
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
    public Operation updateStatus(Long operationId, Long surgeonUserId, UpdateOperationStatusRequest req) {
        Operation op = getById(operationId);
        if (!op.getDoctor().getUser().getId().equals(surgeonUserId)) {
            throw new AuthorizationException(
                    "OPERATION_ACCESS_DENIED",
                    "Само хирургот доделен на оваа операција може да ја измени");
        }
        op.setStatus(req.status());
        if (req.complications() != null)        op.setComplications(req.complications());
        if (req.outcome() != null)              op.setOutcome(req.outcome());
        if (req.intraOperativeNotes() != null)  op.setIntraOperativeNotes(req.intraOperativeNotes());
        if (req.postOperativeNotes() != null)   op.setPostOperativeNotes(req.postOperativeNotes());
        return op;
    }

    public Operation getById(Long id) {
        return operationRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Операција", id));
    }

    public Page<Operation> forCurrentDoctor(Long userId, Pageable pageable) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new AuthorizationException("Само корисници со улога ЛЕКАР можат да ги гледаат своите операции"));
        return operationRepository.findByDoctorIdOrderByOperationDateDesc(doctor.getId(), pageable);
    }

    public Page<Operation> historyOf(Long patientId, Pageable pageable) {
        return operationRepository.findByPatientIdOrderByOperationDateDesc(patientId, pageable);
    }
}
