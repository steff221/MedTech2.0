package com.medtech.domain.entity;

import com.medtech.domain.vo.OperationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "operations")
@Getter
@Setter
@NoArgsConstructor
@ToString(of = {"id", "operationName", "status", "operationDate"})
@EntityListeners(AuditingEntityListener.class)
public class Operation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Column(name = "operation_name", nullable = false, length = 255)
    private String operationName;

    /** Pre-operative diagnosis as WHO ICD-10 (MKB-10) code, e.g. {@code K35.8}. */
    @Column(name = "mkb10_code", length = 10)
    private String mkb10Code;

    @Column(name = "operation_date", nullable = false)
    private LocalDate operationDate;

    @Column(name = "operation_time", length = 10)
    private String operationTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "operation_room", length = 50)
    private String operationRoom;

    @Column(name = "surgical_team", length = 500)
    private String surgicalTeam;

    @Column(name = "anesthesia_type", length = 100)
    private String anesthesiaType;

    @Column(length = 255)
    private String anesthesiologist;

    @Column(name = "pre_operative_notes", columnDefinition = "text")
    private String preOperativeNotes;

    @Column(name = "intra_operative_notes", columnDefinition = "text")
    private String intraOperativeNotes;

    @Column(name = "post_operative_notes", columnDefinition = "text")
    private String postOperativeNotes;

    @Column(length = 500)
    private String complications;

    @Column(length = 500)
    private String outcome;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "operation_status_enum")
    private OperationStatus status = OperationStatus.SCHEDULED;

    @Column(name = "implants_used", columnDefinition = "text")
    private String implantsUsed;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
