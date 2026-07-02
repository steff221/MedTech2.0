package com.medtech.presentation.controller;

import com.medtech.application.dto.response.StatsOverviewResponse;
import com.medtech.application.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST контролер: endpoints за збирните статистики (admin контролна табла).
 */
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@Tag(name = "Stats", description = "Aggregate dashboard counts (public, no PII)")
@SecurityRequirements // public
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/overview")
    @Operation(summary = "Overview counts for the public landing dashboard")
    public ResponseEntity<StatsOverviewResponse> overview() {
        return ResponseEntity.ok(statsService.overview());
    }
}
