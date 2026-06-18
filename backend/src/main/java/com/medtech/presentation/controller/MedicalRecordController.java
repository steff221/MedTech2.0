package com.medtech.presentation.controller;

import com.medtech.application.dto.mapper.MedicalRecordMapper;
import com.medtech.application.dto.request.AddAddendumRequest;
import com.medtech.application.dto.request.CreateMedicalRecordRequest;
import com.medtech.application.dto.response.MedicalRecordEventResponse;
import com.medtech.application.dto.response.MedicalRecordResponse;
import com.medtech.application.service.MedicalRecordService;
import com.medtech.domain.entity.MedicalRecord;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.security.PatientAccessGuard;
import com.medtech.infrastructure.security.PhiViewAuditor;
import com.medtech.infrastructure.security.SecurityUtils;
import com.medtech.infrastructure.security.Roles;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
@Tag(name = "Medical Records", description = "Clinical documentation (SOAP-shaped, MKB-10 coded)")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;
    private final MedicalRecordMapper mapper;
    private final PatientAccessGuard accessGuard;
    private final PhiViewAuditor phiViewAuditor;

    @GetMapping("/my")
    @PreAuthorize(Roles.CLINICIAN)
    @Operation(summary = "List all medical records written by the authenticated doctor")
    public ResponseEntity<Page<MedicalRecordResponse>> myRecords(Pageable pageable) {
        Long doctorUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.ok(medicalRecordService.listByDoctorUserId(doctorUserId, pageable)
                .map(mapper::toResponse));
    }

    @PostMapping
    @PreAuthorize(Roles.CLINICIAN)
    @Operation(summary = "Doctor creates a medical record (optionally tied to an appointment)")
    public ResponseEntity<MedicalRecordResponse> create(@Valid @RequestBody CreateMedicalRecordRequest request) {
        Long doctorUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toResponse(medicalRecordService.create(doctorUserId, request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get a medical record (patient who owns it, or clinician with care relationship)")
    public ResponseEntity<MedicalRecordResponse> getById(@PathVariable Long id, HttpServletRequest request) {
        MedicalRecord record = medicalRecordService.getById(id);
        accessGuard.assertCanAccessPatient(record.getPatient().getId());
        phiViewAuditor.recordView("MedicalRecord", id, "Medical record viewed", request);
        return ResponseEntity.ok(mapper.toResponse(record));
    }

    @PostMapping("/{id}/addendum")
    @PreAuthorize(Roles.CLINICIAN)
    @Operation(summary = "Add an addendum to a medical record (authoring doctor only, within 7 days)")
    public ResponseEntity<MedicalRecordResponse> addAddendum(@PathVariable Long id,
                                                             @Valid @RequestBody AddAddendumRequest request) {
        Long doctorUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.ok(mapper.toResponse(medicalRecordService.addAddendum(id, doctorUserId, request)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Full event history for a medical record (immutable audit log)")
    public ResponseEntity<List<MedicalRecordEventResponse>> history(@PathVariable Long id, HttpServletRequest request) {
        MedicalRecord record = medicalRecordService.getById(id);
        accessGuard.assertCanAccessPatient(record.getPatient().getId());
        phiViewAuditor.recordView("MedicalRecord", id, "Medical record history viewed", request);
        return ResponseEntity.ok(
                medicalRecordService.getHistory(id).stream()
                        .map(MedicalRecordEventResponse::from)
                        .toList());
    }
}
