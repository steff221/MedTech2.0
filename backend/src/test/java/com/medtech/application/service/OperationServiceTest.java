package com.medtech.application.service;

import com.medtech.application.dto.request.UpdateOperationStatusRequest;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.Hospital;
import com.medtech.domain.entity.Operation;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.HospitalRepository;
import com.medtech.domain.repository.OperationRepository;
import com.medtech.domain.repository.PatientRepository;
import com.medtech.domain.vo.OperationStatus;
import com.medtech.domain.vo.UserRole;
import com.medtech.fixture.Entities;
import com.medtech.infrastructure.exception.AuthorizationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * Unit тестови за OperationService (операции).
 */
@ExtendWith(MockitoExtension.class)
class OperationServiceTest {

    @Mock OperationRepository operationRepository;
    @Mock DoctorRepository    doctorRepository;
    @Mock PatientRepository   patientRepository;
    @Mock HospitalRepository  hospitalRepository;

    OperationService service;

    Doctor    surgeon;
    Operation operation;

    @BeforeEach
    void setUp() {
        Hospital hospital = Entities.hospital(1L);
        surgeon = Entities.doctor(20L, Entities.user(2L, UserRole.DOCTOR), hospital);
        Patient patient = Entities.patient(10L, Entities.user(1L, UserRole.PATIENT));

        operation = new Operation();
        operation.setPatient(patient);
        operation.setDoctor(surgeon);
        operation.setHospital(hospital);
        operation.setStatus(OperationStatus.SCHEDULED);

        service = new OperationService(operationRepository, doctorRepository,
                patientRepository, hospitalRepository, new Icd10CatalogService());

        when(operationRepository.findById(5L)).thenReturn(Optional.of(operation));
    }

    @Test
    @DisplayName("updateStatus succeeds for the assigned surgeon")
    void updateStatus_assignedSurgeon() {
        var req = new UpdateOperationStatusRequest(OperationStatus.COMPLETED,
                null, "Successful", null, "Recovered well");

        Operation updated = service.updateStatus(5L, surgeon.getUser().getId(), req);

        assertThat(updated.getStatus()).isEqualTo(OperationStatus.COMPLETED);
        assertThat(updated.getPostOperativeNotes()).isEqualTo("Recovered well");
    }

    @Test
    @DisplayName("updateStatus rejects a doctor who is not assigned to the operation (BOLA guard)")
    void updateStatus_rejectsOtherDoctor() {
        var req = new UpdateOperationStatusRequest(OperationStatus.CANCELLED,
                null, null, null, null);

        assertThatThrownBy(() -> service.updateStatus(5L, 999L, req))
                .isInstanceOf(AuthorizationException.class)
                .hasMessageContaining("доделен");

        assertThat(operation.getStatus()).isEqualTo(OperationStatus.SCHEDULED);
    }
}
