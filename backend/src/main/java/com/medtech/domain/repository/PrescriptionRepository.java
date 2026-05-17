package com.medtech.domain.repository;

import com.medtech.domain.entity.Prescription;
import com.medtech.domain.vo.PrescriptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    Page<Prescription> findByPatientId(Long patientId, Pageable pageable);

    Page<Prescription> findByPatientIdAndStatus(Long patientId, PrescriptionStatus status, Pageable pageable);

    Page<Prescription> findByDoctorId(Long doctorId, Pageable pageable);
}
