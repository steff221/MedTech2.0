package com.medtech.infrastructure.ml;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Request body for {@code POST /score/no-show}. Field names are snake_case to match
 * the ml-service pydantic contract exactly — do not rename without updating both sides.
 */
public record NoShowScoreRequest(Features features) {

    public record Features(
            @JsonProperty("historical_no_show_rate") double historicalNoShowRate,
            @JsonProperty("lead_time_days")          int leadTimeDays,
            @JsonProperty("day_of_week")             int dayOfWeek,
            @JsonProperty("hour_of_day")             int hourOfDay,
            @JsonProperty("appointment_type")        String appointmentType,
            @JsonProperty("prior_reschedule_count")  int priorRescheduleCount,
            @JsonProperty("prior_appointment_count") int priorAppointmentCount
    ) {}
}
