package com.medtech.application.service;

import com.medtech.application.dto.request.CompleteReferralRequest;
import com.medtech.application.dto.request.CreateReferralRequest;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.entity.Referral;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.PatientRepository;
import com.medtech.domain.repository.ReferralRepository;
import com.medtech.domain.vo.ReferralField;
import com.medtech.domain.vo.ReferralStatus;
import com.medtech.domain.vo.ReferralType;
import com.medtech.domain.vo.UserStatus;
import com.medtech.infrastructure.exception.AuthorizationException;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
 
/**
 * Сервис: бизнис-логика за упатите помеѓу доктори/специјалисти.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReferralService {

    private final ReferralRepository referralRepository;
    private final DoctorRepository   doctorRepository;
    private final PatientRepository  patientRepository;
    private final Icd10CatalogService icd10Catalog;
    private final FzomFormResolver   fzomFormResolver;

    @Transactional
    public Referral create(Long doctorUserId, CreateReferralRequest req) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new AuthorizationException("Само корисници со улога ЛЕКАР можат да издаваат упати"));
        if (doctor.getStatus() != UserStatus.ACTIVE) {
            throw new AuthorizationException("Лекарската сметка не е активна");
        }
        Patient patient = patientRepository.findById(req.patientId())
                .orElseThrow(() -> ResourceNotFoundException.of("Пациент", req.patientId()));

        Referral referral = new Referral();
        referral.setDoctor(doctor);
        referral.setPatient(patient);
        referral.setReferralType(req.referralType());
        referral.setReferredTo(req.referredTo());
        icd10Catalog.requireValidCode(req.mkb10Code());
        referral.setMkb10Code(req.mkb10Code());
        referral.setDescription(req.description());
        assertFormFieldsPresent(req);
        referral.setReferredSpecialty(req.referredSpecialty());
        referral.setServiceDetail(req.serviceDetail());
        referral.setFormSubtype(req.formSubtype());
        referral.setScheduledDate(req.scheduledDate());
        referral.setWardUnit(req.wardUnit());
        referral.setMedicalJournalNo(req.medicalJournalNo());
        referral.setStatus(ReferralStatus.ACTIVE);
        referral.setCreatedBy(doctor.getUser().getEmail());
        referral.setReferralNumber(buildNumber(referralRepository.nextReferralSeq()));

        // Resolved once, from the role of whoever is issuing, then frozen on the
        // row. See FzomFormResolver for why this is not derived at read time.
        referral.setFzomFormCode(
                fzomFormResolver.resolve(req.referralType(), doctor.getUser().getRole()));

        Referral saved = referralRepository.save(referral);
        log.info("Issued referral {} for patient={} by doctor={}", saved.getReferralNumber(),
                patient.getId(), doctor.getId());
        return saved;
    }

    

    @Transactional
    public Referral complete(Long referralId, Long doctorUserId, CompleteReferralRequest req) {
        Referral referral = getById(referralId);
        assertIssuingDoctor(referral, doctorUserId);
        if (referral.getStatus() != ReferralStatus.ACTIVE) {
            throw new ConflictException("Упатот не е АКТИВЕН");
        }
        referral.setStatus(ReferralStatus.COMPLETED);
        referral.setOutcomeNote(req.outcomeNote());
        referral.setOutcomeDate(req.outcomeDate());
        log.info("Completed referral {}", referral.getReferralNumber());
        return referral;
    }

    @Transactional
    public Referral cancel(Long referralId, Long doctorUserId, String reason) {
        Referral referral = getById(referralId);
        assertIssuingDoctor(referral, doctorUserId);
        if (referral.getStatus() == ReferralStatus.CANCELLED) {
            return referral;
        }
        if (referral.getStatus() == ReferralStatus.COMPLETED) {
            throw new ConflictException("Не може да се откаже завршен упат");
        }
        // A referral is a numbered document that may already be in a patient's
        // hands. Voiding one without saying why leaves no answer to "what
        // happened to УП-2026-007?", so the reason is mandatory.
        if (reason == null || reason.isBlank()) {
            throw new ConflictException("Задолжителна е причина за откажување на упатот");
        }
        referral.setStatus(ReferralStatus.CANCELLED);
        referral.setCancellationReason(reason.trim());
        referral.setCancelledAt(java.time.Instant.now());
        referral.setCancelledBy(referral.getDoctor().getUser().getEmail());
        // The number is deliberately not released: it stays reserved so the
        // sequence can never hand it to a second document.
        log.info("Cancelled referral {} reason={}", referral.getReferralNumber(), reason.trim());
        return referral;
    }

    /**
     * Records that the document was printed. Only the first print is stamped —
     * later reprints of the same referral do not move the timestamp, because
     * the question it answers is "did paper ever leave this room".
     */
    @Transactional
    public Referral markPrinted(Long referralId, Long doctorUserId) {
        Referral referral = getById(referralId);
        assertIssuingDoctor(referral, doctorUserId);
        if (referral.getStatus() == ReferralStatus.CANCELLED) {
            throw new ConflictException("Откажан упат не може да се печати");
        }
        if (referral.getPrintedAt() == null) {
            referral.setPrintedAt(java.time.Instant.now());
        }
        return referral;
    }

    public Referral getById(Long id) {
        return referralRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Упат", id));
    }

    public Page<Referral> listByDoctor(Long doctorUserId, ReferralStatus status, Pageable pageable) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new AuthorizationException("Лекарскиот профил не е пронајден"));
        if (status != null) {
            return referralRepository.findByDoctorIdAndStatus(doctor.getId(), status, pageable);
        }
        return referralRepository.findByDoctorId(doctor.getId(), pageable);
    }

    public Page<Referral> listByPatient(Long patientId, Pageable pageable) {
        patientRepository.findById(patientId)
                .orElseThrow(() -> ResourceNotFoundException.of("Пациент", patientId));
        return referralRepository.findByPatientId(patientId, pageable);
    }

    private void assertIssuingDoctor(Referral referral, Long doctorUserId) {
        if (!referral.getDoctor().getUser().getId().equals(doctorUserId)) {
            throw new AuthorizationException("Само лекарот што го издал упатот може да го измени");
        }
    }

    /**
     * A form is only valid if the boxes that form actually has are filled.
     * The list comes from {@link ReferralType#requiredFields()} rather than
     * being restated here, so validation, the dialog and the printed layout
     * all read one declaration and cannot drift apart.
     */
    private void assertFormFieldsPresent(CreateReferralRequest req) {
        for (ReferralField field : req.referralType().requiredFields()) {
            String value = switch (field) {
                case INSTITUTION  -> req.referredTo();
                case SPECIALTY    -> req.referredSpecialty();
                case SERVICE_KIND, APPARATUS -> req.serviceDetail();
                case WARD_UNIT    -> req.wardUnit();
            };
            if (value == null || value.isBlank()) {
                throw new ConflictException(
                        "Образецот " + req.referralType().fzomBaseCode()
                        + " бара пополнето поле: " + labelFor(field));
            }
        }
    }

    private String labelFor(ReferralField field) {
        return switch (field) {
            case INSTITUTION  -> "Здравствена установа";
            case SPECIALTY    -> "Специјалност";
            case SERVICE_KIND -> "Вид на здравствена услуга";
            case APPARATUS    -> "Назив на апарат";
            case WARD_UNIT    -> "Работна единица — Одделение";
        };
    }

    private String buildNumber(long seq) {
        return "UP-" + Year.now().getValue() + "-" + String.format("%03d", seq);
    }
}
