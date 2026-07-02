package com.medtech.infrastructure.security.crypto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Тестови за JPA конвертерот кој шифрира/дешифрира PHI колони.
 */
class PhiStringConverterTest {

    private final PhiStringConverter converter = new PhiStringConverter();

    @BeforeEach
    void wireCryptoService() {
        PhiStringConverter.setCryptoService(
                new PhiCryptoService(Base64.getEncoder().encodeToString(new byte[32])));
    }

    @Test
    void toDatabase_encrypts_toEntity_decrypts() {
        String plaintext = "clinical notes: patient stable";

        String stored = converter.convertToDatabaseColumn(plaintext);
        assertThat(stored).startsWith("enc:v1:").doesNotContain(plaintext);

        assertThat(converter.convertToEntityAttribute(stored)).isEqualTo(plaintext);
    }

    @Test
    void nullValues_passThroughBothWays() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
        assertThat(converter.convertToEntityAttribute(null)).isNull();
    }

    @Test
    void toEntity_legacyPlaintext_returnedUnchanged() {
        assertThat(converter.convertToEntityAttribute("legacy plaintext"))
                .isEqualTo("legacy plaintext");
    }
}
