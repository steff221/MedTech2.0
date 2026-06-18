package com.medtech.infrastructure.ml;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Response body from {@code POST /score/no-show}. Mirrors the ml-service contract.
 * Unknown fields are ignored so the service can add fields without breaking us.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record NoShowScoreResponse(
        double risk,
        String band,
        @JsonProperty("top_factors")   List<String> topFactors,
        @JsonProperty("model_version") String modelVersion
) {}
