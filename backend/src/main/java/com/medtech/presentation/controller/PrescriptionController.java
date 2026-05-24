package com.medtech.presentation.controller;

import com.medtech.application.dto.mapper.PrescriptionMapper;
import com.medtech.application.dto.request.IssuePrescriptionRequest;
import com.medtech.application.dto.response.PrescriptionResponse;
import com.medtech.application.service.PrescriptionService;
import com.medtech.domain.entity.Prescription;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
@Tag(name = "Prescriptions", description = "Issue, refill, cancel, list prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final PrescriptionMapper mapper;
    private final PatientAccessGuard accessGuard;

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Doctor issues a new prescription")
    public ResponseEntity<PrescriptionResponse> issue(@Valid @RequestBody IssuePrescriptionRequest request) {
        Long doctorUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toResponse(prescriptionService.issue(doctorUserId, request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PrescriptionResponse> getById(@PathVariable Long id) {
        Prescription rx = prescriptionService.getById(id);
        accessGuard.assertCanAccessPatient(rx.getPatient().getId());
        return ResponseEntity.ok(mapper.toResponse(rx));
    }

    @PutMapping("/{id}/refill")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    @Operation(summary = "Increment refills_used (rejected when allowance exhausted or expired)")
    public ResponseEntity<PrescriptionResponse> refill(@PathVariable Long id) {
        Long callerUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.ok(mapper.toResponse(prescriptionService.refill(id, callerUserId)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR')")
    @Operation(summary = "Cancel a prescription (soft delete via status change)")
    public ResponseEntity<PrescriptionResponse> cancel(@PathVariable Long id) {
        Long callerUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.ok(mapper.toResponse(prescriptionService.cancel(id, callerUserId)));
    }

    @GetMapping("/patient/{patientId}/active")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<PrescriptionResponse>> active(@PathVariable Long patientId, Pageable pageable) {
        accessGuard.assertCanAccessPatient(patientId);
        return ResponseEntity.ok(prescriptionService.activeFor(patientId, pageable).map(mapper::toResponse));
    }
}
