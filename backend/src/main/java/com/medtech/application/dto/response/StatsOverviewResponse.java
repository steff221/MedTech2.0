package com.medtech.application.dto.response;

import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

/**
 * Aggregate dashboard counts. Public — no PII, only aggregates.
 */
@Builder
public record StatsOverviewResponse(
        LocalDate date,
        long prescriptionsToday,
        long referralsToday,
        long activePatients,
        long activeDoctors,
        List<HospitalCount> appointmentsByHospital,
        List<DayCount> prescriptionsByDay
) {
    public record HospitalCount(String hospital, String city, long count) {}
    public record DayCount(LocalDate day, long count) {}
}
