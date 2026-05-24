package com.medtech.application.service;

import com.medtech.application.dto.request.CreatePatientRequest;
import com.medtech.application.dto.request.UpdatePatientRequest;
import com.medtech.domain.entity.Patient;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.PatientRepository;
import com.medtech.domain.repository.UserRepository;
import com.medtech.domain.vo.UserRole;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import com.medtech.infrastructure.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Patient profile lifecycle. The {@link User} authentication row is created by
 * {@link AuthService}; this service then attaches the demographic / health
 * profile linked 1:1 to that user.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Transactional
    public Patient createForUser(Long userId, CreatePatientRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));

        if (user.getRole() != UserRole.PATIENT) {
            throw new ValidationException("User " + userId + " is not a PATIENT");
        }
        if (patientRepository.existsByUserId(userId)) {
            throw new ConflictException("Patient profile already exists for user " + userId);
        }

        Patient patient = new Patient();
        patient.setUser(user);
        patient.setDateOfBirth(req.dateOfBirth());
        patient.setGender(req.gender());
        patient.setBloodType(req.bloodType() == null ? null : req.bloodType().dbValue());
        patient.setAllergies(req.allergies());
        patient.setChronicConditions(req.chronicConditions());
        patient.setInsuranceProvider(req.insuranceProvider());
        patient.setInsuranceNumber(req.insuranceNumber());
        patient.setEmergencyContact(req.emergencyContact());
        patient.setEmergencyPhone(req.emergencyPhone());
        patient.setAddress(req.address());
        patient.setCity(req.city());
        patient.setPostalCode(req.postalCode());
        patient.setCountry(req.country());

        Patient saved = patientRepository.save(patient);
        log.info("Created patient profile id={} for user={}", saved.getId(), userId);
        return saved;
    }

    public Patient getById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Patient", id));
    }

    public Page<Patient> search(String q, Long hospitalId, Pageable pageable) {
        String term = q == null ? "" : q.trim();
        if (hospitalId != null) {
            return patientRepository.searchByNameOrEmailAtHospital(term, hospitalId, pageable);
        }
        return patientRepository.searchByNameOrEmail(term, pageable);
    }

    public Patient getByUserId(Long userId) {
        return patientRepository.findByUserId(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Patient (by userId)", userId));
    }

    @Transactional
    public Patient update(Long id, UpdatePatientRequest req) {
        Patient patient = getById(id);
        if (req.dateOfBirth() != null)      patient.setDateOfBirth(req.dateOfBirth());
        if (req.gender() != null)           patient.setGender(req.gender());
        if (req.bloodType() != null)        patient.setBloodType(req.bloodType().dbValue());
        if (req.allergies() != null)        patient.setAllergies(req.allergies());
        if (req.chronicConditions() != null) patient.setChronicConditions(req.chronicConditions());
        if (req.insuranceProvider() != null) patient.setInsuranceProvider(req.insuranceProvider());
        if (req.insuranceNumber() != null)   patient.setInsuranceNumber(req.insuranceNumber());
        if (req.emergencyContact() != null)  patient.setEmergencyContact(req.emergencyContact());
        if (req.emergencyPhone() != null)    patient.setEmergencyPhone(req.emergencyPhone());
        if (req.address() != null)           patient.setAddress(req.address());
        if (req.city() != null)              patient.setCity(req.city());
        if (req.postalCode() != null)        patient.setPostalCode(req.postalCode());
        if (req.country() != null)           patient.setCountry(req.country());
        return patient;
    }
}
