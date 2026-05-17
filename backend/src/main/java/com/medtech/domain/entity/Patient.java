package com.medtech.domain.entity;

import com.medtech.domain.vo.Gender;
import com.medtech.infrastructure.persistence.PgEnumStringConverter;
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
@Table(name = "patients")
@Getter
@Setter
@NoArgsConstructor
@ToString(of = {"id", "user"})
@EntityListeners(AuditingEntityListener.class)
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 1:1 with {@link User}. Eagerly fetched because nearly every patient operation
     * needs the user's identity (name, email, role).
     */
    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "gender_enum")
    private Gender gender;

    /**
     * Stored as the raw PG enum literal (e.g. {@code "O+"}); wrapped by
     * {@link com.medtech.domain.vo.BloodType} in the service layer.
     *
     * <p>Routed through {@link PgEnumStringConverter} so reads come back as
     * {@code String}. The previous {@code @JdbcTypeCode(SqlTypes.OTHER)}
     * mapping wrote correctly but read back as {@code byte[]}, because pgjdbc
     * returns a {@code PGobject} for unknown types and Hibernate's
     * {@code StringJavaType} cannot wrap that. With the converter, both
     * directions go through varchar and pgjdbc's implicit {@code varchar →
     * blood_type_enum} cast handles writes.
     */
    @Convert(converter = PgEnumStringConverter.class)
    @Column(name = "blood_type", columnDefinition = "blood_type_enum")
    private String bloodType;

    @Column(columnDefinition = "text")
    private String allergies;

    @Column(name = "chronic_conditions", columnDefinition = "text")
    private String chronicConditions;

    @Column(name = "insurance_provider", length = 255)
    private String insuranceProvider;

    @Column(name = "insurance_number", length = 100)
    private String insuranceNumber;

    @Column(name = "emergency_contact", length = 255)
    private String emergencyContact;

    @Column(name = "emergency_phone", length = 20)
    private String emergencyPhone;

    @Column(length = 500)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(length = 100)
    private String country;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
