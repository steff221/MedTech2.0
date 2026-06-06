package com.medtech.infrastructure.ml;

import com.medtech.infrastructure.config.MlScoringProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Optional;

/**
 * Best-effort gateway to the ML scoring service.
 *
 * <p>Every method swallows failures and returns {@link Optional#empty()} — a slow or
 * unavailable model service must never break a patient-facing flow such as booking.
 * Callers treat "no score" as a normal, non-exceptional outcome and fall back to the
 * platform's existing behaviour.
 */
@Slf4j
@Component
public class AnomalyScoreClient {

    private final RestClient mlRestClient;
    private final MlScoringProperties props;

    public AnomalyScoreClient(RestClient mlRestClient, MlScoringProperties props) {
        this.mlRestClient = mlRestClient;
        this.props = props;
    }

    /**
     * Score an appointment's no-show risk. Returns empty when scoring is disabled,
     * the service is unreachable, or the response is malformed.
     */
    public Optional<NoShowScoreResponse> scoreNoShow(NoShowScoreRequest.Features features) {
        if (!props.enabled()) {
            return Optional.empty();
        }
        try {
            NoShowScoreResponse resp = mlRestClient.post()
                    .uri("/score/no-show")
                    .body(new NoShowScoreRequest(features))
                    .retrieve()
                    .body(NoShowScoreResponse.class);
            return Optional.ofNullable(resp);
        } catch (Exception ex) {
            log.warn("ML no-show scoring failed (best-effort, ignoring): {}", ex.getMessage());
            return Optional.empty();
        }
    }
}
