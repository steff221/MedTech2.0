package com.medtech.domain.repository;

import com.medtech.domain.entity.Doctor;
import com.medtech.domain.vo.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA репозиториум: пристап до записите за доктори.
 */
@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByUserId(Long userId);

    Optional<Doctor> findByLicenseNumber(String licenseNumber);

    Page<Doctor> findBySpecializationIgnoreCaseAndStatus(String specialization, UserStatus status, Pageable pageable);

    Page<Doctor> findByHospitalIdAndStatus(Long hospitalId, UserStatus status, Pageable pageable);

    // Two gotchas resolved here:
    //   1. CAST(... AS string/long) — without it, Hibernate has no type info
    //      for a NULL parameter and pgJDBC binds it as bytea, which then
    //      makes `lower(bytea)` blow up.
    //   2. The status comparison uses :activeStatus instead of the JPQL enum
    //      literal `UserStatus.ACTIVE`. Hibernate would render the literal as
    //      `'ACTIVE'::UserStatus`, but the PG type is `user_status_enum` — so
    //      we pass the value as a parameter and let the column's @JdbcTypeCode
    //      mapping bind it correctly.
    @Query("""
           SELECT d FROM Doctor d
           WHERE (CAST(:specialization AS string) IS NULL OR LOWER(d.specialization) = LOWER(CAST(:specialization AS string)))
             AND (CAST(:hospitalId AS long) IS NULL OR d.hospital.id = :hospitalId)
             AND (CAST(:city AS string) IS NULL OR LOWER(d.hospital.city) = LOWER(CAST(:city AS string)))
             AND d.status = :activeStatus
           """)
    Page<Doctor> search(@Param("specialization") String specialization,
                        @Param("hospitalId") Long hospitalId,
                        @Param("city") String city,
                        @Param("activeStatus") UserStatus activeStatus,
                        Pageable pageable);
}
