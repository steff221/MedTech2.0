package com.medtech.infrastructure.security.crypto;

import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit тестови за AES-256-GCM шифрирање на PHI податоци.
 */
class PhiCryptoServiceTest {

    private static final String KEY = Base64.getEncoder().encodeToString(new byte[32]);
    private final PhiCryptoService crypto = new PhiCryptoService(KEY);

    @Test
    void roundTrip_returnsOriginalPlaintext() {
        String plaintext = "Дијагноза: хипертензија, стадиум II";
        String encrypted = crypto.encrypt(plaintext);

        assertThat(encrypted).startsWith("enc:v1:");
        assertThat(encrypted).doesNotContain(plaintext);
        assertThat(crypto.decrypt(encrypted)).isEqualTo(plaintext);
    }

    @Test
    void encrypt_sameInputTwice_producesDifferentCiphertext() {
        String plaintext = "penicillin allergy";

        String a = crypto.encrypt(plaintext);
        String b = crypto.encrypt(plaintext);

        assertThat(a).isNotEqualTo(b); // random IV per value
        assertThat(crypto.decrypt(a)).isEqualTo(plaintext);
        assertThat(crypto.decrypt(b)).isEqualTo(plaintext);
    }

    @Test
    void nullValues_passThrough() {
        assertThat(crypto.encrypt(null)).isNull();
        assertThat(crypto.decrypt(null)).isNull();
    }

    @Test
    void emptyString_roundTrips() {
        String encrypted = crypto.encrypt("");
        assertThat(encrypted).startsWith("enc:v1:");
        assertThat(crypto.decrypt(encrypted)).isEmpty();
    }

    @Test
    void decrypt_legacyPlaintext_returnedUnchanged() {
        // A value stored before encryption was introduced has no prefix.
        assertThat(crypto.decrypt("plain unencrypted note")).isEqualTo("plain unencrypted note");
    }

    @Test
    void decrypt_tamperedCiphertext_throws() {
        String encrypted = crypto.encrypt("sensitive");
        // Flip the last character of the base64 payload to break the GCM tag.
        char last = encrypted.charAt(encrypted.length() - 1);
        String tampered = encrypted.substring(0, encrypted.length() - 1)
                + (last == 'A' ? 'B' : 'A');

        assertThatThrownBy(() -> crypto.decrypt(tampered))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void decrypt_wrongKey_throws() {
        String encrypted = crypto.encrypt("sensitive");
        byte[] otherKeyBytes = new byte[32];
        otherKeyBytes[0] = 1;
        PhiCryptoService otherKey =
                new PhiCryptoService(Base64.getEncoder().encodeToString(otherKeyBytes));

        assertThatThrownBy(() -> otherKey.decrypt(encrypted))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void construct_withWrongKeyLength_throws() {
        assertThatThrownBy(() -> new PhiCryptoService(Base64.getEncoder().encodeToString(new byte[16])))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }

    @Test
    void construct_withInvalidBase64_throws() {
        assertThatThrownBy(() -> new PhiCryptoService("not valid base64 !!!"))
                .isInstanceOf(IllegalStateException.class);
    }
}
