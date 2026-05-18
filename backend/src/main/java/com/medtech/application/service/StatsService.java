package com.medtech.application.service;

import com.medtech.application.dto.response.StatsOverviewResponse;
import com.medtech.application.dto.response.StatsOverviewResponse.DayCount;
import com.medtech.application.dto.response.StatsOverviewResponse.HospitalCount;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

/**
 * Aggregate counts for the public landing dashboard. Reads only, no PII.
 * Native SQL keeps the queries cheap and unaffected by lazy-loading.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {

    private final EntityManager em;

    public StatsOverviewResponse overview() {
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(6);

        long prescriptionsToday = scalar(
                "SELECT COUNT(*) FROM prescriptions WHERE start_date = CURRENT_DATE");

        long referralsToday = scalar(
                "SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE");

        long activePatients = scalar("SELECT COUNT(*) FROM patients");
        long activeDoctors = scalar(
                "SELECT COUNT(*) FROM doctors WHERE status = 'ACTIVE'");

        @SuppressWarnings("unchecked")
        List<Object[]> hospitalRows = em.createNativeQuery("""
                SELECT h.name, h.city, COUNT(a.id)
                FROM hospitals h
                LEFT JOIN appointments a
                  ON a.hospital_id = h.id
                 AND a.appointment_date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY h.id, h.name, h.city
                ORDER BY COUNT(a.id) DESC
                LIMIT 8
                """).getResultList();
        List<HospitalCount> byHospital = hospitalRows.stream()
                .map(r -> new HospitalCount(
                        (String) r[0],
                        (String) r[1],
                        ((Number) r[2]).longValue()))
                .toList();

        @SuppressWarnings("unchecked")
        List<Object[]> dayRows = em.createNativeQuery("""
                SELECT d::date, COALESCE(c.count, 0)
                FROM generate_series(CAST(:from AS date), CAST(:to AS date), '1 day') AS d
                LEFT JOIN (
                    SELECT start_date, COUNT(*) AS count
                    FROM prescriptions
                    WHERE start_date >= CAST(:from AS date)
                    GROUP BY start_date
                ) c ON c.start_date = d
                ORDER BY d
                """)
                .setParameter("from", Date.valueOf(weekAgo))
                .setParameter("to", Date.valueOf(today))
                .getResultList();
        List<DayCount> byDay = dayRows.stream()
                .map(r -> new DayCount(
                        ((Date) r[0]).toLocalDate(),
                        ((Number) r[1]).longValue()))
                .toList();

        return StatsOverviewResponse.builder()
                .date(today)
                .prescriptionsToday(prescriptionsToday)
                .referralsToday(referralsToday)
                .activePatients(activePatients)
                .activeDoctors(activeDoctors)
                .appointmentsByHospital(byHospital)
                .prescriptionsByDay(byDay)
                .build();
    }

    private long scalar(String sql) {
        Object v = em.createNativeQuery(sql).getSingleResult();
        return ((Number) v).longValue();
    }
}
