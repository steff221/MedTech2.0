package com.medtech.presentation.controller;

import com.medtech.application.dto.request.AvailabilitySlotRequest;
import com.medtech.application.dto.response.AvailabilitySlotResponse;
import com.medtech.application.service.DoctorAvailabilityService;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import com.medtech.infrastructure.security.Roles;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Doctor Availability", description = "Weekly working-hours schedule for doctors")
public class DoctorAvailabilityController {

    private final DoctorAvailabilityService availabilityService;
    private final DoctorRepository doctorRepo;

    @GetMapping("/api/doctors/{doctorId}/availability")
    @Operation(summary = "Get a doctor's weekly availability (public)")
    public ResponseEntity<List<AvailabilitySlotResponse>> get(@PathVariable Long doctorId) {
        return ResponseEntity.ok(availabilityService.getForDoctor(doctorId));
    }

    @PutMapping("/api/doctors/me/availability")
    @PreAuthorize(Roles.CLINICIAN)
    @Operation(summary = "Save the authenticated doctor's weekly availability")
    public ResponseEntity<List<AvailabilitySlotResponse>> save(
            @Valid @RequestBody List<@Valid AvailabilitySlotRequest> slots,
            Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Long userId)) {
            throw new AuthorizationException("Authentication required");
        }
        Long doctorId = doctorRepo.findByUserId(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Doctor profile", userId))
                .getId();
        return ResponseEntity.ok(availabilityService.save(doctorId, slots));
    }
}
