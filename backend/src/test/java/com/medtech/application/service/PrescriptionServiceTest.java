package com.medtech.application.service;

import com.medtech.application.dto.request.IssuePrescriptionRequest;
import com.medtech.constant.ErrorCode;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.Hospital;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.entity.Prescription;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.MedicalRecordRepository;
import com.medtech.domain.repository.PatientRepository;
import com.medtech.domain.repository.PrescriptionRepository;
import com.medtech.domain.vo.PrescriptionStatus;
import com.medtech.domain.vo.UserRole;
import com.medtech.domain.vo.UserStatus;
import com.medtech.fixture.Entities;
import com.medtech.infrastructure.exception.AppException;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.exception.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrescriptionServiceTest {

    @Mock PrescriptionRepository prescriptionRepository;
    @Mock PatientRepository patientRepository;
    @Mock DoctorRepository doctorRepository;
    @Mock MedicalRecordRepository medicalRecordRepository;

    PrescriptionService service;

    Patient patient;
    Doctor doctor;
    final Clock fixedClock = Clock.fixed(
            ZonedDateTime.of(2026, 6, 1, 10, 0, 0, 0, ZoneId.of("UTC")).toInstant(),
            ZoneId.of("UTC"));

    @BeforeEach
    void setUp() {
        Hospital hospital = Entities.hospital(1L);
        patient = Entities.patient(10L, Entities.user(1L, UserRole.PATIENT));
        doctor  = Entities.doctor(20L, Entities.user(2L, UserRole.DOCTOR), hospital);

        service = new PrescriptionService(prescriptionRepository, patientRepository,
                doctorRepository, medicalRecordRepository, fixedClock);

        lenient().when(doctorRepository.findByUserId(doctor.getUser().getId()))
                .thenReturn(Optional.of(doctor));
        lenient().when(patientRepository.findById(patient.getId()))
                .thenReturn(Optional.of(patient));
        lenient().when(prescriptionRepository.save(any(Prescription.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void issue_rejectsNonDoctorCaller() {
        when(doctorRepository.findByUserId(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.issue(999L, basicReq()))
                .isInstanceOf(AuthorizationException.class);
    }

    @Test
    void issue_rejectsSuspendedDoctor() {
        doctor.setStatus(UserStatus.SUSPENDED);

        assertThatThrownBy(() -> service.issue(doctor.getUser().getId(), basicReq()))
                .isInstanceOf(AuthorizationException.class);
    }

    @Test
    void issue_rejectsEndBeforeStart() {
        var req = new IssuePrescriptionRequest(patient.getId(), null,
                "Aspirin", "100mg", "1/day", 30, 30, null, null,
                LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 5), 2);

        assertThatThrownBy(() -> service.issue(doctor.getUser().getId(), req))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void issue_savesActivePrescription() {
        Prescription saved = service.issue(doctor.getUser().getId(), basicReq());

        assertThat(saved.getStatus()).isEqualTo(PrescriptionStatus.ACTIVE);
        assertThat(saved.getRefillsAllowed()).isEqualTo(2);
        assertThat(saved.getDoctor()).isSameAs(doctor);
    }

    @Test
    void refill_incrementsCounter() {
        Prescription rx = Entities.prescription(50L, patient, doctor,
                3, 1, LocalDate.of(2026, 12, 31), PrescriptionStatus.ACTIVE);
        when(prescriptionRepository.findById(50L)).thenReturn(Optional.of(rx));

        Prescription refilled = service.refill(50L, patient.getUser().getId());

        assertThat(refilled.getRefillsUsed()).isEqualTo(2);
        assertThat(refilled.getStatus()).isEqualTo(PrescriptionStatus.ACTIVE);
    }

    @Test
    void refill_rejectsStranger() {
        Prescription rx = Entities.prescription(54L, patient, doctor,
                3, 0, LocalDate.of(2026, 12, 31), PrescriptionStatus.ACTIVE);
        when(prescriptionRepository.findById(54L)).thenReturn(Optional.of(rx));

        assertThatThrownBy(() -> service.refill(54L, 9999L))
                .isInstanceOf(AuthorizationException.class);
    }

    @Test
    void refill_rejectsExhaustedRefills() {
        Prescription rx = Entities.prescription(51L, patient, doctor,
                2, 2, LocalDate.of(2026, 12, 31), PrescriptionStatus.ACTIVE);
        when(prescriptionRepository.findById(51L)).thenReturn(Optional.of(rx));

        assertThatThrownBy(() -> service.refill(51L, doctor.getUser().getId()))
                .isInstanceOf(ConflictException.class)
                .extracting(t -> ((AppException) t).getErrorCode())
                .isEqualTo(ErrorCode.PRESCRIPTION_REFILLS_EXHAUSTED);
    }

    @Test
    void refill_rejectsExpiredPrescription() {
        Prescription rx = Entities.prescription(52L, patient, doctor,
                3, 0, LocalDate.of(2026, 5, 1), PrescriptionStatus.ACTIVE);
        when(prescriptionRepository.findById(52L)).thenReturn(Optional.of(rx));

        assertThatThrownBy(() -> service.refill(52L, doctor.getUser().getId()))
                .isInstanceOf(ConflictException.class)
                .extracting(t -> ((AppException) t).getErrorCode())
                .isEqualTo(ErrorCode.PRESCRIPTION_EXPIRED);
    }

    @Test
    void refill_rejectsNonActiveStatus() {
        Prescription rx = Entities.prescription(53L, patient, doctor,
                3, 0, LocalDate.of(2026, 12, 31), PrescriptionStatus.CANCELLED);
        when(prescriptionRepository.findById(53L)).thenReturn(Optional.of(rx));

        assertThatThrownBy(() -> service.refill(53L, doctor.getUser().getId()))
                .isInstanceOf(ConflictException.class);
    }

    private IssuePrescriptionRequest basicReq() {
        return new IssuePrescriptionRequest(
                patient.getId(), null,
                "Aspirin", "100mg", "1/day",
                30, 30, null, "Take after meals",
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 12, 31), 2);
    }
}
