package com.medtech.presentation.controller;

import com.medtech.application.dto.mapper.AppointmentMapper;
import com.medtech.application.dto.mapper.MedicalRecordMapper;
import com.medtech.application.dto.mapper.PatientMapper;
import com.medtech.application.dto.mapper.PrescriptionMapper;
import com.medtech.application.dto.request.CreatePatientRequest;
import com.medtech.application.dto.request.UpdatePatientRequest;
import com.medtech.application.dto.response.AppointmentResponse;
import com.medtech.application.dto.response.MedicalRecordResponse;
import com.medtech.application.dto.response.PatientResponse;
import com.medtech.application.dto.response.PrescriptionResponse;
import com.medtech.application.service.AppointmentService;
import com.medtech.application.service.MedicalRecordService;
import com.medtech.application.service.PatientService;
import com.medtech.application.service.PrescriptionService;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.security.PatientAccessGuard;
import com.medtech.infrastructure.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@Tag(name = "Patients", description = "Patient profile, appointments, medical history, prescriptions")
public class PatientController {

    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final MedicalRecordService medicalRecordService;
    private final PrescriptionService prescriptionService;

    private final PatientMapper patientMapper;
    private final AppointmentMapper appointmentMapper;
    private final MedicalRecordMapper medicalRecordMapper;
    private final PrescriptionMapper prescriptionMapper;

    private final PatientAccessGuard accessGuard;

    @PostMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Create the patient profile for the currently authenticated PATIENT user")
    public ResponseEntity<PatientResponse> createSelfProfile(@Valid @RequestBody CreatePatientRequest request) {
        Long userId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(patientMapper.toResponse(patientService.createForUser(userId, request)));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Return the patient profile of the current user")
    public ResponseEntity<PatientResponse> me() {
        Long userId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.ok(patientMapper.toResponse(patientService.getByUserId(userId)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    @Operation(summary = "Get any patient (clinicians and admins only)")
    public ResponseEntity<PatientResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(patientMapper.toResponse(patientService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PATIENT')")
    @Operation(summary = "Update patient demographics (self) or any (admin)")
    public ResponseEntity<PatientResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody UpdatePatientRequest request) {
        return ResponseEntity.ok(patientMapper.toResponse(patientService.update(id, request)));
    }

    @GetMapping("/{id}/appointments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<AppointmentResponse>> appointments(@PathVariable Long id, Pageable pageable) {
        accessGuard.assertCanAccessPatient(id);
        return ResponseEntity.ok(appointmentService.listForPatient(id, pageable).map(appointmentMapper::toResponse));
    }

    @GetMapping("/{id}/medical-records")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<MedicalRecordResponse>> medicalRecords(@PathVariable Long id, Pageable pageable) {
        accessGuard.assertCanAccessPatient(id);
        return ResponseEntity.ok(medicalRecordService.historyOf(id, pageable).map(medicalRecordMapper::toResponse));
    }

    @GetMapping("/{id}/prescriptions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<PrescriptionResponse>> prescriptions(@PathVariable Long id, Pageable pageable) {
        accessGuard.assertCanAccessPatient(id);
        return ResponseEntity.ok(prescriptionService.listFor(id, pageable).map(prescriptionMapper::toResponse));
    }
}
