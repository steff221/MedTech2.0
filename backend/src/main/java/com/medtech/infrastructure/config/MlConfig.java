package com.medtech.infrastructure.config;

import org.springframework.boot.web.client.ClientHttpRequestFactorySettings;
import org.springframework.boot.web.client.ClientHttpRequestFactories;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * Builds the {@link RestClient} used to talk to the ML scoring service.
 * Short timeouts are deliberate: scoring is best-effort and must never make a
 * patient-facing request hang on a slow/unavailable model service.
 */
@Configuration
public class MlConfig {

    @Bean
    RestClient mlRestClient(MlScoringProperties props) {
        var settings = ClientHttpRequestFactorySettings.DEFAULTS
                .withConnectTimeout(Duration.ofMillis(props.connectTimeoutMs()))
                .withReadTimeout(Duration.ofMillis(props.readTimeoutMs()));
        return RestClient.builder()
                .baseUrl(props.baseUrl())
                .requestFactory(ClientHttpRequestFactories.get(settings))
                .build();
    }
}
