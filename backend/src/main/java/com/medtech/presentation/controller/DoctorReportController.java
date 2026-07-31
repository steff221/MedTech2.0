package com.medtech.presentation.controller;

import com.medtech.application.dto.request.GenerateReportRequest;
import com.medtech.application.dto.response.DoctorReportResponse;
import com.medtech.application.service.DoctorReportService;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import com.medtech.infrastructure.security.SecurityUtils;
import com.medtech.infrastructure.security.Roles;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST контролер: endpoints за извештаите за докторите.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize(Roles.CLINICIAN)
@Tag(name = "Doctor Reports", description = "Individual periodic reports for doctors")
public class DoctorReportController {

    private final DoctorReportService reportService;
    private final DoctorRepository doctorRepository;

    @GetMapping("/my")
    @Operation(summary = "List all reports for the authenticated doctor")
    public Page<DoctorReportResponse> myReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Long doctorId = currentDoctorId();
        return reportService.listForDoctor(doctorId, PageRequest.of(page, size));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Generate a new report for a period")
    public DoctorReportResponse generate(@Valid @RequestBody GenerateReportRequest request) {
        return reportService.generate(currentDoctorId(), request);
    }

    @PutMapping("/{id}/submit")
    @Operation(summary = "Submit (finalise) a draft report")
    public DoctorReportResponse submit(@PathVariable Long id) {
        return reportService.submit(id, currentDoctorId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a draft report")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reportService.delete(id, currentDoctorId());
        return ResponseEntity.noContent().build();
    }

    private Long currentDoctorId() {
        Long userId = SecurityUtils.currentUserId().orElseThrow();
        return doctorRepository.findByUserId(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Лекарски профил", userId))
                .getId();
    }
}
