package com.medtech.domain.repository;

import com.medtech.domain.entity.MedicalRecordEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA репозиториум: пристап до настаните во медицинските картони.
 */
@Repository
public interface MedicalRecordEventRepository extends JpaRepository<MedicalRecordEvent, Long> {

    List<MedicalRecordEvent> findByRecordIdOrderByCreatedAtAsc(Long recordId);
}
