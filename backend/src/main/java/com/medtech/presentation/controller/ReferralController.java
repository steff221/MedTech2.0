package com.medtech.presentation.controller;

import com.medtech.application.dto.mapper.ReferralMapper;
import com.medtech.application.dto.request.CompleteReferralRequest;
import com.medtech.application.dto.request.CreateReferralRequest;
import com.medtech.application.dto.response.ReferralResponse;
import com.medtech.application.service.ReferralService;
import com.medtech.domain.vo.ReferralStatus;
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
import org.springframework.web.bind.annotation.*;

/**
 * REST контролер: endpoints за упатите.
 */
@RestController
@RequestMapping("/api/referrals")
@RequiredArgsConstructor
@Tag(name = "Referrals", description = "Issue, complete, cancel, and list medical referrals")
public class ReferralController {

    private final ReferralService  referralService;
    private final ReferralMapper   mapper;
    private final PatientAccessGuard accessGuard;
    private final PhiViewAuditor phiViewAuditor;

    @PostMapping
    @PreAuthorize(Roles.CLINICIAN)
    @Operation(summary = "Doctor issues a new referral")
    public ResponseEntity<ReferralResponse> create(@Valid @RequestBody CreateReferralRequest request) {
        Long doctorUserId = currentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toResponse(referralService.create(doctorUserId, request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get referral by ID")
    public ResponseEntity<ReferralResponse> getById(@PathVariable Long id, HttpServletRequest request) {
        var referral = referralService.getById(id);
        accessGuard.assertCanAccessPatient(referral.getPatient().getId());
        phiViewAuditor.recordView("Referral", id, "Referral viewed", request);
        return ResponseEntity.ok(mapper.toResponse(referral));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize(Roles.CLINICIAN)
    @Operation(summary = "Mark referral as completed with outcome note")
    public ResponseEntity<ReferralResponse> complete(
            @PathVariable Long id,
            @Valid @RequestBody CompleteReferralRequest request) {
        return ResponseEntity.ok(
                mapper.toResponse(referralService.complete(id, currentUserId(), request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(Roles.CLINICIAN)
    @Operation(summary = "Cancel a referral (soft delete via status change)")
    public ResponseEntity<ReferralResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(
                mapper.toResponse(referralService.cancel(id, currentUserId())));
    }

    @GetMapping("/my")
    @PreAuthorize(Roles.CLINICIAN)
    @Operation(summary = "List all referrals issued by the authenticated doctor")
    public ResponseEntity<Page<ReferralResponse>> myReferrals(
            @RequestParam(required = false) ReferralStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(
                referralService.listByDoctor(currentUserId(), status, pageable)
                        .map(mapper::toResponse));
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List all referrals for a patient")
    public ResponseEntity<Page<ReferralResponse>> patientReferrals(
            @PathVariable Long patientId,
            Pageable pageable,
            HttpServletRequest request) {
        accessGuard.assertCanAccessPatient(patientId);
        phiViewAuditor.recordView("Patient", patientId, "Referral history viewed", request);
        return ResponseEntity.ok(
                referralService.listByPatient(patientId, pageable).map(mapper::toResponse));
    }

    private Long currentUserId() {
        return SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
    }
}
