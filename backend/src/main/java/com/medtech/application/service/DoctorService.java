package com.medtech.application.service;

import com.medtech.application.dto.request.CreateDoctorRequest;
import com.medtech.application.dto.request.UpdateDoctorRequest;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.Hospital;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.HospitalRepository;
import com.medtech.domain.repository.UserRepository;
import com.medtech.domain.vo.UserRole;
import com.medtech.domain.vo.UserStatus;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import com.medtech.infrastructure.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    @Transactional
    public Doctor createForUser(Long userId, CreateDoctorRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));
        if (user.getRole() != UserRole.DOCTOR) {
            throw new ValidationException("User " + userId + " is not a DOCTOR");
        }
        doctorRepository.findByUserId(userId).ifPresent(d -> {
            throw new ConflictException("Doctor profile already exists for user " + userId);
        });
        doctorRepository.findByLicenseNumber(req.licenseNumber()).ifPresent(d -> {
            throw new ConflictException("Licence number already registered: " + req.licenseNumber());
        });

        Hospital hospital = hospitalRepository.findById(req.hospitalId())
                .orElseThrow(() -> ResourceNotFoundException.of("Hospital", req.hospitalId()));

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setHospital(hospital);
        doctor.setLicenseNumber(req.licenseNumber());
        doctor.setSpecialization(req.specialization());
        doctor.setSubSpecialization(req.subSpecialization());
        doctor.setQualification(req.qualification());
        doctor.setExperienceYears(req.experienceYears());
        doctor.setOfficeNumber(req.officeNumber());
        doctor.setConsultationFee(req.consultationFee());
        doctor.setAvailabilityHours(req.availabilityHours());
        doctor.setBio(req.bio());
        doctor.setStatus(UserStatus.ACTIVE);

        Doctor saved = doctorRepository.save(doctor);
        log.info("Created doctor profile id={} (licence={}) for user={}",
                saved.getId(), saved.getLicenseNumber(), userId);
        return saved;
    }

    public Doctor getById(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Doctor", id));
    }

    public Doctor getByUserId(Long userId) {
        return doctorRepository.findByUserId(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Doctor (by userId)", userId));
    }

    public Page<Doctor> search(String specialization, Long hospitalId, String city, Pageable pageable) {
        return doctorRepository.search(specialization, hospitalId, city, UserStatus.ACTIVE, pageable);
    }

    @Transactional
    public Doctor updateForUser(Long userId, UpdateDoctorRequest req) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Doctor (by userId)", userId));

        if (req.qualification()     != null) doctor.setQualification(req.qualification());
        if (req.experienceYears()   != null) doctor.setExperienceYears(req.experienceYears());
        if (req.officeNumber()      != null) doctor.setOfficeNumber(req.officeNumber());
        if (req.consultationFee()   != null) doctor.setConsultationFee(req.consultationFee());
        if (req.availabilityHours() != null) doctor.setAvailabilityHours(req.availabilityHours());
        if (req.bio()               != null) doctor.setBio(req.bio());

        return doctorRepository.save(doctor);
    }
}
