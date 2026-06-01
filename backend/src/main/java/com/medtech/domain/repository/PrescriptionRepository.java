package com.medtech.domain.repository;

import com.medtech.domain.entity.Prescription;
import com.medtech.domain.vo.PrescriptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Page<Prescription> findByPatientId(Long patientId, Pageable pageable);

    Page<Prescription> findByPatientIdAndStatus(Long patientId, PrescriptionStatus status, Pageable pageable);

    Page<Prescription> findByDoctorId(Long doctorId, Pageable pageable);

    @Modifying
    @Query("UPDATE Prescription p SET p.status = :newStatus WHERE p.status = :oldStatus AND p.endDate < :today")
    int expireByEndDate(@Param("oldStatus") PrescriptionStatus oldStatus,
                        @Param("newStatus") PrescriptionStatus newStatus,
                        @Param("today") LocalDate today);
}
