package com.medtech.application.service;

import com.medtech.application.dto.request.CompleteReferralRequest;
import com.medtech.application.dto.request.CreateReferralRequest;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.entity.Referral;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.PatientRepository;
import com.medtech.domain.repository.ReferralRepository;
import com.medtech.domain.vo.ReferralStatus;
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
 
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReferralService {

    private final ReferralRepository referralRepository;
    private final DoctorRepository   doctorRepository;
    private final PatientRepository  patientRepository;

    @Transactional
    public Referral create(Long doctorUserId, CreateReferralRequest req) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new AuthorizationException("Only DOCTOR users can issue referrals"));
        if (doctor.getStatus() != UserStatus.ACTIVE) {
            throw new AuthorizationException("Doctor account is not active");
        }
        Patient patient = patientRepository.findById(req.patientId())
                .orElseThrow(() -> ResourceNotFoundException.of("Patient", req.patientId()));

        Referral referral = new Referral();
        referral.setDoctor(doctor);
        referral.setPatient(patient);
        referral.setReferralType(req.referralType());
        referral.setReferredTo(req.referredTo());
        referral.setMkb10Code(req.mkb10Code());
        referral.setDescription(req.description());
        referral.setScheduledDate(req.scheduledDate());
        referral.setStatus(ReferralStatus.ACTIVE);
        referral.setCreatedBy(doctor.getUser().getEmail());
        referral.setReferralNumber(buildNumber(referralRepository.nextReferralSeq()));

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
            throw new ConflictException("Referral is not ACTIVE");
        }
        referral.setStatus(ReferralStatus.COMPLETED);
        referral.setOutcomeNote(req.outcomeNote());
        referral.setOutcomeDate(req.outcomeDate());
        log.info("Completed referral {}", referral.getReferralNumber());
        return referral;
    }

    @Transactional
    public Referral cancel(Long referralId, Long doctorUserId) {
        Referral referral = getById(referralId);
        assertIssuingDoctor(referral, doctorUserId);
        if (referral.getStatus() == ReferralStatus.CANCELLED) {
            return referral;
        }
        if (referral.getStatus() == ReferralStatus.COMPLETED) {
            throw new ConflictException("Cannot cancel a completed referral");
        }
        referral.setStatus(ReferralStatus.CANCELLED);
        log.info("Cancelled referral {}", referral.getReferralNumber());
        return referral;
    }

    public Referral getById(Long id) {
        return referralRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Referral", id));
    }

    public Page<Referral> listByDoctor(Long doctorUserId, ReferralStatus status, Pageable pageable) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new AuthorizationException("Doctor profile not found"));
        if (status != null) {
            return referralRepository.findByDoctorIdAndStatus(doctor.getId(), status, pageable);
        }
        return referralRepository.findByDoctorId(doctor.getId(), pageable);
    }

    public Page<Referral> listByPatient(Long patientId, Pageable pageable) {
        patientRepository.findById(patientId)
                .orElseThrow(() -> ResourceNotFoundException.of("Patient", patientId));
        return referralRepository.findByPatientId(patientId, pageable);
    }

    private void assertIssuingDoctor(Referral referral, Long doctorUserId) {
        if (!referral.getDoctor().getUser().getId().equals(doctorUserId)) {
            throw new AuthorizationException("Only the issuing doctor may modify this referral");
        }
    }

    private String buildNumber(long seq) {
        return "UP-" + Year.now().getValue() + "-" + String.format("%03d", seq);
    }
}
