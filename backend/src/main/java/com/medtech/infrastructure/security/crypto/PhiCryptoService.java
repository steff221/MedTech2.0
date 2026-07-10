package com.medtech.infrastructure.security.crypto;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM authenticated encryption for PHI columns at rest.
 *
 * <p>Ciphertext is stored as {@code enc:v1:<base64(iv || ciphertext || tag)>}.
 * The version-tagged prefix serves two purposes:
 * <ul>
 *   <li><b>Legacy passthrough</b> — {@link #decrypt} returns any value that is
 *       not prefixed unchanged, so a database that still holds plaintext PHI
 *       (e.g. before a backfill) keeps working. New writes are always encrypted.</li>
 *   <li><b>Rotation headroom</b> — a future {@code v2} scheme can be detected
 *       and migrated without ambiguity.</li>
 * </ul>
 *
 * <p>A fresh 12-byte IV is generated per value, so identical plaintexts produce
 * different ciphertexts. That is why encrypted columns must never be used in
 * {@code WHERE}/{@code ORDER BY}/index predicates.
 *
 * Сервис за AES-256-GCM шифрирање на PHI податоци во база (encryption at rest).
 */
@Service
public class PhiCryptoService {

    static final String PREFIX = "enc:v1:";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int KEY_LENGTH_BYTES = 32; // AES-256

    private final EncryptionProperties properties;
    private final SecureRandom secureRandom = new SecureRandom();
    private SecretKey secretKey;

    // Two constructors exist (the test one below), so Spring needs this marked
    // as the injection point explicitly.
    @Autowired
    public PhiCryptoService(EncryptionProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    void init() {
        this.secretKey = loadKey(properties.key());
    }

    /**
     * Package-private constructor for tests — accepts the raw base64 key directly.
     */
    PhiCryptoService(String base64Key) {
        this.properties = new EncryptionProperties(base64Key);
        this.secretKey = loadKey(base64Key);
    }

    private static SecretKey loadKey(String base64Key) {
        final byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(base64Key.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(
                    "MEDTECH_PHI_ENCRYPTION_KEY is not valid base64", e);
        }
        if (keyBytes.length != KEY_LENGTH_BYTES) {
            throw new IllegalStateException(
                    "MEDTECH_PHI_ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256), got "
                            + keyBytes.length);
        }
        return new SecretKeySpec(keyBytes, "AES");
    }

    /**
     * Encrypts a plaintext value. {@code null} passes through unchanged; any
     * other value (including empty string) is encrypted and prefixed.
     */
    public String encrypt(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            final byte[] iv = new byte[IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            final Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey,
                    new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            final byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            final byte[] payload = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, payload, 0, iv.length);
            System.arraycopy(ciphertext, 0, payload, iv.length, ciphertext.length);

            return PREFIX + Base64.getEncoder().encodeToString(payload);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt PHI value", e);
        }
    }

    /**
     * Decrypts a value produced by {@link #encrypt}. {@code null} passes through;
     * a value without the {@code enc:v1:} prefix is treated as legacy plaintext
     * and returned unchanged.
     */
    public String decrypt(String stored) {
        if (stored == null) {
            return null;
        }
        if (!stored.startsWith(PREFIX)) {
            return stored; // legacy plaintext, not yet migrated
        }
        try {
            final byte[] payload = Base64.getDecoder()
                    .decode(stored.substring(PREFIX.length()));
            if (payload.length <= IV_LENGTH_BYTES) {
                throw new IllegalArgumentException("Ciphertext too short");
            }
            final byte[] iv = new byte[IV_LENGTH_BYTES];
            System.arraycopy(payload, 0, iv, 0, IV_LENGTH_BYTES);
            final byte[] ciphertext = new byte[payload.length - IV_LENGTH_BYTES];
            System.arraycopy(payload, IV_LENGTH_BYTES, ciphertext, 0, ciphertext.length);

            final Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, secretKey,
                    new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception e) {
            // GCM tag mismatch (tampering / wrong key) or malformed payload.
            throw new IllegalStateException("Failed to decrypt PHI value", e);
        }
    }
}
