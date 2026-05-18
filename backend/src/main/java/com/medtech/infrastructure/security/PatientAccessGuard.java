package com.medtech.infrastructure.security;

import com.medtech.application.service.PatientService;
import com.medtech.domain.entity.Patient;
import com.medtech.infrastructure.exception.AuthorizationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Centralises the "may the current user read/write this patient's data?" rule
 * so every per-patient endpoint goes through the same authorisation gate.
 *
 * <p>Rule:
 * <ul>
 *   <li>{@code DOCTOR}, {@code NURSE} → always allowed.</li>
 *   <li>{@code PATIENT} → only when the patient's {@code userId} matches the
 *       currently authenticated user's id.</li>
 *   <li>Anyone else → denied.</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
public class PatientAccessGuard {

    private final PatientService patientService;

    public void assertCanAccessPatient(Long patientId) {
        Long currentUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));

        if (SecurityUtils.hasRole("DOCTOR") || SecurityUtils.hasRole("NURSE")) {
            return;
        }

        if (SecurityUtils.hasRole("PATIENT")) {
            Patient p = patientService.getById(patientId);
            if (!p.getUser().getId().equals(currentUserId)) {
                throw new AuthorizationException(
                        "Patients may only access their own records");
            }
            return;
        }

        throw new AuthorizationException("Insufficient privileges");
    }
}
