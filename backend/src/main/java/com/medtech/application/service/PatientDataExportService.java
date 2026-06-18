package com.medtech.application.service;

import com.medtech.application.dto.mapper.AppointmentMapper;
import com.medtech.application.dto.mapper.MedicalRecordMapper;
import com.medtech.application.dto.mapper.OperationMapper;
import com.medtech.application.dto.mapper.PatientMapper;
import com.medtech.application.dto.mapper.PrescriptionMapper;
import com.medtech.application.dto.mapper.ReferralMapper;
import com.medtech.application.dto.response.PatientDataExportResponse;
import com.medtech.domain.entity.Patient;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Assembles the full GDPR subject-access export for one patient.
 * Callers are responsible for authorization (the patient themself) and for
 * writing the audit row — every export is a PHI disclosure.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PatientDataExportService {

    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final MedicalRecordService medicalRecordService;
    private final PrescriptionService prescriptionService;
    private final ReferralService referralService;
    private final OperationService operationService;

    private final PatientMapper patientMapper;
    private final AppointmentMapper appointmentMapper;
    private final MedicalRecordMapper medicalRecordMapper;
    private final PrescriptionMapper prescriptionMapper;
    private final ReferralMapper referralMapper;
    private final OperationMapper operationMapper;

    public PatientDataExportResponse exportForUser(Long userId) {
        Patient patient = patientService.getByUserId(userId);
        Long patientId = patient.getId();
        Pageable all = Pageable.unpaged();

        return new PatientDataExportResponse(
                Instant.now(),
                patientMapper.toResponse(patient),
                appointmentService.listForPatient(patientId, all).map(appointmentMapper::toResponse).getContent(),
                medicalRecordService.historyOf(patientId, all).map(medicalRecordMapper::toResponse).getContent(),
                prescriptionService.listFor(patientId, all).map(prescriptionMapper::toResponse).getContent(),
                referralService.listByPatient(patientId, all).map(referralMapper::toResponse).getContent(),
                operationService.historyOf(patientId, all).map(operationMapper::toResponse).getContent()
        );
    }
}
