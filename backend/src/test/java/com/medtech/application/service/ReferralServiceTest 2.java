package com.medtech.application.service;

import com.medtech.application.dto.request.CompleteReferralRequest;
import com.medtech.application.dto.request.CreateReferralRequest;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.Hospital;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.entity.Referral;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.PatientRepository;
import com.medtech.domain.repository.ReferralRepository;
import com.medtech.domain.vo.ReferralStatus;
import com.medtech.domain.vo.ReferralType;
import com.medtech.domain.vo.UserRole;
import com.medtech.domain.vo.UserStatus;
import com.medtech.fixture.Entities;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReferralServiceTest {

    @Mock ReferralRepository referralRepository;
    @Mock DoctorRepository   doctorRepository;
    @Mock PatientRepository  patientRepository;

    ReferralService service;

    Doctor  doctor;
    Patient patient;

    @BeforeEach
    void setUp() {
        Hospital hospital = Entities.hospital(1L);
        doctor  = Entities.doctor(20L, Entities.user(2L, UserRole.DOCTOR), hospital);
        patient = Entities.patient(10L, Entities.user(1L, UserRole.PATIENT));

        service = new ReferralService(referralRepository, doctorRepository, patientRepository);

        lenient().when(doctorRepository.findByUserId(doctor.getUser().getId()))
                .thenReturn(Optional.of(doctor));
        lenient().when(patientRepository.findById(patient.getId()))
                .thenReturn(Optional.of(patient));
        lenient().when(referralRepository.save(any(Referral.class)))
                .thenAnswer(inv -> {
                    Referral r = inv.getArgument(0);
                    if (r.getId() == null) {
                        try {
                            var f = Referral.class.getDeclaredField("id");
                            f.setAccessible(true);
                            f.set(r, 99L);
                        } catch (ReflectiveOperationException e) {
                            throw new IllegalStateException(e);
                        }
                    }
                    return r;
                });
    }

    @Test
    void create_rejectsUnknownDoctor() {
        when(doctorRepository.findByUserId(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(999L, basicCreateReq()))
                .isInstanceOf(AuthorizationException.class);
    }

    @Test
    void create_rejectsSuspendedDoctor() {
        doctor.setStatus(UserStatus.SUSPENDED);

        assertThatThrownBy(() -> service.create(doctor.getUser().getId(), basicCreateReq()))
                .isInstanceOf(AuthorizationException.class);
    }

    @Test
    void create_rejectsUnknownPatient() {
        when(patientRepository.findById(patient.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(doctor.getUser().getId(), basicCreateReq()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void create_setsActiveStatusAndAssignsNumber() {
        Referral result = service.create(doctor.getUser().getId(), basicCreateReq());

        assertThat(result.getStatus()).isEqualTo(ReferralStatus.ACTIVE);
        assertThat(result.getReferralNumber()).startsWith("UP-");
        assertThat(result.getDoctor()).isSameAs(doctor);
        assertThat(result.getPatient()).isSameAs(patient);
    }

    @Test
    void complete_setsCompletedStatusAndOutcome() {
        Referral ref = Entities.referral(5L, doctor, patient, ReferralType.SPECIALIST, ReferralStatus.ACTIVE);
        when(referralRepository.findById(5L)).thenReturn(Optional.of(ref));

        var req = new CompleteReferralRequest(LocalDate.now(), "Patient recovered");
        Referral result = service.complete(5L, doctor.getUser().getId(), req);

        assertThat(result.getStatus()).isEqualTo(ReferralStatus.COMPLETED);
        assertThat(result.getOutcomeNote()).isEqualTo("Patient recovered");
    }

    @Test
    void complete_rejectsWrongDoctor() {
        Referral ref = Entities.referral(6L, doctor, patient, ReferralType.LABORATORY, ReferralStatus.ACTIVE);
        when(referralRepository.findById(6L)).thenReturn(Optional.of(ref));

        assertThatThrownBy(() -> service.complete(6L, 9999L, new CompleteReferralRequest(LocalDate.now(), null)))
                .isInstanceOf(AuthorizationException.class);
    }

    @Test
    void complete_rejectsNonActiveReferral() {
        Referral ref = Entities.referral(7L, doctor, patient, ReferralType.DIAGNOSTICS, ReferralStatus.COMPLETED);
        when(referralRepository.findById(7L)).thenReturn(Optional.of(ref));

        assertThatThrownBy(() -> service.complete(7L, doctor.getUser().getId(), new CompleteReferralRequest(LocalDate.now(), null)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void cancel_setsStatusCancelled() {
        Referral ref = Entities.referral(8L, doctor, patient, ReferralType.HOSPITAL, ReferralStatus.ACTIVE);
        when(referralRepository.findById(8L)).thenReturn(Optional.of(ref));

        Referral result = service.cancel(8L, doctor.getUser().getId());

        assertThat(result.getStatus()).isEqualTo(ReferralStatus.CANCELLED);
    }

    @Test
    void cancel_rejectsCompletedReferral() {
        Referral ref = Entities.referral(9L, doctor, patient, ReferralType.GENERAL_MEDICINE, ReferralStatus.COMPLETED);
        when(referralRepository.findById(9L)).thenReturn(Optional.of(ref));

        assertThatThrownBy(() -> service.cancel(9L, doctor.getUser().getId()))
                .isInstanceOf(ConflictException.class);
    }

    private CreateReferralRequest basicCreateReq() {
        return new CreateReferralRequest(
                patient.getId(),
                ReferralType.SPECIALIST,
                "Cardiology Dept",
                "I21.0",
                "Chest pain evaluation",
                LocalDate.now().plusDays(10)
        );
    }
}
