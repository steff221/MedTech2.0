package com.medtech.domain.repository;

import com.medtech.domain.entity.DoctorReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

/**
 * Spring Data JPA репозиториум: пристап до извештаите за докторите.
 */
@Repository
public interface DoctorReportRepository extends JpaRepository<DoctorReport, Long> {

    Page<DoctorReport> findByDoctorIdOrderByPeriodStartDesc(Long doctorId, Pageable pageable);

    boolean existsByDoctorIdAndPeriodStartAndPeriodEnd(Long doctorId, LocalDate periodStart, LocalDate periodEnd);

    @Query("SELECT COUNT(DISTINCT a.patient.id) FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDate BETWEEN :start AND :end")
    int countDistinctPatients(@Param("doctorId") Long doctorId,
                              @Param("start") LocalDate start,
                              @Param("end") LocalDate end);

    @Query(value = "SELECT COUNT(*) FROM medical_records WHERE doctor_id = :doctorId AND created_at::date BETWEEN :start AND :end", nativeQuery = true)
    int countDiagnoses(@Param("doctorId") Long doctorId,
                       @Param("start") LocalDate start,
                       @Param("end") LocalDate end);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDate BETWEEN :start AND :end")
    int countAppointments(@Param("doctorId") Long doctorId,
                          @Param("start") LocalDate start,
                          @Param("end") LocalDate end);

    @Query("SELECT COUNT(p) FROM Prescription p WHERE p.doctor.id = :doctorId AND p.startDate BETWEEN :start AND :end")
    int countPrescriptions(@Param("doctorId") Long doctorId,
                           @Param("start") LocalDate start,
                           @Param("end") LocalDate end);

    /** Next value for the human-readable report number (see V104). */
    @Query(value = "SELECT nextval('doctor_report_number_seq')", nativeQuery = true)
    long nextReportSeq();
}
