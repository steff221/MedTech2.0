package com.medtech.presentation.controller;

import com.medtech.application.dto.request.CreateRatingRequest;
import com.medtech.application.dto.response.DoctorRatingSummaryResponse;
import com.medtech.application.dto.response.RatingResponse;
import com.medtech.application.service.DoctorRatingService;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST контролер: endpoints за оцените на докторите.
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Doctor Ratings", description = "Patient reviews for completed appointments")
public class DoctorRatingController {

    private final DoctorRatingService ratingService;

    @PostMapping("/api/appointments/{appointmentId}/rating")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Submit a rating for a completed appointment (patient only, once per appointment)")
    public ResponseEntity<RatingResponse> submit(
            @PathVariable Long appointmentId,
            @Valid @RequestBody CreateRatingRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) throw new AuthorizationException("Потребна е најава");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ratingService.submit(appointmentId, request, principal));
    }

    @GetMapping("/api/doctors/{doctorId}/ratings")
    @Operation(summary = "Paginated list of reviews for a doctor (public)")
    public ResponseEntity<Page<RatingResponse>> list(
            @PathVariable Long doctorId,
            Pageable pageable) {
        return ResponseEntity.ok(ratingService.getForDoctor(doctorId, pageable));
    }

    @GetMapping("/api/doctors/{doctorId}/ratings/summary")
    @Operation(summary = "Average, count, distribution, and recent reviews for a doctor (public)")
    public ResponseEntity<DoctorRatingSummaryResponse> summary(@PathVariable Long doctorId) {
        return ResponseEntity.ok(ratingService.getSummary(doctorId));
    }
}
