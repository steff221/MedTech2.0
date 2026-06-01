package com.medtech.domain.repository;

import com.medtech.domain.entity.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    @Query("""
           SELECT p FROM Patient p JOIN p.user u
           WHERE LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :q, '%'))
              OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))
           """)
    Page<Patient> searchByNameOrEmail(@Param("q") String q, Pageable pageable);

    @Query("""
           SELECT DISTINCT p FROM Patient p JOIN p.user u
           JOIN Appointment a ON a.patient = p
           WHERE a.hospital.id = :hospitalId
             AND (LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :q, '%'))
                  OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')))
           """)
    Page<Patient> searchByNameOrEmailAtHospital(@Param("q") String q,
                                                @Param("hospitalId") Long hospitalId,
                                                Pageable pageable);

    @Query("""
           SELECT DISTINCT p FROM Patient p
           JOIN Appointment a ON a.patient = p
           WHERE a.doctor.user.id = :doctorUserId
           ORDER BY p.id
           """)
    Page<Patient> findByDoctorUserId(@Param("doctorUserId") Long doctorUserId, Pageable pageable);
}
