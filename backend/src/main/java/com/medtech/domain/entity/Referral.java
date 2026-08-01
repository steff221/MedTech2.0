package com.medtech.domain.entity;

import com.medtech.domain.vo.ReferralStatus;
import com.medtech.domain.vo.ReferralType;
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

/**
 * JPA ентитет: упат на пациент кон друг доктор/специјалист.
 */
@Entity
@Table(name = "referrals")
@Getter
@Setter
@NoArgsConstructor
@ToString(of = {"id", "referralNumber", "status"})
@EntityListeners(AuditingEntityListener.class)
public class Referral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "referral_number", nullable = false, length = 20, unique = true)
    private String referralNumber;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "referral_type", nullable = false, columnDefinition = "referral_type_enum")
    private ReferralType referralType;

    /** Здравствена установа to which the patient is referred. All forms. */
    @Column(name = "referred_to", nullable = false, length = 200)
    private String referredTo;

    /** Специјалност — СУ and БУ. */
    @Column(name = "referred_specialty", length = 200)
    private String referredSpecialty;

    /** Вид на услуга (ЛУ) or назив на апарат (РДУ). */
    @Column(name = "service_detail", columnDefinition = "text")
    private String serviceDetail;

    /**
     * Образец СУ "УПАТ ЗА": 1 специјалист/супспецијалист,
     * 2 дијагностичка лабораторија, 3 дијагностичка процедура.
     */
    @Column(name = "form_subtype")
    private Short formSubtype;

    @Column(name = "mkb10_code", length = 20)
    private String mkb10Code;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "referral_status_enum")
    private ReferralStatus status = ReferralStatus.ACTIVE;

    @Column(name = "outcome_note", columnDefinition = "text")
    private String outcomeNote;

    @Column(name = "outcome_date")
    private LocalDate outcomeDate;

    /**
     * The ФЗОМ form this referral was issued on — СУ, ЛУ-1, ЛУ-2, РДУ-1,
     * РДУ-2, БУ. Resolved once at creation and then frozen: the -1/-2 variant
     * depends on the issuing doctor's role, and a role change must not rewrite
     * a document that has already been printed and handed to a patient.
     */
    @Column(name = "fzom_form_code", length = 10)
    private String fzomFormCode;

    /** Работна единица — Одделение. Required by БУ. */
    @Column(name = "ward_unit", length = 200)
    private String wardUnit;

    /** Број на лекарски дневник, printed in the issuer block on every form. */
    @Column(name = "medical_journal_no", length = 50)
    private String medicalJournalNo;

    /** Why the referral was voided. Required whenever status is CANCELLED. */
    @Column(name = "cancellation_reason", columnDefinition = "text")
    private String cancellationReason;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancelled_by", length = 100)
    private String cancelledBy;

    /**
     * When the document was first printed. Non-null means a paper copy may be
     * in the patient's hands, which is what makes "cancelled after printing"
     * a distinct case from "cancelled before it ever existed on paper".
     */
    @Column(name = "printed_at")
    private Instant printedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
