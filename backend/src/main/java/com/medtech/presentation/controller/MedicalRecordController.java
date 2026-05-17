package com.medtech.presentation.controller;

import com.medtech.application.dto.mapper.MedicalRecordMapper;
import com.medtech.application.dto.request.CreateMedicalRecordRequest;
import com.medtech.application.dto.response.MedicalRecordResponse;
import com.medtech.application.service.MedicalRecordService;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
@Tag(name = "Medical Records", description = "Clinical documentation (SOAP-shaped, MKB-10 coded)")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;
    private final MedicalRecordMapper mapper;

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Doctor creates a medical record (optionally tied to an appointment)")
    public ResponseEntity<MedicalRecordResponse> create(@Valid @RequestBody CreateMedicalRecordRequest request) {
        Long doctorUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toResponse(medicalRecordService.create(doctorUserId, request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get a medical record")
    public ResponseEntity<MedicalRecordResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(mapper.toResponse(medicalRecordService.getById(id)));
    }
}
