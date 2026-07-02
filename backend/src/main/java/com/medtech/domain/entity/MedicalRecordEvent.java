package com.medtech.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

/**
 * JPA ентитет: настан/измена во историјата на медицинскиот картон.
 */
@Entity
@Table(name = "medical_record_events")
@Getter
@Setter
@NoArgsConstructor
public class MedicalRecordEvent {

    public static final String CREATED  = "CREATED";
    public static final String ADDENDUM = "ADDENDUM";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "record_id", nullable = false)
    private MedicalRecord record;

    @Column(name = "event_type", nullable = false, length = 20)
    private String eventType;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "authored_by", nullable = false)
    private User author;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String snapshot;

    @Column(columnDefinition = "text")
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public static MedicalRecordEvent created(MedicalRecord record, User author, String snapshot) {
        MedicalRecordEvent e = new MedicalRecordEvent();
        e.record = record;
        e.eventType = CREATED;
        e.author = author;
        e.snapshot = snapshot;
        return e;
    }

    public static MedicalRecordEvent addendum(MedicalRecord record, User author, String snapshot, String note) {
        MedicalRecordEvent e = new MedicalRecordEvent();
        e.record = record;
        e.eventType = ADDENDUM;
        e.author = author;
        e.snapshot = snapshot;
        e.note = note;
        return e;
    }
}
