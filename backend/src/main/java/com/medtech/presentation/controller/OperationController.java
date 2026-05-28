package com.medtech.presentation.controller;

import com.medtech.application.dto.mapper.OperationMapper;
import com.medtech.application.dto.request.ScheduleOperationRequest;
import com.medtech.application.dto.request.UpdateOperationStatusRequest;
import com.medtech.application.dto.response.OperationResponse;
import com.medtech.application.service.OperationService;
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
@RequestMapping("/api/operations")
@RequiredArgsConstructor
@Tag(name = "Operations", description = "Surgical procedure scheduling and tracking")
public class OperationController {

    private final OperationService operationService;
    private final OperationMapper mapper;
    private final PatientAccessGuard accessGuard;

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR')")
    @Operation(summary = "Schedule a surgical operation")
    public ResponseEntity<OperationResponse> schedule(@Valid @RequestBody ScheduleOperationRequest request) {
        Long surgeonUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toResponse(operationService.schedule(surgeonUserId, request)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('DOCTOR')")
    @Operation(summary = "Update operation status + post-op notes")
    public ResponseEntity<OperationResponse> updateStatus(@PathVariable Long id,
                                                          @Valid @RequestBody UpdateOperationStatusRequest request) {
        return ResponseEntity.ok(mapper.toResponse(operationService.updateStatus(id, request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OperationResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(mapper.toResponse(operationService.getById(id)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR')")
    @Operation(summary = "List the current doctor's operations (newest first)")
    public ResponseEntity<Page<OperationResponse>> myOperations(Pageable pageable) {
        Long userId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.ok(operationService.forCurrentDoctor(userId, pageable).map(mapper::toResponse));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<OperationResponse>> history(@PathVariable Long patientId, Pageable pageable) {
        accessGuard.assertCanAccessPatient(patientId);
        return ResponseEntity.ok(operationService.historyOf(patientId, pageable).map(mapper::toResponse));
    }
}
