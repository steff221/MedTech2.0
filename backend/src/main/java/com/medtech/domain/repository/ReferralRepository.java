package com.medtech.domain.repository;

import com.medtech.domain.entity.Referral;
import com.medtech.domain.vo.ReferralStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA репозиториум: пристап до записите за упати.
 */
@Repository
public interface ReferralRepository extends JpaRepository<Referral, Long> {

    Page<Referral> findByDoctorId(Long doctorId, Pageable pageable);

    Page<Referral> findByDoctorIdAndStatus(Long doctorId, ReferralStatus status, Pageable pageable);

    Page<Referral> findByPatientId(Long patientId, Pageable pageable);

    Optional<Referral> findByReferralNumber(String referralNumber);

    @Query(value = "SELECT nextval('referral_number_seq')", nativeQuery = true)
    long nextReferralSeq();
}
