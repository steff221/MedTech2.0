package com.medtech.infrastructure.security;

import com.medtech.application.service.PatientService;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.AppointmentRepository;
import com.medtech.domain.vo.UserRole;
import com.medtech.fixture.Entities;
import com.medtech.infrastructure.exception.AuthorizationException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Verifies the per-role access rules in {@link PatientAccessGuard}. These are the
 * security-critical branches: a regression here is a PHI-exposure incident, so each
 * role's allow/deny path is pinned explicitly.
 *
 * <p>{@link SecurityUtils} is a static-method facade over the Spring Security context;
 * we stub it with {@code mockStatic} rather than wiring a real {@code SecurityContext}.
 */
/**
 * Unit тестови за PatientAccessGuard (контрола на пристап до пациент).
 */
@ExtendWith(MockitoExtension.class)
class PatientAccessGuardTest {

    private static final long CURRENT_USER_ID = 7L;
    private static final long PATIENT_ID = 42L;

    @Mock PatientService patientService;
    @Mock AppointmentRepository appointmentRepository;

    PatientAccessGuard guard;

    MockedStatic<SecurityUtils> security;

    @BeforeEach
    void setUp() {
        guard = new PatientAccessGuard(patientService, appointmentRepository);
        security = Mockito.mockStatic(SecurityUtils.class);
        // Default: an authenticated principal with no roles. Individual tests opt into roles.
        security.when(SecurityUtils::currentUserId).thenReturn(Optional.of(CURRENT_USER_ID));
        lenient().when(SecurityUtils.hasRole(Mockito.anyString())).thenReturn(false);
    }

    @AfterEach
    void tearDown() {
        security.close();
    }

    private void grantRole(String role) {
        security.when(() -> SecurityUtils.hasRole(role)).thenReturn(true);
    }

    // ── unauthenticated ───────────────────────────────────────────────────────

    @Test
    void noAuthenticatedUser_throws() {
        security.when(SecurityUtils::currentUserId).thenReturn(Optional.empty());

        assertThatThrownBy(() -> guard.assertCanAccessPatient(PATIENT_ID))
                .isInstanceOf(AuthorizationException.class)
                .hasMessageContaining("Потребна е најава");
    }

    // ── ADMIN ─────────────────────────────────────────────────────────────────

    @Test
    void admin_allowedWithoutTouchingRepositories() {
        grantRole("ADMIN");

        assertThatCode(() -> guard.assertCanAccessPatient(PATIENT_ID)).doesNotThrowAnyException();

        verify(appointmentRepository, never()).hasCareRelationship(Mockito.anyLong(), Mockito.anyLong());
        verify(patientService, never()).getById(Mockito.anyLong());
    }

    // ── DOCTOR ────────────────────────────────────────────────────────────────

    @Test
    void doctor_withCareRelationship_allowed() {
        grantRole("DOCTOR");
        when(appointmentRepository.hasCareRelationship(CURRENT_USER_ID, PATIENT_ID)).thenReturn(true);

        assertThatCode(() -> guard.assertCanAccessPatient(PATIENT_ID)).doesNotThrowAnyException();
    }

    @Test
    void doctor_withoutCareRelationship_denied() {
        grantRole("DOCTOR");
        when(appointmentRepository.hasCareRelationship(CURRENT_USER_ID, PATIENT_ID)).thenReturn(false);

        assertThatThrownBy(() -> guard.assertCanAccessPatient(PATIENT_ID))
                .isInstanceOf(AuthorizationException.class)
                .hasMessageContaining("Не постои однос на лекување");
    }

    // ── GENERAL_PRACTITIONER (shares the clinician branch with DOCTOR) ─────────

    @Test
    void generalPractitioner_withCareRelationship_allowed() {
        grantRole("GENERAL_PRACTITIONER");
        when(appointmentRepository.hasCareRelationship(CURRENT_USER_ID, PATIENT_ID)).thenReturn(true);

        assertThatCode(() -> guard.assertCanAccessPatient(PATIENT_ID)).doesNotThrowAnyException();
    }

    @Test
    void generalPractitioner_withoutCareRelationship_denied() {
        grantRole("GENERAL_PRACTITIONER");
        when(appointmentRepository.hasCareRelationship(CURRENT_USER_ID, PATIENT_ID)).thenReturn(false);

        assertThatThrownBy(() -> guard.assertCanAccessPatient(PATIENT_ID))
                .isInstanceOf(AuthorizationException.class)
                .hasMessageContaining("Не постои однос на лекување");
    }

    // ── NURSE (PHI access deliberately disabled) ───────────────────────────────

    @Test
    void nurse_alwaysDenied_evenWithCareRelationship() {
        grantRole("NURSE");

        assertThatThrownBy(() -> guard.assertCanAccessPatient(PATIENT_ID))
                .isInstanceOf(AuthorizationException.class)
                .hasMessageContaining("сè уште не е овозможен");

        // The deny must short-circuit before any care-relationship lookup.
        verify(appointmentRepository, never()).hasCareRelationship(Mockito.anyLong(), Mockito.anyLong());
    }

    // ── PATIENT ────────────────────────────────────────────────────────────────

    @Test
    void patient_accessingOwnRecord_allowed() {
        grantRole("PATIENT");
        User self = Entities.user(CURRENT_USER_ID, UserRole.PATIENT);
        Patient own = Entities.patient(PATIENT_ID, self);
        when(patientService.getById(PATIENT_ID)).thenReturn(own);

        assertThatCode(() -> guard.assertCanAccessPatient(PATIENT_ID)).doesNotThrowAnyException();
    }

    @Test
    void patient_accessingAnotherPatientsRecord_denied() {
        grantRole("PATIENT");
        User someoneElse = Entities.user(999L, UserRole.PATIENT);
        Patient foreign = Entities.patient(PATIENT_ID, someoneElse);
        when(patientService.getById(PATIENT_ID)).thenReturn(foreign);

        assertThatThrownBy(() -> guard.assertCanAccessPatient(PATIENT_ID))
                .isInstanceOf(AuthorizationException.class)
                .hasMessageContaining("сопствените записи");
    }

    // ── any other authenticated role ───────────────────────────────────────────

    @Test
    void unknownRole_denied() {
        // No role granted (default stub returns false for every hasRole check).
        assertThatThrownBy(() -> guard.assertCanAccessPatient(PATIENT_ID))
                .isInstanceOf(AuthorizationException.class)
                .hasMessageContaining("Немате доволно привилегии");
    }
}
