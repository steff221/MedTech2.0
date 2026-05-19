package com.medtech.domain.repository;

import com.medtech.domain.entity.Appointment;
import com.medtech.domain.vo.AppointmentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Page<Appointment> findByPatientId(Long patientId, Pageable pageable);

    Page<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date, Pageable pageable);

    Page<Appointment> findByDoctorIdAndStatus(Long doctorId, AppointmentStatus status, Pageable pageable);

    /**
     * Returns same-day appointments for a doctor that overlap the proposed slot.
     * Pessimistically locked to prevent two patients booking the identical slot
     * during concurrent transactions.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
           SELECT a FROM Appointment a
           WHERE a.doctor.id = :doctorId
             AND a.appointmentDate = :date
             AND a.appointmentTime = :time
             AND a.status IN :statuses
           """)
    List<Appointment> lockConflicting(@Param("doctorId") Long doctorId,
                                      @Param("date") LocalDate date,
                                      @Param("time") String time,
                                      @Param("statuses") java.util.Collection<AppointmentStatus> statuses);
}
