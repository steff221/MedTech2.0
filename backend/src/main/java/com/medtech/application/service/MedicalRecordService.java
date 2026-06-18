package com.medtech.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtech.application.dto.request.AddAddendumRequest;
import com.medtech.application.dto.request.CreateMedicalRecordRequest;
import com.medtech.constant.ErrorCode;
import com.medtech.domain.entity.Appointment;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.MedicalRecord;
import com.medtech.domain.entity.MedicalRecordEvent;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.AppointmentRepository;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.MedicalRecordEventRepository;
import com.medtech.domain.repository.MedicalRecordRepository;
import com.medtech.domain.repository.PatientRepository;
import com.medtech.domain.vo.AppointmentStatus;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import com.medtech.infrastructure.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MedicalRecordService {

    public static final Duration MUTABILITY_WINDOW = Duration.ofDays(7);

    private final MedicalRecordRepository medicalRecordRepository;
    private final MedicalRecordEventRepository eventRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final Icd10CatalogService icd10Catalog;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Transactional
    public MedicalRecord create(Long authorUserId, CreateMedicalRecordRequest req) {
        Doctor doctor = doctorRepository.findByUserId(authorUserId)
                .orElseThrow(() -> new AuthorizationException("Only DOCTOR users can create medical records"));
        Patient patient = patientRepository.findById(req.patientId())
                .orElseThrow(() -> ResourceNotFoundException.of("Patient", req.patientId()));

        Appointment appointment = null;
        if (req.appointmentId() != null) {
            appointment = appointmentRepository.findById(req.appointmentId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Appointment", req.appointmentId()));
            if (!appointment.getDoctor().getId().equals(doctor.getId())) {
                throw new AuthorizationException("Only the assigned doctor may create the medical record for this appointment");
            }
            if (!appointment.getPatient().getId().equals(patient.getId())) {
                throw new ValidationException("Patient does not match the appointment");
            }
        }

        MedicalRecord record = new MedicalRecord();
        record.setPatient(patient);
        record.setDoctor(doctor);
        record.setHospital(doctor.getHospital());
        record.setAppointment(appointment);
        record.setDiagnosis(req.diagnosis());
        icd10Catalog.requireValidCode(req.mkb10Code());
        record.setMkb10Code(req.mkb10Code());
        record.setClinicalNotes(req.clinicalNotes());
        record.setVitalSignsJson(serializeVitalSigns(req));
        record.setBloodPressure(req.bloodPressure());
        record.setHeartRate(req.heartRate());
        record.setTemperature(req.temperature());
        record.setWeight(req.weight());
        record.setHeight(req.height());
        record.setBmi(req.bmi());
        record.setAssessment(req.assessment());
        record.setPlan(req.plan());
        record.setConfidential(req.confidential());

        MedicalRecord saved = medicalRecordRepository.save(record);

        if (appointment != null && !appointment.getStatus().isTerminal()) {
            appointment.setStatus(AppointmentStatus.COMPLETED);
        }

        User author = doctor.getUser();
        eventRepository.save(MedicalRecordEvent.created(saved, author, snapshot(saved)));

        log.info("Created medical record id={} patient={} doctor={} confidential={}",
                saved.getId(), patient.getId(), doctor.getId(), saved.isConfidential());
        return saved;
    }

    @Transactional
    public MedicalRecord addAddendum(Long recordId, Long authorUserId, AddAddendumRequest req) {
        MedicalRecord record = getById(recordId);
        assertMutable(record);

        Doctor doctor = doctorRepository.findByUserId(authorUserId)
                .orElseThrow(() -> new AuthorizationException("Only DOCTOR users can add addendums"));
        if (!record.getDoctor().getId().equals(doctor.getId())) {
            throw new AuthorizationException("Only the authoring doctor may add an addendum to this record");
        }

        if (req.clinicalNotes() != null) record.setClinicalNotes(req.clinicalNotes());
        if (req.assessment()    != null) record.setAssessment(req.assessment());
        if (req.plan()          != null) record.setPlan(req.plan());

        MedicalRecord saved = medicalRecordRepository.save(record);
        eventRepository.save(MedicalRecordEvent.addendum(saved, doctor.getUser(), snapshot(saved), req.note()));

        log.info("Addendum added to medical record id={} by doctor userId={}", recordId, authorUserId);
        return saved;
    }

    public List<MedicalRecordEvent> getHistory(Long recordId) {
        if (!medicalRecordRepository.existsById(recordId)) {
            throw ResourceNotFoundException.of("MedicalRecord", recordId);
        }
        return eventRepository.findByRecordIdOrderByCreatedAtAsc(recordId);
    }

    public MedicalRecord getById(Long id) {
        return medicalRecordRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("MedicalRecord", id));
    }

    public Page<MedicalRecord> historyOf(Long patientId, Pageable pageable) {
        return medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patientId, pageable);
    }

    public Page<MedicalRecord> listByDoctorUserId(Long doctorUserId, Pageable pageable) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> ResourceNotFoundException.of("Doctor profile", doctorUserId));
        return medicalRecordRepository.findByDoctorId(doctor.getId(), pageable);
    }

    public void assertMutable(MedicalRecord record) {
        if (Instant.now(clock).isAfter(record.getCreatedAt().plus(MUTABILITY_WINDOW))) {
            throw new ConflictException(ErrorCode.MEDICAL_RECORD_IMMUTABLE,
                    "Medical record is older than " + MUTABILITY_WINDOW.toDays() + " days and is immutable");
        }
    }

    private String snapshot(MedicalRecord r) {
        Map<String, Object> snap = new LinkedHashMap<>();
        snap.put("diagnosis",     r.getDiagnosis());
        snap.put("mkb10Code",     r.getMkb10Code());
        snap.put("clinicalNotes", r.getClinicalNotes());
        snap.put("assessment",    r.getAssessment());
        snap.put("plan",          r.getPlan());
        snap.put("bloodPressure", r.getBloodPressure());
        snap.put("heartRate",     r.getHeartRate());
        snap.put("temperature",   r.getTemperature());
        snap.put("weight",        r.getWeight());
        snap.put("height",        r.getHeight());
        snap.put("bmi",           r.getBmi());
        snap.put("confidential",  r.isConfidential());
        try {
            return objectMapper.writeValueAsString(snap);
        } catch (JsonProcessingException e) {
            throw new ValidationException("Failed to serialize medical record snapshot: " + e.getMessage());
        }
    }

    private String serializeVitalSigns(CreateMedicalRecordRequest req) {
        if (req.vitalSigns() == null) return null;
        try {
            return objectMapper.writeValueAsString(req.vitalSigns());
        } catch (JsonProcessingException e) {
            throw new ValidationException("Invalid vital signs payload: " + e.getOriginalMessage());
        }
    }
}
