package com.medtech.application.service;

import com.medtech.application.dto.request.CreatePatientRequest;
import com.medtech.application.dto.request.UpdatePatientRequest;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.PatientRepository;
import com.medtech.domain.repository.UserRepository;
import com.medtech.domain.vo.UserRole;
import com.medtech.fixture.Entities;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import com.medtech.infrastructure.exception.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.medtech.domain.vo.Gender;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit тестови за PatientService (пациенти).
 */
@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock PatientRepository patientRepository;
    @Mock UserRepository    userRepository;

    @InjectMocks PatientService service;

    User         patientUser;
    CreatePatientRequest createReq;

    @BeforeEach
    void setUp() {
        patientUser = Entities.user(1L, UserRole.PATIENT);
        createReq   = new CreatePatientRequest(
                LocalDate.of(1990, 5, 15), Gender.M, null,
                "Penicillin", null, null, null,
                null, null, null, null, null, null);
    }

    // ── createForUser ────────────────────────────────────────────────────────

    @Test
    void createForUser_userNotFound_throwsResourceNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createForUser(99L, createReq))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createForUser_userNotPatientRole_throwsValidation() {
        User doctorUser = Entities.user(2L, UserRole.DOCTOR);
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));

        assertThatThrownBy(() -> service.createForUser(2L, createReq))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("не е ПАЦИЕНТ");
    }

    @Test
    void createForUser_profileAlreadyExists_throwsConflict() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(patientUser));
        when(patientRepository.existsByUserId(1L)).thenReturn(true);

        assertThatThrownBy(() -> service.createForUser(1L, createReq))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("веќе постои");
    }

    @Test
    void createForUser_success_savesAndReturnsPatient() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(patientUser));
        when(patientRepository.existsByUserId(1L)).thenReturn(false);
        when(patientRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Patient result = service.createForUser(1L, createReq);

        assertThat(result.getUser()).isEqualTo(patientUser);
        assertThat(result.getDateOfBirth()).isEqualTo(LocalDate.of(1990, 5, 15));
        assertThat(result.getAllergies()).isEqualTo("Penicillin");
        verify(patientRepository).save(any(Patient.class));
    }

    // ── getById ─────────────────────────────────────────────────────────────

    @Test
    void getById_notFound_throwsResourceNotFound() {
        when(patientRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getById_found_returnsPatient() {
        Patient p = Entities.patient(10L, patientUser);
        when(patientRepository.findById(10L)).thenReturn(Optional.of(p));

        assertThat(service.getById(10L).getId()).isEqualTo(10L);
    }

    // ── update ───────────────────────────────────────────────────────────────

    @Test
    void update_appliesOnlyNonNullFields() {
        Patient existing = Entities.patient(10L, patientUser);
        existing.setAllergies("Aspirin");
        existing.setCity("Skopje");
        when(patientRepository.findById(10L)).thenReturn(Optional.of(existing));

        // Only city is updated — allergies must remain unchanged
        UpdatePatientRequest req = new UpdatePatientRequest(
                null, null, null, null, null, null, null,
                null, null, null, "Bitola", null, null);
        service.update(10L, req);

        assertThat(existing.getCity()).isEqualTo("Bitola");
        assertThat(existing.getAllergies()).isEqualTo("Aspirin");
    }
}
