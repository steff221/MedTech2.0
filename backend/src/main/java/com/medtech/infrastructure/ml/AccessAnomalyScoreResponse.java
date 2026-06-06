package com.medtech.infrastructure.ml;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Response body from {@code POST /score/access-anomaly}. Mirrors the ml-service contract.
 * Unknown fields are ignored so the service can add fields without breaking us.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AccessAnomalyScoreResponse(
        @JsonProperty("user_id")       Long userId,
        double score,
        String band,
        @JsonProperty("top_factors")   List<String> topFactors,
        @JsonProperty("model_version") String modelVersion
) {

    /** True when the service classified this behaviour as HIGH-risk anomalous. */
    public boolean isHigh() {
        return "HIGH".equalsIgnoreCase(band);
    }
}
