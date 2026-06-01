package com.medtech.infrastructure.security;

import com.medtech.application.service.PatientService;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.repository.AppointmentRepository;
import com.medtech.infrastructure.exception.AuthorizationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Centralises the "may the current user read this patient's data?" rule.
 *
 * <p>Rules:
 * <ul>
 *   <li>{@code DOCTOR} — allowed only when they have at least one appointment
 *       with the patient (any status). This verifies a care relationship.</li>
 *   <li>{@code NURSE} — allowed for any patient (clinical coordination role;
 *       no hospital-affiliation entity exists yet to scope further).</li>
 *   <li>{@code PATIENT} — allowed only for their own record.</li>
 *   <li>{@code ADMIN} — allowed for any patient.</li>
 *   <li>Anyone else — denied.</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
public class PatientAccessGuard {

    private final PatientService patientService;
    private final AppointmentRepository appointmentRepository;

    public void assertCanAccessPatient(Long patientId) {
        Long currentUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));

        if (SecurityUtils.hasRole("ADMIN")) {
            return;
        }

        if (SecurityUtils.hasRole("DOCTOR") || SecurityUtils.hasRole("GENERAL_PRACTITIONER")) {
            if (!appointmentRepository.hasCareRelationship(currentUserId, patientId)) {
                throw new AuthorizationException(
                        "PATIENT_ACCESS_DENIED",
                        "No care relationship found between this doctor and the requested patient");
            }
            return;
        }

        // NURSE: PHI access blocked until hospital-scoped Nurse entity is implemented.
        // Granting blanket access to all patients is a known privacy gap — deny until scoped.
        if (SecurityUtils.hasRole("NURSE")) {
            throw new AuthorizationException(
                    "NURSE_PHI_ACCESS_DISABLED",
                    "Nurse access to patient records is not yet enabled. Contact your administrator.");
        }

        if (SecurityUtils.hasRole("PATIENT")) {
            Patient p = patientService.getById(patientId);
            if (!p.getUser().getId().equals(currentUserId)) {
                throw new AuthorizationException("Patients may only access their own records");
            }
            return;
        }

        throw new AuthorizationException("Insufficient privileges");
    }
}
