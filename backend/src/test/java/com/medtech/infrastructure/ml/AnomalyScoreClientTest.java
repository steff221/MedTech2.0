package com.medtech.infrastructure.ml;

import com.medtech.infrastructure.config.MlScoringProperties;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.http.MediaType.APPLICATION_JSON;

class AnomalyScoreClientTest {

    private static final NoShowScoreRequest.Features FEATURES =
            new NoShowScoreRequest.Features(0.8, 30, 1, 8, "SPECIALIST", 3, 20);

    private AnomalyScoreClient clientWith(boolean enabled, RestClient restClient) {
        var props = new MlScoringProperties(enabled, "http://ml-test", 500, 1500);
        return new AnomalyScoreClient(restClient, props);
    }

    @Test
    void disabled_shortCircuits_withoutCallingService() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://ml-test");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        // No expectations registered: any HTTP call would fail verification.
        AnomalyScoreClient client = clientWith(false, builder.build());

        assertThat(client.scoreNoShow(FEATURES)).isEmpty();
        server.verify(); // proves zero requests were made
    }

    @Test
    void success_mapsSnakeCaseResponse() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://ml-test");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo("http://ml-test/score/no-show"))
              .andExpect(method(POST))
              // Verifies the request body uses the snake_case contract field names.
              .andExpect(jsonPath("$.features.historical_no_show_rate").value(0.8))
              .andExpect(jsonPath("$.features.appointment_type").value("SPECIALIST"))
              .andRespond(withSuccess("""
                      {"risk":0.73,"band":"HIGH",
                       "top_factors":["historical_no_show_rate","lead_time_days"],
                       "model_version":"noshow-heuristic-v0"}
                      """, APPLICATION_JSON));

        Optional<NoShowScoreResponse> result = clientWith(true, builder.build()).scoreNoShow(FEATURES);

        assertThat(result).isPresent();
        assertThat(result.get().risk()).isEqualTo(0.73);
        assertThat(result.get().band()).isEqualTo("HIGH");
        assertThat(result.get().topFactors()).containsExactly("historical_no_show_rate", "lead_time_days");
        assertThat(result.get().modelVersion()).isEqualTo("noshow-heuristic-v0");
        server.verify();
    }

    @Test
    void serviceError_isSwallowed_returnsEmpty() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://ml-test");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo("http://ml-test/score/no-show"))
              .andRespond(withServerError());

        // A 500 must not propagate — booking flows depend on this being best-effort.
        assertThat(clientWith(true, builder.build()).scoreNoShow(FEATURES)).isEmpty();
    }
}
