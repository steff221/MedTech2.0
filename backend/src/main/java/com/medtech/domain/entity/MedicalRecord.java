package com.medtech.domain.entity;

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

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "medical_records")
@Getter
@Setter
@NoArgsConstructor
@ToString(of = {"id", "mkb10Code", "createdAt"})
@EntityListeners(AuditingEntityListener.class)
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(length = 500)
    private String diagnosis;

    @Column(name = "mkb10_code", length = 20)
    private String mkb10Code;

    @Column(name = "clinical_notes", nullable = false, columnDefinition = "text")
    private String clinicalNotes;

    /** Raw JSON payload (parsed into {@link com.medtech.domain.vo.VitalSigns}). */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "vital_signs", columnDefinition = "jsonb")
    private String vitalSignsJson;

    @Column(name = "blood_pressure", length = 20)
    private String bloodPressure;

    @Column(name = "heart_rate")
    private Integer heartRate;

    @Column(precision = 5, scale = 2)
    private BigDecimal temperature;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(precision = 5, scale = 2)
    private BigDecimal height;

    @Column(precision = 5, scale = 2)
    private BigDecimal bmi;

    @Column(columnDefinition = "text")
    private String assessment;

    @Column(name = "plan", columnDefinition = "text")
    private String plan;

    @Column(name = "is_confidential", nullable = false)
    private boolean confidential = false;

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
