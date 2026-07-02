package com.medtech.infrastructure.security.crypto;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

/**
 * Bridges the Spring-managed {@link PhiCryptoService} into the statically-held
 * reference used by {@link PhiStringConverter}. Runs at context startup, before
 * any JPA read/write reaches the converter.
 *
 * Го поврзува Spring bean-от со статичкиот конвертер за PHI шифрирање.
 */
@Component
public class PhiCryptoInitializer {

    private final PhiCryptoService cryptoService;

    public PhiCryptoInitializer(PhiCryptoService cryptoService) {
        this.cryptoService = cryptoService;
    }

    @PostConstruct
    void wire() {
        PhiStringConverter.setCryptoService(cryptoService);
    }
}
