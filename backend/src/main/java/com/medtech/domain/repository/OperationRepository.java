package com.medtech.domain.repository;

import com.medtech.domain.entity.Operation;
import com.medtech.domain.vo.OperationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OperationRepository extends JpaRepository<Operation, Long> {

    Page<Operation> findByPatientIdOrderByOperationDateDesc(Long patientId, Pageable pageable);

    Page<Operation> findByDoctorId(Long doctorId, Pageable pageable);

    Page<Operation> findByHospitalIdAndStatus(Long hospitalId, OperationStatus status, Pageable pageable);
}
