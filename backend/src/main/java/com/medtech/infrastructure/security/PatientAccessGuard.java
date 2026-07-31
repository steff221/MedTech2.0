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
 *   <li>{@code NURSE} — <b>denied</b>. Nurses coordinate scheduling but have no
 *       hospital-affiliation entity yet, so there is no way to scope PHI access
 *       to their own ward. Blanket access to every patient in the country is the
 *       wrong default, so it is refused until that scoping exists.</li>
 *   <li>{@code PATIENT} — allowed only for their own record.</li>
 *   <li>{@code ADMIN} — allowed for any patient.</li>
 *   <li>Anyone else — denied.</li>
 * </ul>
 *
 * Безбедносна проверка: дали тековниот корисник смее да пристапи до даден пациент (спречува BOLA).
 */
@Component
@RequiredArgsConstructor
public class PatientAccessGuard {

    private final PatientService patientService;
    private final AppointmentRepository appointmentRepository;

    public void assertCanAccessPatient(Long patientId) {
        Long currentUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Потребна е најава"));

        if (SecurityUtils.hasRole("ADMIN")) {
            return;
        }

        if (SecurityUtils.hasRole("DOCTOR") || SecurityUtils.hasRole("GENERAL_PRACTITIONER")) {
            if (!appointmentRepository.hasCareRelationship(currentUserId, patientId)) {
                throw new AuthorizationException(
                        "PATIENT_ACCESS_DENIED",
                        "Не постои однос на лекување помеѓу овој лекар и бараниот пациент");
            }
            return;
        }

        // NURSE: PHI access blocked until hospital-scoped Nurse entity is implemented.
        // Granting blanket access to all patients is a known privacy gap — deny until scoped.
        if (SecurityUtils.hasRole("NURSE")) {
            throw new AuthorizationException(
                    "NURSE_PHI_ACCESS_DISABLED",
                    "Пристапот на медицински сестри до досиејата на пациентите сè уште не е овозможен. Контактирајте го администраторот.");
        }

        if (SecurityUtils.hasRole("PATIENT")) {
            Patient p = patientService.getById(patientId);
            if (!p.getUser().getId().equals(currentUserId)) {
                throw new AuthorizationException("Пациентите можат да пристапат само до сопствените записи");
            }
            return;
        }

        throw new AuthorizationException("Немате доволно привилегии");
    }
}
