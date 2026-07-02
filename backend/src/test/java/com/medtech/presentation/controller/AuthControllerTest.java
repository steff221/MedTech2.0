package com.medtech.presentation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtech.application.dto.request.LoginRequest;
import com.medtech.application.dto.request.RegisterRequest;
import com.medtech.application.dto.response.AuthResponse;
import com.medtech.application.dto.response.UserResponse;
import com.medtech.application.service.AuthService;
import com.medtech.domain.vo.UserRole;
import com.medtech.domain.vo.UserStatus;
import com.medtech.infrastructure.config.JpaConfig;
import com.medtech.infrastructure.config.SecurityConfig;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.security.JwtProperties;
import com.medtech.infrastructure.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JpaConfig.class}))
/**
 * WebMvc тестови за AuthController (endpoints за автентикација).
 */
@Import(WebMvcTestSecurityConfig.class)
@WithMockUser
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean AuthService authService;
    @MockBean JwtProperties jwtProperties;

    @Test
    void register_returns201() throws Exception {
        var req = new RegisterRequest("e@e.mk", "Str0ng!Passw0rd#2026", "F", "L", null, UserRole.PATIENT);
        var resp = AuthResponse.builder()
                .accessToken("a").refreshToken("r").tokenType("Bearer").expiresInSeconds(3600)
                .user(UserResponse.builder().id(1L).email("e@e.mk")
                        .role(UserRole.PATIENT).status(UserStatus.ACTIVE).build())
                .build();
        when(authService.register(any())).thenReturn(resp);

        mockMvc.perform(post("/api/auth/register")
                        .with(csrfDisabled())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("a"))
                .andExpect(jsonPath("$.user.email").value("e@e.mk"));
    }

    @Test
    void login_returns200() throws Exception {
        var resp = AuthResponse.builder()
                .accessToken("a").refreshToken("r").tokenType("Bearer").expiresInSeconds(3600)
                .user(UserResponse.builder().email("x@y.mk")
                        .role(UserRole.PATIENT).status(UserStatus.ACTIVE).build())
                .build();
        when(authService.login(any())).thenReturn(resp);

        mockMvc.perform(post("/api/auth/login")
                        .with(csrfDisabled())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("x@y.mk", "P@ssword1234!"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refreshToken").value("r"));
    }

    @Test
    void invalidPayloadReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .with(csrfDisabled())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"bad\",\"password\":\"weak\",\"firstName\":\"\",\"lastName\":\"\",\"role\":\"PATIENT\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void serviceThrowsConflict_returns409() throws Exception {
        when(authService.register(any())).thenThrow(new ConflictException("AUTH_EMAIL_TAKEN", "taken"));
        var req = new RegisterRequest("e@e.mk", "Str0ng!Passw0rd#2026", "F", "L", null, UserRole.PATIENT);

        mockMvc.perform(post("/api/auth/register")
                        .with(csrfDisabled())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AUTH_EMAIL_TAKEN"));
    }

    @Test
    void serviceThrowsUnauthorized_returns401() throws Exception {
        when(authService.login(any())).thenThrow(AuthorizationException.invalidCredentials());

        mockMvc.perform(post("/api/auth/login")
                        .with(csrfDisabled())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"x@y.mk\",\"password\":\"WrongPassw0rd!1234\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"));
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor csrfDisabled() {
        return org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf();
    }
}
