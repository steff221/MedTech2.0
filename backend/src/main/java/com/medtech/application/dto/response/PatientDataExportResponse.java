package com.medtech.application.dto.response;

import java.time.Instant;
import java.util.List;

/**
 * Complete machine-readable copy of one patient's data, fulfilling the GDPR
 * right of access / data portability (Art. 15 & 20). Clinical records are
 * exempt from the right to erasure (Art. 17(3)(b) — legal retention), so
 * export is the supported subject-access mechanism.
 */
public record PatientDataExportResponse(
        Instant generatedAt,
        PatientResponse profile,
        List<AppointmentResponse> appointments,
        List<MedicalRecordResponse> medicalRecords,
        List<PrescriptionResponse> prescriptions,
        List<ReferralResponse> referrals,
        List<OperationResponse> operations
) {}
