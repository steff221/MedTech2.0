package com.medtech.presentation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medtech.application.dto.mapper.AppointmentMapper;
import com.medtech.application.dto.request.BookAppointmentRequest;
import com.medtech.application.dto.response.AppointmentResponse;
import com.medtech.application.service.AppointmentService;
import com.medtech.constant.ErrorCode;
import com.medtech.infrastructure.security.PatientAccessGuard;
import com.medtech.infrastructure.security.PhiViewAuditor;
import com.medtech.domain.vo.AppointmentStatus;
import com.medtech.infrastructure.config.JpaConfig;
import com.medtech.infrastructure.config.SecurityConfig;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.exception.ValidationException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AppointmentController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {SecurityConfig.class, JpaConfig.class}))
/**
 * WebMvc тестови за AppointmentController (endpoints за термини).
 */
@Import(WebMvcTestSecurityConfig.class)
class AppointmentControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean AppointmentService appointmentService;
    @MockBean AppointmentMapper appointmentMapper;
    @MockBean PatientAccessGuard patientAccessGuard;
    @MockBean PhiViewAuditor phiViewAuditor;

    @Test
    @WithMockUser(roles = "PATIENT")
    void book_returns201() throws Exception {
        var req = new BookAppointmentRequest(20L, 10L,
                LocalDate.now().plusDays(7), LocalTime.of(9, 0),
                null, null, "checkup", null);
        when(appointmentService.book(any())).thenReturn(null);
        when(appointmentMapper.toResponse(any())).thenReturn(
                AppointmentResponse.builder().id(99L).status(AppointmentStatus.SCHEDULED)
                        .appointmentDate(req.appointmentDate()).appointmentTime(LocalTime.of(9, 0))
                        .createdAt(Instant.now()).build());

        mockMvc.perform(post("/api/appointments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(99))
                .andExpect(jsonPath("$.status").value("SCHEDULED"));
    }

    @Test
    @WithMockUser(roles = "PATIENT")
    void book_pastDateReturns400() throws Exception {
        when(appointmentService.book(any())).thenThrow(
                new ValidationException(ErrorCode.APPOINTMENT_IN_PAST, "past"));
        var req = new BookAppointmentRequest(20L, 10L,
                LocalDate.now().plusDays(7), LocalTime.of(9, 0), null, null, "x", null);

        mockMvc.perform(post("/api/appointments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(ErrorCode.APPOINTMENT_IN_PAST));
    }

    @Test
    @WithMockUser(roles = "PATIENT")
    void book_conflictReturns409() throws Exception {
        when(appointmentService.book(any())).thenThrow(
                new ConflictException(ErrorCode.APPOINTMENT_CONFLICT, "doctor busy"));
        var req = new BookAppointmentRequest(20L, 10L,
                LocalDate.now().plusDays(7), LocalTime.of(9, 0), null, null, "x", null);

        mockMvc.perform(post("/api/appointments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(ErrorCode.APPOINTMENT_CONFLICT));
    }

    @Test
    @WithMockUser(roles = "PATIENT")
    void book_invalidPayloadReturns400() throws Exception {
        mockMvc.perform(post("/api/appointments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"doctorId\":null,\"patientId\":10,\"appointmentDate\":\"2099-01-01\",\"appointmentTime\":\"25:99\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }
}
