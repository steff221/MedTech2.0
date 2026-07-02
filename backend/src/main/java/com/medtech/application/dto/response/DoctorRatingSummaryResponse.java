package com.medtech.application.dto.response;

import lombok.Builder;
import org.springframework.data.domain.Page;

import java.util.Map;

/**
 * Излезен DTO: сумарен преглед на оцените за доктор (просек и број).
 */
@Builder
public record DoctorRatingSummaryResponse(
        Long doctorId,
        Double averageRating,
        long totalRatings,
        Map<Integer, Long> distribution,   // 1..5 → count
        Page<RatingResponse> recentReviews
) {}
