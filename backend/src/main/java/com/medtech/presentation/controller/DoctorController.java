package com.medtech.presentation.controller;

import com.medtech.application.dto.mapper.DoctorMapper;
import com.medtech.application.dto.request.CreateDoctorRequest;
import com.medtech.application.dto.response.DoctorResponse;
import com.medtech.application.service.DoctorService;
import com.medtech.infrastructure.exception.AuthorizationException;
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
import com.medtech.application.dto.request.UpdateDoctorRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctors", description = "Healthcare provider directory and self-profile")
public class DoctorController {

    private final DoctorService doctorService;
    private final DoctorMapper mapper;

    @GetMapping
    @Operation(summary = "Search doctors by specialization / hospital / city")
    public ResponseEntity<Page<DoctorResponse>> search(
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) Long hospitalId,
            @RequestParam(required = false) String city,
            Pageable pageable) {
        return ResponseEntity.ok(
                doctorService.search(specialization, hospitalId, city, pageable).map(mapper::toResponse));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a doctor by id (public profile)")
    public ResponseEntity<DoctorResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(mapper.toResponse(doctorService.getById(id)));
    }

    @PostMapping("/me")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Create the doctor profile for the currently authenticated DOCTOR user")
    public ResponseEntity<DoctorResponse> createSelfProfile(@Valid @RequestBody CreateDoctorRequest request) {
        Long userId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toResponse(doctorService.createForUser(userId, request)));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Return the doctor profile of the currently authenticated DOCTOR user")
    public ResponseEntity<DoctorResponse> me() {
        Long userId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.ok(mapper.toResponse(doctorService.getByUserId(userId)));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Update mutable fields of the authenticated doctor's profile")
    public ResponseEntity<DoctorResponse> updateSelfProfile(@Valid @RequestBody UpdateDoctorRequest request) {
        Long userId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.ok(mapper.toResponse(doctorService.updateForUser(userId, request)));
    }
}
