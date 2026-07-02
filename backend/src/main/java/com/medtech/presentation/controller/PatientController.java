package com.medtech.presentation.controller;

import com.medtech.domain.entity.Patient;
import com.medtech.application.dto.mapper.AppointmentMapper;
import com.medtech.application.dto.mapper.MedicalRecordMapper;
import com.medtech.application.dto.mapper.PatientMapper;
import com.medtech.application.dto.mapper.PrescriptionMapper;
import com.medtech.application.dto.request.CreatePatientRequest;
import com.medtech.application.dto.request.UpdatePatientRequest;
import com.medtech.application.dto.response.AppointmentResponse;
import com.medtech.application.dto.response.MedicalRecordResponse;
import com.medtech.application.dto.response.PatientDataExportResponse;
import com.medtech.application.dto.response.PatientResponse;
import com.medtech.application.dto.response.PrescriptionResponse;
import com.medtech.application.service.AppointmentService;
import com.medtech.application.service.AuditLogService;
import com.medtech.application.service.DoctorRatingService;
import com.medtech.application.service.MedicalRecordService;
import com.medtech.application.service.PatientDataExportService;
import com.medtech.application.service.PatientService;
import com.medtech.application.service.PrescriptionService;
import com.medtech.domain.vo.AuditAction;
import com.medtech.domain.vo.AuditStatus;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.security.PatientAccessGuard;
import com.medtech.infrastructure.security.SecurityUtils;
import com.medtech.infrastructure.security.Roles;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST контролер: endpoints за пациентите (вкл. GDPR извоз на податоци).
 */
@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@Tag(name = "Patients", description = "Patient profile, appointments, medical history, prescriptions")
public class PatientController {

    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final MedicalRecordService medicalRecordService;
    private final PrescriptionService prescriptionService;

    private final PatientMapper patientMapper;
    private final AppointmentMapper appointmentMapper;
    private final MedicalRecordMapper medicalRecordMapper;
    private final PrescriptionMapper prescriptionMapper;

    private final DoctorRatingService doctorRatingService;
    private final PatientAccessGuard accessGuard;
    private final AuditLogService auditLogService;
    private final PatientDataExportService exportService;

    @GetMapping("/my-patients")
    @PreAuthorize(Roles.CLINICIAN)
    @Operation(summary = "List only patients who have had at least one appointment with the authenticated doctor")
    public ResponseEntity<org.springframework.data.domain.Page<PatientResponse>> myPatients(
            @org.springframework.data.web.PageableDefault(size = 20) Pageable pageable) {
        Long doctorUserId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new com.medtech.infrastructure.exception.AuthorizationException("Authentication required"));
        Pageable capped = org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(),
                Math.min(pageable.getPageSize(), 100),
                pageable.getSort());
        return ResponseEntity.ok(patientService.findByDoctorUserId(doctorUserId, capped).map(patientMapper::toResponse));
    }

    @GetMapping
    @PreAuthorize(Roles.CARE_TEAM_OR_ADMIN)
    @Operation(summary = "Search patients by name or email, optionally scoped to a hospital")
    public ResponseEntity<org.springframework.data.domain.Page<PatientResponse>> search(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "") String q,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Long hospitalId,
            Pageable pageable) {
        return ResponseEntity.ok(patientService.search(q, hospitalId, pageable).map(patientMapper::toResponse));
    }

    @PostMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Create the patient profile for the currently authenticated PATIENT user")
    public ResponseEntity<PatientResponse> createSelfProfile(@Valid @RequestBody CreatePatientRequest request) {
        Long userId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(patientMapper.toResponse(patientService.createForUser(userId, request)));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Return the patient profile of the current user")
    public ResponseEntity<PatientResponse> me() {
        Long userId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        return ResponseEntity.ok(patientMapper.toResponse(patientService.getByUserId(userId)));
    }

    @GetMapping("/{id}")
    @PreAuthorize(Roles.CARE_TEAM_OR_ADMIN)
    @Operation(summary = "Get a patient profile (doctors must have a care relationship)")
    public ResponseEntity<PatientResponse> getById(@PathVariable Long id, HttpServletRequest request) {
        accessGuard.assertCanAccessPatient(id);
        SecurityUtils.currentUserId().ifPresent(uid ->
            auditLogService.recordByUserId(uid, AuditAction.VIEW, "Patient", id,
                "Patient profile viewed", clientIp(request), request.getHeader("User-Agent"), AuditStatus.SUCCESS)
        );
        return ResponseEntity.ok(patientMapper.toResponse(patientService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    @Operation(summary = "Update patient demographics (self) or any (admin)")
    public ResponseEntity<PatientResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody UpdatePatientRequest request) {
        if (SecurityUtils.hasRole("PATIENT")) {
            Long userId = SecurityUtils.currentUserId()
                    .orElseThrow(() -> new AuthorizationException("Authentication required"));
            Patient owned = patientService.getByUserId(userId);
            if (!owned.getId().equals(id)) {
                throw new AuthorizationException("Patients may only update their own profile");
            }
        }
        return ResponseEntity.ok(patientMapper.toResponse(patientService.update(id, request)));
    }

    @GetMapping("/me/export")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Full machine-readable export of the current patient's data (GDPR Art. 15/20)")
    public ResponseEntity<PatientDataExportResponse> exportMyData(HttpServletRequest request) {
        Long userId = SecurityUtils.currentUserId()
                .orElseThrow(() -> new AuthorizationException("Authentication required"));
        PatientDataExportResponse export = exportService.exportForUser(userId);
        auditLogService.recordByUserId(userId, AuditAction.VIEW, "Patient", export.profile().id(),
                "Full data export (GDPR subject access)", clientIp(request),
                request.getHeader("User-Agent"), AuditStatus.SUCCESS);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"medtech-data-export.json\"")
                .body(export);
    }

    @GetMapping("/{id}/appointments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<AppointmentResponse>> appointments(@PathVariable Long id, Pageable pageable) {
        accessGuard.assertCanAccessPatient(id);
        Page<AppointmentResponse> page = appointmentService.listForPatient(id, pageable)
                .map(appointmentMapper::toResponse);
        return ResponseEntity.ok(doctorRatingService.enrichWithRatingIds(page));
    }

    @GetMapping("/{id}/medical-records")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<MedicalRecordResponse>> medicalRecords(@PathVariable Long id, Pageable pageable,
                                                                      HttpServletRequest request) {
        accessGuard.assertCanAccessPatient(id);
        SecurityUtils.currentUserId().ifPresent(uid ->
            auditLogService.recordByUserId(uid, AuditAction.VIEW, "Patient", id,
                "Medical records viewed", clientIp(request), request.getHeader("User-Agent"), AuditStatus.SUCCESS)
        );
        return ResponseEntity.ok(medicalRecordService.historyOf(id, pageable).map(medicalRecordMapper::toResponse));
    }

    @GetMapping("/{id}/prescriptions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<PrescriptionResponse>> prescriptions(@PathVariable Long id, Pageable pageable,
                                                                    HttpServletRequest request) {
        accessGuard.assertCanAccessPatient(id);
        SecurityUtils.currentUserId().ifPresent(uid ->
            auditLogService.recordByUserId(uid, AuditAction.VIEW, "Patient", id,
                "Prescriptions viewed", clientIp(request), request.getHeader("User-Agent"), AuditStatus.SUCCESS)
        );
        return ResponseEntity.ok(prescriptionService.listFor(id, pageable).map(prescriptionMapper::toResponse));
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isBlank())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
    }
}
