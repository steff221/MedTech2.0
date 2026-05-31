package com.medtech.domain.repository;

import com.medtech.domain.entity.DoctorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {

    List<DoctorAvailability> findByDoctorId(Long doctorId);

    @Modifying
    @Query("DELETE FROM DoctorAvailability da WHERE da.doctor.id = :doctorId")
    void deleteByDoctorId(Long doctorId);
}
