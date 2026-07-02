package com.medtech.infrastructure.persistence;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Bridges a PostgreSQL native enum column (e.g. {@code blood_type_enum}) to a
 * Java {@code String} field on the entity.
 *
 * <p>The DB column type is a PG enum whose labels (e.g. {@code O+}, {@code AB-})
 * are not legal Java identifiers, so the entity stores them as Strings. The old
 * {@code @JdbcTypeCode(SqlTypes.OTHER)} mapping wrote correctly but read back
 * as {@code byte[]} because pgJDBC returns a {@code PGobject} for unknown types
 * and Hibernate's {@code StringJavaType} cannot wrap that. Routing both
 * directions through this converter keeps the value a String end-to-end —
 * pgJDBC's implicit {@code varchar → enum} cast handles writes.
 *
 * JPA конвертор: мапира PostgreSQL enum типови во String и обратно.
 */
@Converter
public class PgEnumStringConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return attribute;
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return dbData;
    }
}
