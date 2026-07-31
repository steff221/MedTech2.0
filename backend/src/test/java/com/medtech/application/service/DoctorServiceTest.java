package com.medtech.application.service;

import com.medtech.application.dto.request.CreateDoctorRequest;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.Hospital;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.HospitalRepository;
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

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit тестови за DoctorService (логика за доктори).
 */
@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock DoctorRepository doctorRepository;
    @Mock UserRepository   userRepository;
    @Mock HospitalRepository hospitalRepository;

    @InjectMocks DoctorService service;

    User       doctorUser;
    Hospital   hospital;
    CreateDoctorRequest createReq;

    @BeforeEach
    void setUp() {
        doctorUser = Entities.user(2L, UserRole.DOCTOR);
        hospital   = Entities.hospital(5L);
        createReq  = new CreateDoctorRequest(
                hospital.getId(), "LIC-001", "Cardiology", null, "MD",
                10, "101", BigDecimal.valueOf(1500), "09:00-17:00", "Bio text");
    }

    // ── createForUser ────────────────────────────────────────────────────────

    @Test
    void createForUser_userNotFound_throwsResourceNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createForUser(99L, createReq))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createForUser_userNotDoctorRole_throwsValidation() {
        User patientUser = Entities.user(3L, UserRole.PATIENT);
        when(userRepository.findById(3L)).thenReturn(Optional.of(patientUser));

        assertThatThrownBy(() -> service.createForUser(3L, createReq))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("не е ЛЕКАР");
    }

    @Test
    void createForUser_profileAlreadyExists_throwsConflict() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));
        when(doctorRepository.findByUserId(2L)).thenReturn(Optional.of(new Doctor()));

        assertThatThrownBy(() -> service.createForUser(2L, createReq))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("веќе постои");
    }

    @Test
    void createForUser_licenseAlreadyTaken_throwsConflict() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));
        when(doctorRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(doctorRepository.findByLicenseNumber("LIC-001")).thenReturn(Optional.of(new Doctor()));

        assertThatThrownBy(() -> service.createForUser(2L, createReq))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("LIC-001");
    }

    @Test
    void createForUser_hospitalNotFound_throwsResourceNotFound() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));
        when(doctorRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(doctorRepository.findByLicenseNumber(any())).thenReturn(Optional.empty());
        when(hospitalRepository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createForUser(2L, createReq))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createForUser_success_savesAndReturnsDoctor() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctorUser));
        when(doctorRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(doctorRepository.findByLicenseNumber(any())).thenReturn(Optional.empty());
        when(hospitalRepository.findById(5L)).thenReturn(Optional.of(hospital));
        when(doctorRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Doctor result = service.createForUser(2L, createReq);

        assertThat(result.getLicenseNumber()).isEqualTo("LIC-001");
        assertThat(result.getSpecialization()).isEqualTo("Cardiology");
        assertThat(result.getHospital()).isEqualTo(hospital);
        verify(doctorRepository).save(any(Doctor.class));
    }

    // ── getById ──────────────────────────────────────────────────────────────

    @Test
    void getById_notFound_throwsResourceNotFound() {
        when(doctorRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getById_found_returnsDoctor() {
        Doctor doc = Entities.doctor(20L, doctorUser, hospital);
        when(doctorRepository.findById(20L)).thenReturn(Optional.of(doc));

        Doctor result = service.getById(20L);

        assertThat(result.getId()).isEqualTo(20L);
    }
}
