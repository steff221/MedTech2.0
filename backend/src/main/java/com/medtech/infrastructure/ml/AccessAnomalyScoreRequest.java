package com.medtech.infrastructure.ml;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request body for {@code POST /score/access-anomaly}. Field names are snake_case to
 * match the ml-service pydantic contract exactly — do not rename without updating both
 * sides. Mirrors {@code app.schemas.AccessAnomalyFeatures}.
 */
public record AccessAnomalyScoreRequest(
        @JsonProperty("user_id") Long userId,
        Features features
) {

    public record Features(
            @JsonProperty("total_actions")            int totalActions,
            @JsonProperty("distinct_patients_viewed") int distinctPatientsViewed,
            @JsonProperty("off_hours_actions")        int offHoursActions,
            @JsonProperty("distinct_ips")             int distinctIps,
            @JsonProperty("failed_actions")           int failedActions,
            @JsonProperty("distinct_entity_types")    int distinctEntityTypes
    ) {}
}
