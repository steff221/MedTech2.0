package com.medtech.domain.repository;

import com.medtech.domain.entity.Hospital;
import com.medtech.domain.vo.HospitalStatus;
import com.medtech.domain.vo.HospitalType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Long> {

    List<Hospital> findByStatus(HospitalStatus status);

    Page<Hospital> findByCityIgnoreCase(String city, Pageable pageable);

    Page<Hospital> findByCityIgnoreCaseAndType(String city, HospitalType type, Pageable pageable);
}
