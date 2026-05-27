package com.medtech.presentation.controller;

import com.medtech.application.dto.mapper.DoctorMapper;
import com.medtech.application.dto.request.CreateDoctorRequest;
import com.medtech.application.dto.request.UpdateDoctorRequest;
import com.medtech.application.dto.response.DoctorResponse;
import com.medtech.application.service.DoctorRatingService;
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
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctors", description = "Healthcare provider directory and self-profile")
public class DoctorController {

    private final DoctorService doctorService;
    private final DoctorRatingService ratingService;
    private final DoctorMapper mapper;

    @GetMapping
    @Operation(summary = "Search doctors by specialization / hospital / city")
    public ResponseEntity<Page<DoctorResponse>> search(
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) Long hospitalId,
            @RequestParam(required = false) String city,
            Pageable pageable) {
        Page<DoctorResponse> page = doctorService.search(specialization, hospitalId, city, pageable)
                .map(mapper::toResponse);
        List<Long> ids = page.getContent().stream().map(DoctorResponse::id).toList();
        Map<Long, double[]> aggregates = ratingService.getAggregatesForDoctors(ids);
        Page<DoctorResponse> enriched = page.map(d -> {
            double[] agg = aggregates.get(d.id());
            return agg == null ? d : DoctorResponse.builder()
                    .id(d.id()).userId(d.userId()).email(d.email())
                    .firstName(d.firstName()).lastName(d.lastName())
                    .licenseNumber(d.licenseNumber()).specialization(d.specialization())
                    .subSpecialization(d.subSpecialization()).qualification(d.qualification())
                    .experienceYears(d.experienceYears()).officeNumber(d.officeNumber())
                    .consultationFee(d.consultationFee()).availabilityHours(d.availabilityHours())
                    .bio(d.bio()).status(d.status())
                    .hospitalId(d.hospitalId()).hospitalName(d.hospitalName()).hospitalCity(d.hospitalCity())
                    .averageRating(agg[0]).ratingCount((int) agg[1])
                    .build();
        });
        return ResponseEntity.ok(enriched);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a doctor by id (public profile)")
    public ResponseEntity<DoctorResponse> getById(@PathVariable Long id) {
        DoctorResponse d = mapper.toResponse(doctorService.getById(id));
        Map<Long, double[]> agg = ratingService.getAggregatesForDoctors(List.of(id));
        double[] stats = agg.get(id);
        if (stats != null) {
            d = DoctorResponse.builder()
                    .id(d.id()).userId(d.userId()).email(d.email())
                    .firstName(d.firstName()).lastName(d.lastName())
                    .licenseNumber(d.licenseNumber()).specialization(d.specialization())
                    .subSpecialization(d.subSpecialization()).qualification(d.qualification())
                    .experienceYears(d.experienceYears()).officeNumber(d.officeNumber())
                    .consultationFee(d.consultationFee()).availabilityHours(d.availabilityHours())
                    .bio(d.bio()).status(d.status())
                    .hospitalId(d.hospitalId()).hospitalName(d.hospitalName()).hospitalCity(d.hospitalCity())
                    .averageRating(stats[0]).ratingCount((int) stats[1])
                    .build();
        }
        return ResponseEntity.ok(d);
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
