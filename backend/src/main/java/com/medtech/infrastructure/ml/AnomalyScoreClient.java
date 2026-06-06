package com.medtech.infrastructure.ml;

import com.medtech.infrastructure.config.MlScoringProperties;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * Best-effort gateway to the ML scoring service.
 *
 * <p>Every method swallows failures and returns {@link Optional#empty()} — a slow or
 * unavailable model service must never break a patient-facing flow such as booking.
 * Callers treat "no score" as a normal, non-exceptional outcome and fall back to the
 * platform's existing behaviour.
 *
 * <p><b>Observability:</b> because the feature is best-effort and silent, every real
 * scoring attempt is timed under {@code medtech.ml.scoring} (tags {@code model} and
 * {@code outcome=hit|empty|error}). That makes call volume, fallback rate, and latency
 * visible via {@code /actuator/metrics} — otherwise a service that has quietly stopped
 * scoring would be indistinguishable from one with no traffic.
 */
@Slf4j
@Component
public class AnomalyScoreClient {

    private static final String SCORING_TIMER = "medtech.ml.scoring";

    private final RestClient mlRestClient;
    private final MlScoringProperties props;
    private final MeterRegistry meterRegistry;

    public AnomalyScoreClient(RestClient mlRestClient, MlScoringProperties props,
                              MeterRegistry meterRegistry) {
        this.mlRestClient = mlRestClient;
        this.props = props;
        this.meterRegistry = meterRegistry;
    }

    /**
     * Score an appointment's no-show risk. Returns empty when scoring is disabled,
     * the service is unreachable, or the response is malformed.
     */
    public Optional<NoShowScoreResponse> scoreNoShow(NoShowScoreRequest.Features features) {
        return scored("no-show", () -> mlRestClient.post()
                .uri("/score/no-show")
                .body(new NoShowScoreRequest(features))
                .retrieve()
                .body(NoShowScoreResponse.class));
    }

    /**
     * Score a user's recent access behaviour for anomalousness. Returns empty when
     * scoring is disabled, the service is unreachable, or the response is malformed —
     * the caller keeps relying on its rule-based checks.
     */
    public Optional<AccessAnomalyScoreResponse> scoreAccessAnomaly(
            Long userId, AccessAnomalyScoreRequest.Features features) {
        return scored("access-anomaly", () -> mlRestClient.post()
                .uri("/score/access-anomaly")
                .body(new AccessAnomalyScoreRequest(userId, features))
                .retrieve()
                .body(AccessAnomalyScoreResponse.class));
    }

    /**
     * Runs a scoring call best-effort: short-circuits when disabled, swallows any failure,
     * and records latency + outcome. Shared by both endpoints so the resilience and
     * instrumentation live in exactly one place.
     */
    private <T> Optional<T> scored(String model, Supplier<T> call) {
        if (!props.enabled()) {
            return Optional.empty();
        }
        long startNanos = System.nanoTime();
        String outcome = "error";
        try {
            T resp = call.get();
            outcome = (resp != null) ? "hit" : "empty";
            return Optional.ofNullable(resp);
        } catch (Exception ex) {
            log.warn("ML {} scoring failed (best-effort, ignoring): {}", model, ex.getMessage());
            return Optional.empty();
        } finally {
            Timer.builder(SCORING_TIMER)
                    .tag("model", model)
                    .tag("outcome", outcome)
                    .register(meterRegistry)
                    .record(System.nanoTime() - startNanos, TimeUnit.NANOSECONDS);
        }
    }
}
