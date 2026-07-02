package com.medtech.domain.entity;

import com.medtech.domain.vo.ReportPeriodType;
import com.medtech.domain.vo.ReportStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;

/**
 * JPA ентитет: генериран извештај за работата на доктор.
 */
@Entity
@Table(name = "doctor_reports")
@Getter
@Setter
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class DoctorReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(name = "report_number", nullable = false, unique = true, length = 30)
    private String reportNumber;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "period_type", nullable = false, columnDefinition = "report_period_type_enum")
    private ReportPeriodType periodType;

    @Column(name = "period_label", nullable = false, length = 50)
    private String periodLabel;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "patient_count", nullable = false)
    private int patientCount;

    @Column(name = "diagnosis_count", nullable = false)
    private int diagnosisCount;

    @Column(name = "appointment_count", nullable = false)
    private int appointmentCount;

    @Column(name = "prescription_count", nullable = false)
    private int prescriptionCount;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", nullable = false, columnDefinition = "report_status_enum")
    private ReportStatus status = ReportStatus.DRAFT;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
