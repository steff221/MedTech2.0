package com.medtech.domain.repository;

import com.medtech.domain.entity.MedicalRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    Page<MedicalRecord> findByPatientIdOrderByCreatedAtDesc(Long patientId, Pageable pageable);

    Page<MedicalRecord> findByPatientIdAndMkb10Code(Long patientId, String mkb10Code, Pageable pageable);

    Page<MedicalRecord> findByDoctorId(Long doctorId, Pageable pageable);
}
