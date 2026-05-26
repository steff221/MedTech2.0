package com.medtech.application.service;

import com.medtech.application.dto.request.GenerateReportRequest;
import com.medtech.application.dto.response.DoctorReportResponse;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.DoctorReport;
import com.medtech.domain.repository.DoctorReportRepository;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.vo.ReportPeriodType;
import com.medtech.domain.vo.ReportStatus;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Month;
import java.time.Year;
import java.time.format.TextStyle;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DoctorReportService {

    private final DoctorReportRepository reportRepository;
    private final DoctorRepository doctorRepository;

    public Page<DoctorReportResponse> listForDoctor(Long doctorId, Pageable pageable) {
        return reportRepository.findByDoctorIdOrderByPeriodStartDesc(doctorId, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public DoctorReportResponse generate(Long doctorId, GenerateReportRequest req) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> ResourceNotFoundException.of("Doctor", doctorId));

        LocalDate[] range = computeRange(req);
        LocalDate start = range[0];
        LocalDate end   = range[1];

        if (reportRepository.existsByDoctorIdAndPeriodStartAndPeriodEnd(doctorId, start, end)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Report for this period already exists.");
        }

        DoctorReport report = new DoctorReport();
        report.setDoctor(doctor);
        report.setPeriodType(req.periodType());
        report.setPeriodLabel(buildLabel(req));
        report.setPeriodStart(start);
        report.setPeriodEnd(end);
        report.setPatientCount(reportRepository.countDistinctPatients(doctorId, start, end));
        report.setDiagnosisCount(reportRepository.countDiagnoses(doctorId, start, end));
        report.setAppointmentCount(reportRepository.countAppointments(doctorId, start, end));
        report.setPrescriptionCount(reportRepository.countPrescriptions(doctorId, start, end));
        report.setStatus(ReportStatus.DRAFT);

        DoctorReport saved = reportRepository.save(report);
        saved.setReportNumber(buildNumber(req.periodType(), saved.getId(), req.year(), req.periodUnit()));
        return toResponse(reportRepository.save(saved));
    }

    @Transactional
    public DoctorReportResponse submit(Long reportId, Long doctorId) {
        DoctorReport report = getOwned(reportId, doctorId);
        if (report.getStatus() == ReportStatus.SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Report already submitted.");
        }
        report.setStatus(ReportStatus.SUBMITTED);
        report.setSubmittedAt(Instant.now());
        return toResponse(reportRepository.save(report));
    }

    @Transactional
    public void delete(Long reportId, Long doctorId) {
        DoctorReport report = getOwned(reportId, doctorId);
        if (report.getStatus() == ReportStatus.SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete a submitted report.");
        }
        reportRepository.delete(report);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private DoctorReport getOwned(Long reportId, Long doctorId) {
        DoctorReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> ResourceNotFoundException.of("DoctorReport", reportId));
        if (!report.getDoctor().getId().equals(doctorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your report.");
        }
        return report;
    }

    private LocalDate[] computeRange(GenerateReportRequest req) {
        int year = req.year();
        return switch (req.periodType()) {
            case MONTHLY -> {
                int month = req.periodUnit() != null ? req.periodUnit() : 1;
                LocalDate start = LocalDate.of(year, month, 1);
                yield new LocalDate[]{start, start.withDayOfMonth(start.lengthOfMonth())};
            }
            case QUARTERLY -> {
                int q = req.periodUnit() != null ? req.periodUnit() : 1;
                int startMonth = (q - 1) * 3 + 1;
                LocalDate start = LocalDate.of(year, startMonth, 1);
                LocalDate end   = start.plusMonths(3).minusDays(1);
                yield new LocalDate[]{start, end};
            }
            case ANNUAL -> new LocalDate[]{LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31)};
        };
    }

    private String buildLabel(GenerateReportRequest req) {
        return switch (req.periodType()) {
            case MONTHLY -> {
                int month = req.periodUnit() != null ? req.periodUnit() : 1;
                yield Month.of(month).getDisplayName(TextStyle.FULL, new Locale("mk")) + " " + req.year();
            }
            case QUARTERLY -> "Q" + (req.periodUnit() != null ? req.periodUnit() : 1) + " " + req.year();
            case ANNUAL    -> "Годишна " + req.year();
        };
    }

    private String buildNumber(ReportPeriodType type, Long id, int year, Integer unit) {
        String prefix = switch (type) {
            case MONTHLY   -> "M";
            case QUARTERLY -> "Q";
            case ANNUAL    -> "A";
        };
        String suffix = (unit != null) ? String.format("-%02d", unit) : "";
        return "IP-" + year + suffix + "-" + prefix + String.format("%03d", id);
    }

    private DoctorReportResponse toResponse(DoctorReport r) {
        return DoctorReportResponse.builder()
                .id(r.getId())
                .reportNumber(r.getReportNumber())
                .periodType(r.getPeriodType())
                .periodLabel(r.getPeriodLabel())
                .periodStart(r.getPeriodStart())
                .periodEnd(r.getPeriodEnd())
                .patientCount(r.getPatientCount())
                .diagnosisCount(r.getDiagnosisCount())
                .appointmentCount(r.getAppointmentCount())
                .prescriptionCount(r.getPrescriptionCount())
                .status(r.getStatus())
                .submittedAt(r.getSubmittedAt())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
