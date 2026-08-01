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

/**
 * Spring Data JPA репозиториум: пристап до записите за термини (Appointment).
 */
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("""
           SELECT a FROM Appointment a
           JOIN FETCH a.patient
           JOIN FETCH a.doctor
           WHERE a.patient.id = :patientId
           """)
    Page<Appointment> findByPatientId(@Param("patientId") Long patientId, Pageable pageable);

    @Query("""
           SELECT a FROM Appointment a
           JOIN FETCH a.patient
           JOIN FETCH a.doctor
           WHERE a.doctor.id = :doctorId
             AND a.appointmentDate = :date
           """)
    Page<Appointment> findByDoctorIdAndAppointmentDate(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            Pageable pageable);

    @Query("""
           SELECT a FROM Appointment a
           JOIN FETCH a.patient
           JOIN FETCH a.doctor
           WHERE a.doctor.id = :doctorId
             AND a.status = :status
           """)
    Page<Appointment> findByDoctorIdAndStatus(
            @Param("doctorId") Long doctorId,
            @Param("status") AppointmentStatus status,
            Pageable pageable);

    @Query("""
           SELECT a FROM Appointment a
           JOIN FETCH a.patient
           JOIN FETCH a.doctor
           WHERE a.doctor.id = :doctorId
             AND a.appointmentDate BETWEEN :from AND :to
           """)
    Page<Appointment> findByDoctorIdAndAppointmentDateBetween(
            @Param("doctorId") Long doctorId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    /**
     * Returns true when the doctor (identified by their user id) has at least one
     * appointment—past or future—with the given patient. Used by the access guard
     * to verify a care relationship before exposing patient data.
     */
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.doctor.user.id = :doctorUserId AND a.patient.id = :patientId")
    boolean hasCareRelationship(@Param("doctorUserId") Long doctorUserId, @Param("patientId") Long patientId);

    @Query("""
           SELECT a FROM Appointment a
           JOIN FETCH a.patient
           JOIN FETCH a.doctor
           WHERE a.appointmentDate = :date
           ORDER BY a.appointmentTime ASC
           """)
    List<Appointment> findAllByAppointmentDate(@Param("date") LocalDate date);

    /**
     * The times a doctor is already taken on a given date.
     *
     * Deliberately projects times only. A patient choosing a slot has to know
     * which ones are gone, but must never learn who is in them — so this
     * returns no appointment, patient or reason, and is safe to expose to the
     * patient role in a way the full appointment listing is not.
     */
    @Query("""
           SELECT a.appointmentTime FROM Appointment a
           WHERE a.doctor.id = :doctorId
             AND a.appointmentDate = :date
             AND a.status IN :statuses
           """)
    List<java.time.LocalTime> findBookedTimes(@Param("doctorId") Long doctorId,
                                              @Param("date") LocalDate date,
                                              @Param("statuses") java.util.Collection<AppointmentStatus> statuses);

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
                                      @Param("time") java.time.LocalTime time,
                                      @Param("statuses") java.util.Collection<AppointmentStatus> statuses);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("""
           SELECT a FROM Appointment a
           WHERE a.patient.id = :patientId
             AND a.appointmentDate = :date
             AND a.appointmentTime = :time
             AND a.status IN :statuses
           """)
    List<Appointment> lockPatientConflicting(@Param("patientId") Long patientId,
                                             @Param("date") LocalDate date,
                                             @Param("time") java.time.LocalTime time,
                                             @Param("statuses") java.util.Collection<AppointmentStatus> statuses);
}
