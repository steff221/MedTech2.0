package com.medtech.presentation.controller;

import com.medtech.application.dto.mapper.HospitalMapper;
import com.medtech.application.dto.response.HospitalResponse;
import com.medtech.application.service.HospitalService;
import com.medtech.domain.vo.HospitalType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST контролер: endpoints за болниците.
 */
@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
@Tag(name = "Hospitals", description = "Public directory of healthcare facilities")
@SecurityRequirements // public
public class HospitalController {

    private final HospitalService hospitalService;
    private final HospitalMapper mapper;

    @GetMapping
    @Operation(summary = "Search hospitals by city and/or type")
    public ResponseEntity<Page<HospitalResponse>> search(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) HospitalType type,
            Pageable pageable) {
        return ResponseEntity.ok(hospitalService.search(city, type, pageable).map(mapper::toResponse));
    }

    @GetMapping("/active")
    @Operation(summary = "List all ACTIVE hospitals (cached)")
    public ResponseEntity<List<HospitalResponse>> listActive() {
        return ResponseEntity.ok(hospitalService.findAllActive().stream().map(mapper::toResponse).toList());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one hospital")
    public ResponseEntity<HospitalResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(mapper.toResponse(hospitalService.getById(id)));
    }
}
