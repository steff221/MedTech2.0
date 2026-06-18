package com.medtech.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtech.application.dto.request.CreateMedicalRecordRequest;
import com.medtech.constant.ErrorCode;
import com.medtech.domain.entity.Appointment;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.Hospital;
import com.medtech.domain.entity.MedicalRecord;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.repository.AppointmentRepository;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.MedicalRecordEventRepository;
import com.medtech.domain.repository.MedicalRecordRepository;
import com.medtech.domain.repository.PatientRepository;
import com.medtech.domain.vo.AppointmentStatus;
import com.medtech.domain.vo.UserRole;
import com.medtech.domain.vo.VitalSigns;
import com.medtech.fixture.Entities;
import com.medtech.infrastructure.exception.AppException;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.exception.ConflictException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
class MedicalRecordServiceTest {

    @Mock MedicalRecordRepository medicalRecordRepository;
    @Mock MedicalRecordEventRepository medicalRecordEventRepository;
    @Mock PatientRepository patientRepository;
    @Mock DoctorRepository doctorRepository;
    @Mock AppointmentRepository appointmentRepository;

    MedicalRecordService service;

    Patient patient;
    Doctor doctor;
    Doctor otherDoctor;

    final Clock fixedClock = Clock.fixed(
            ZonedDateTime.of(2026, 6, 1, 10, 0, 0, 0, ZoneId.of("UTC")).toInstant(),
            ZoneId.of("UTC"));

    @BeforeEach
    void setUp() {
        Hospital hospital = Entities.hospital(1L);
        patient     = Entities.patient(10L, Entities.user(1L, UserRole.PATIENT));
        doctor      = Entities.doctor(20L, Entities.user(2L, UserRole.DOCTOR), hospital);
        otherDoctor = Entities.doctor(21L, Entities.user(3L, UserRole.DOCTOR), hospital);

        service = new MedicalRecordService(
                medicalRecordRepository, medicalRecordEventRepository, patientRepository,
                doctorRepository, appointmentRepository, new Icd10CatalogService(),
                new ObjectMapper(), fixedClock);

        lenient().when(doctorRepository.findByUserId(doctor.getUser().getId()))
                .thenReturn(Optional.of(doctor));
        lenient().when(patientRepository.findById(patient.getId()))
                .thenReturn(Optional.of(patient));
        lenient().when(medicalRecordRepository.save(any(MedicalRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void create_rejectsNonDoctorCaller() {
        when(doctorRepository.findByUserId(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(999L, basicReq(null)))
                .isInstanceOf(AuthorizationException.class);
    }

    @Test
    void create_rejectsAppointmentByDifferentDoctor() {
        Appointment appt = Entities.appointment(100L, patient, otherDoctor,
                LocalDate.of(2026, 6, 1), "09:00", AppointmentStatus.SCHEDULED);
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appt));

        assertThatThrownBy(() -> service.create(doctor.getUser().getId(), basicReq(100L)))
                .isInstanceOf(AuthorizationException.class);
    }

    @Test
    void create_savesAndAutoCompletesAppointment() {
        Appointment appt = Entities.appointment(101L, patient, doctor,
                LocalDate.of(2026, 6, 1), "09:00", AppointmentStatus.SCHEDULED);
        when(appointmentRepository.findById(101L)).thenReturn(Optional.of(appt));

        MedicalRecord saved = service.create(doctor.getUser().getId(), basicReq(101L));

        assertThat(saved.getDoctor()).isSameAs(doctor);
        assertThat(saved.getPatient()).isSameAs(patient);
        assertThat(saved.getVitalSignsJson()).contains("\"heartRateBpm\":80");
        assertThat(appt.getStatus()).isEqualTo(AppointmentStatus.COMPLETED);
    }

    @Test
    void assertMutable_rejectsRecordOlderThanSevenDays() {
        // createdAt = clock - 8 days
        MedicalRecord old = Entities.medicalRecord(50L, patient, doctor,
                fixedClock.instant().minusSeconds(8L * 24 * 3600));

        assertThatThrownBy(() -> service.assertMutable(old))
                .isInstanceOf(ConflictException.class)
                .extracting(t -> ((AppException) t).getErrorCode())
                .isEqualTo(ErrorCode.MEDICAL_RECORD_IMMUTABLE);
    }

    @Test
    void assertMutable_acceptsRecordWithinWindow() {
        MedicalRecord fresh = Entities.medicalRecord(51L, patient, doctor,
                fixedClock.instant().minusSeconds(2L * 24 * 3600));

        service.assertMutable(fresh); // no throw
    }

    private CreateMedicalRecordRequest basicReq(Long appointmentId) {
        return new CreateMedicalRecordRequest(
                patient.getId(),
                appointmentId,
                "Hypertension",
                "I10",
                "Patient reports stable BP.",
                new VitalSigns("120/80", 80, null, null, null, null, null),
                "120/80", 80, null, null, null, null,
                "Stable", "Continue current meds", false);
    }
}
