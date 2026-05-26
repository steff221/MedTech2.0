package com.medtech.domain.repository;

import com.medtech.domain.entity.Operation;
import com.medtech.domain.vo.OperationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OperationRepository extends JpaRepository<Operation, Long> {

    @EntityGraph(attributePaths = {"patient", "doctor", "doctor.user", "hospital"})
    @Query("SELECT o FROM Operation o WHERE o.doctor.id = :doctorId ORDER BY o.operationDate DESC")
    Page<Operation> findByDoctorIdOrderByOperationDateDesc(@Param("doctorId") Long doctorId, Pageable pageable);

    @EntityGraph(attributePaths = {"patient", "doctor", "doctor.user", "hospital"})
    @Query("SELECT o FROM Operation o WHERE o.patient.id = :patientId ORDER BY o.operationDate DESC")
    Page<Operation> findByPatientIdOrderByOperationDateDesc(@Param("patientId") Long patientId, Pageable pageable);

    Page<Operation> findByDoctorId(Long doctorId, Pageable pageable);

    Page<Operation> findByHospitalIdAndStatus(Long hospitalId, OperationStatus status, Pageable pageable);
}
