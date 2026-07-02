package com.medtech.infrastructure.security.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA converter that transparently encrypts/decrypts a {@link String} column
 * with {@link PhiCryptoService}. Apply explicitly with
 * {@code @Convert(converter = PhiStringConverter.class)} on PHI free-text fields
 * that are never used in query predicates.
 *
 * <p>JPA converters are instantiated by Hibernate, not Spring, so the crypto
 * service is supplied through a static reference set once at startup by
 * {@link PhiCryptoInitializer}. This keeps the converter working no matter which
 * container instantiates it.
 *
 * JPA конвертер кој шифрира/дешифрира текстуална PHI колона.
 */
@Converter
public class PhiStringConverter implements AttributeConverter<String, String> {

    private static volatile PhiCryptoService cryptoService;

    static void setCryptoService(PhiCryptoService service) {
        cryptoService = service;
    }

    private static PhiCryptoService crypto() {
        final PhiCryptoService service = cryptoService;
        if (service == null) {
            throw new IllegalStateException(
                    "PhiCryptoService not initialised — PhiCryptoInitializer must run before JPA access");
        }
        return service;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return crypto().encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return crypto().decrypt(dbData);
    }
}
