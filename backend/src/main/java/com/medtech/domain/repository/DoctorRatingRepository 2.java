package com.medtech.domain.repository;

import com.medtech.domain.entity.DoctorRating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DoctorRatingRepository extends JpaRepository<DoctorRating, Long> {

    boolean existsByAppointmentId(Long appointmentId);

    Optional<DoctorRating> findByAppointmentId(Long appointmentId);

    Page<DoctorRating> findByDoctorIdOrderByCreatedAtDesc(Long doctorId, Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM DoctorRating r WHERE r.doctor.id = :doctorId")
    Optional<Double> findAverageRatingByDoctorId(@Param("doctorId") Long doctorId);

    @Query("SELECT COUNT(r) FROM DoctorRating r WHERE r.doctor.id = :doctorId")
    long countByDoctorId(@Param("doctorId") Long doctorId);

    /** Bulk aggregate for a list of doctor IDs — returns [doctorId, avg, count]. */
    @Query("""
            SELECT r.doctor.id, AVG(r.rating), COUNT(r)
            FROM DoctorRating r
            WHERE r.doctor.id IN :doctorIds
            GROUP BY r.doctor.id
            """)
    List<Object[]> findAggregatesByDoctorIds(@Param("doctorIds") List<Long> doctorIds);

    /** Returns [appointmentId, ratingId, ratingValue] for a batch of appointment IDs. */
    @Query("SELECT r.appointment.id, r.id, r.rating FROM DoctorRating r WHERE r.appointment.id IN :appointmentIds")
    List<Object[]> findRatingIdsByAppointmentIds(@Param("appointmentIds") List<Long> appointmentIds);

    /** Distribution of ratings [1..5] for a given doctor — returns [rating, count]. */
    @Query("""
            SELECT r.rating, COUNT(r)
            FROM DoctorRating r
            WHERE r.doctor.id = :doctorId
            GROUP BY r.rating
            ORDER BY r.rating
            """)
    List<Object[]> findRatingDistributionByDoctorId(@Param("doctorId") Long doctorId);
}
