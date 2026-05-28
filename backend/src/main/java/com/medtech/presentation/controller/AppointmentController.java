package com.medtech.presentation.controller;

import com.medtech.application.dto.mapper.AppointmentMapper;
import com.medtech.application.dto.request.BookAppointmentRequest;
import com.medtech.application.dto.request.CancelAppointmentRequest;
import com.medtech.application.dto.request.RescheduleAppointmentRequest;
import com.medtech.application.dto.request.SetVideoUrlRequest;
import com.medtech.application.dto.response.AppointmentResponse;
import com.medtech.application.service.AppointmentService;
import com.medtech.domain.entity.Appointment;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.security.PatientAccessGuard;
import com.medtech.infrastructure.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointments", description = "Appointment booking, rescheduling, cancellation, completion")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final AppointmentMapper mapper;
    private final PatientAccessGuard accessGuard;

    @PostMapping
    @PreAuthorize("hasAnyRole('PATIENT', 'NURSE')")
    @Operation(summary = "Book a new appointment")
    public ResponseEntity<AppointmentResponse> book(@Valid @RequestBody BookAppointmentRequest request) {
        // PATIENT role: enforce they can only book for their own patient record
        if (SecurityUtils.hasRole("PATIENT")) {
            accessGuard.assertCanAccessPatient(request.patientId());
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toResponse(appointmentService.book(request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get an appointment (caller must be patient, assigned doctor, nurse, or admin)")
    public ResponseEntity<AppointmentResponse> getById(@PathVariable Long id) {
        Appointment appt = appointmentService.getById(id);
        accessGuard.assertCanAccessPatient(appt.getPatient().getId());
        return ResponseEntity.ok(mapper.toResponse(appt));
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('NURSE', 'ADMIN')")
    @Operation(summary = "List all appointments for today (across all doctors)")
    public ResponseEntity<List<AppointmentResponse>> today() {
        return ResponseEntity.ok(
                appointmentService.listForDate(LocalDate.now())
                        .stream().map(mapper::toResponse).toList());
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    @Operation(summary = "List a doctor's appointments on a given date")
    public ResponseEntity<Page<AppointmentResponse>> byDoctorAndDate(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Pageable pageable) {
        return ResponseEntity.ok(
                appointmentService.listForDoctorOn(doctorId, date, pageable).map(mapper::toResponse));
    }

    @GetMapping("/doctor/{doctorId}/range")
    @PreAuthorize("hasAnyRole('DOCTOR', 'NURSE')")
    @Operation(summary = "List a doctor's appointments within a date range")
    public ResponseEntity<Page<AppointmentResponse>> byDoctorInRange(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Pageable pageable) {
        return ResponseEntity.ok(
                appointmentService.listForDoctorInRange(doctorId, from, to, pageable).map(mapper::toResponse));
    }

    @PutMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'NURSE')")
    @Operation(summary = "Move an appointment to a new date / time")
    public ResponseEntity<AppointmentResponse> reschedule(@PathVariable Long id,
                                                          @Valid @RequestBody RescheduleAppointmentRequest request) {
        Appointment appt = appointmentService.getById(id);
        assertCanActOnAppointment(appt);
        return ResponseEntity.ok(mapper.toResponse(appointmentService.reschedule(id, request)));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Doctor marks an appointment COMPLETED")
    public ResponseEntity<AppointmentResponse> complete(@PathVariable Long id) {
        Appointment appt = appointmentService.getById(id);
        Long currentUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        if (!appt.getDoctor().getUser().getId().equals(currentUserId)) {
            throw new AuthorizationException("You are not the assigned doctor for this appointment");
        }
        return ResponseEntity.ok(mapper.toResponse(appointmentService.complete(id)));
    }

    @PutMapping("/{id}/video-url")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Doctor sets or updates the video call URL for a virtual appointment")
    public ResponseEntity<AppointmentResponse> setVideoUrl(@PathVariable Long id,
                                                           @Valid @RequestBody SetVideoUrlRequest request) {
        Appointment appt = appointmentService.getById(id);
        Long currentUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        if (!appt.getDoctor().getUser().getId().equals(currentUserId)) {
            throw new AuthorizationException("You are not the assigned doctor for this appointment");
        }
        return ResponseEntity.ok(mapper.toResponse(appointmentService.setVideoCallUrl(id, request.videoCallUrl())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Cancel an appointment (soft delete via status change)")
    public ResponseEntity<AppointmentResponse> cancel(@PathVariable Long id,
                                                      @Valid @RequestBody(required = false) CancelAppointmentRequest request) {
        Appointment appt = appointmentService.getById(id);
        assertCanCancelAppointment(appt);
        String actor = SecurityUtils.currentUserId().map(uid -> "user:" + uid).orElse("SYSTEM");
        CancelAppointmentRequest body = request != null ? request : new CancelAppointmentRequest(null);
        return ResponseEntity.ok(mapper.toResponse(appointmentService.cancel(id, body, actor)));
    }

    private void assertCanActOnAppointment(Appointment appt) {
        if (SecurityUtils.hasRole("ADMIN") || SecurityUtils.hasRole("NURSE")) return;
        Long currentUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        boolean isPatient = appt.getPatient().getUser().getId().equals(currentUserId);
        boolean isDoctor  = appt.getDoctor().getUser().getId().equals(currentUserId);
        if (!isPatient && !isDoctor) {
            throw new AuthorizationException("You are not authorized to modify this appointment");
        }
    }

    private void assertCanCancelAppointment(Appointment appt) {
        if (SecurityUtils.hasRole("ADMIN") || SecurityUtils.hasRole("NURSE")) return;
        Long currentUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        boolean isPatient = appt.getPatient().getUser().getId().equals(currentUserId);
        boolean isDoctor  = appt.getDoctor().getUser().getId().equals(currentUserId);
        if (!isPatient && !isDoctor) {
            throw new AuthorizationException("You are not authorized to cancel this appointment");
        }
    }
}
