package com.medtech.application.service;

import com.medtech.application.dto.request.CreateRatingRequest;
import com.medtech.application.dto.response.AppointmentResponse;
import com.medtech.application.dto.response.DoctorRatingSummaryResponse;
import com.medtech.application.dto.response.RatingResponse;
import com.medtech.domain.entity.Appointment;
import com.medtech.domain.entity.DoctorRating;
import com.medtech.domain.repository.AppointmentRepository;
import com.medtech.domain.repository.DoctorRatingRepository;
import com.medtech.domain.vo.AppointmentStatus;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import com.medtech.infrastructure.exception.ValidationException;
import com.medtech.infrastructure.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;

/**
 * Сервис: бизнис-логика за оцените на докторите и пресметка на просек.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DoctorRatingService {

    private final DoctorRatingRepository ratingRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional
    public RatingResponse submit(Long appointmentId, CreateRatingRequest req, AuthenticatedUser principal) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> ResourceNotFoundException.of("Appointment", appointmentId));

        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new ValidationException("Only COMPLETED appointments can be rated");
        }
        if (!appointment.getPatient().getUser().getId().equals(principal.getId())) {
            throw new ValidationException("You can only rate your own appointments");
        }
        if (ratingRepository.existsByAppointmentId(appointmentId)) {
            throw new ConflictException("Appointment " + appointmentId + " has already been rated");
        }

        DoctorRating rating = new DoctorRating();
        rating.setAppointment(appointment);
        rating.setPatient(appointment.getPatient());
        rating.setDoctor(appointment.getDoctor());
        rating.setRating(req.rating());
        rating.setComment(req.comment());

        DoctorRating saved = ratingRepository.save(rating);
        log.info("Patient {} rated doctor {} (appointment {}) — {} stars",
                principal.getId(), appointment.getDoctor().getId(), appointmentId, req.rating());

        return toResponse(saved);
    }

    public Page<RatingResponse> getForDoctor(Long doctorId, Pageable pageable) {
        return ratingRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId, pageable).map(this::toResponse);
    }

    public DoctorRatingSummaryResponse getSummary(Long doctorId) {
        double avg = ratingRepository.findAverageRatingByDoctorId(doctorId).orElse(0.0);
        long count = ratingRepository.countByDoctorId(doctorId);

        List<Object[]> rawDist = ratingRepository.findRatingDistributionByDoctorId(doctorId);
        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) distribution.put(i, 0L);
        for (Object[] row : rawDist) {
            distribution.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }

        Page<RatingResponse> recent = getForDoctor(doctorId, PageRequest.of(0, 5));

        return DoctorRatingSummaryResponse.builder()
                .doctorId(doctorId)
                .averageRating(count == 0 ? null : Math.round(avg * 10.0) / 10.0)
                .totalRatings(count)
                .distribution(distribution)
                .recentReviews(recent)
                .build();
    }

    /** Bulk-fetch appointmentId → [ratingId, ratingValue] for enriching AppointmentResponse lists. */
    public Map<Long, short[]> getRatingDataByAppointmentIds(List<Long> appointmentIds) {
        Map<Long, short[]> result = new HashMap<>();
        if (appointmentIds.isEmpty()) return result;
        for (Object[] row : ratingRepository.findRatingIdsByAppointmentIds(appointmentIds)) {
            long apptId = ((Number) row[0]).longValue();
            long rId    = ((Number) row[1]).longValue();
            short rVal  = ((Number) row[2]).shortValue();
            result.put(apptId, new short[]{(short) rId, rVal});
        }
        return result;
    }

    /** Enrich a page of AppointmentResponses with ratingId + ratingValue in one bulk query. */
    public Page<AppointmentResponse> enrichWithRatingIds(Page<AppointmentResponse> page) {
        List<Long> ids = page.getContent().stream().map(AppointmentResponse::id).toList();
        Map<Long, short[]> ratingData = getRatingDataByAppointmentIds(ids);
        return page.map(r -> {
            short[] data = ratingData.get(r.id());
            return data == null ? r : AppointmentResponse.builder()
                    .id(r.id()).patientId(r.patientId()).patientName(r.patientName())
                    .doctorId(r.doctorId()).doctorName(r.doctorName())
                    .doctorSpecialization(r.doctorSpecialization())
                    .hospitalId(r.hospitalId()).hospitalName(r.hospitalName())
                    .appointmentDate(r.appointmentDate()).appointmentTime(r.appointmentTime())
                    .durationMinutes(r.durationMinutes()).status(r.status())
                    .appointmentType(r.appointmentType()).reason(r.reason())
                    .cancellationReason(r.cancellationReason()).videoCallUrl(r.videoCallUrl())
                    .createdAt(r.createdAt()).ratingId((long) data[0]).ratingValue(data[1])
                    .build();
        });
    }

    /** Bulk-fetch average + count for a list of doctor IDs in one query. */
    public Map<Long, double[]> getAggregatesForDoctors(List<Long> doctorIds) {
        Map<Long, double[]> result = new HashMap<>();
        if (doctorIds.isEmpty()) return result;
        for (Object[] row : ratingRepository.findAggregatesByDoctorIds(doctorIds)) {
            long id  = ((Number) row[0]).longValue();
            double a = ((Number) row[1]).doubleValue();
            long   c = ((Number) row[2]).longValue();
            result.put(id, new double[]{Math.round(a * 10.0) / 10.0, c});
        }
        return result;
    }

    private RatingResponse toResponse(DoctorRating r) {
        return RatingResponse.builder()
                .id(r.getId())
                .appointmentId(r.getAppointment().getId())
                .doctorId(r.getDoctor().getId())
                .patientName(r.getPatient().getUser().fullName())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
