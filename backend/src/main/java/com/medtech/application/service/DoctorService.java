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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.medtech.infrastructure.config.CacheConfig.DOCTOR_BY_ID;
import static com.medtech.infrastructure.config.CacheConfig.DOCTORS_LIST;

/**
 * Сервис: бизнис-логика за докторите — креирање, ажурирање и пребарување.
 */
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
                .orElseThrow(() -> ResourceNotFoundException.of("Корисник", userId));
        if (user.getRole() != UserRole.DOCTOR) {
            throw new ValidationException("Корисникот " + userId + " не е ЛЕКАР");
        }
        doctorRepository.findByUserId(userId).ifPresent(d -> {
            throw new ConflictException("Лекарски профил веќе постои за корисникот " + userId);
        });
        doctorRepository.findByLicenseNumber(req.licenseNumber()).ifPresent(d -> {
            throw new ConflictException("Бројот на лиценца е веќе регистриран: " + req.licenseNumber());
        });

        Hospital hospital = hospitalRepository.findById(req.hospitalId())
                .orElseThrow(() -> ResourceNotFoundException.of("Болница", req.hospitalId()));

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

    @Cacheable(value = DOCTOR_BY_ID, key = "#id")
    public Doctor getById(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Лекар", id));
    }

    public Doctor getByUserId(Long userId) {
        return doctorRepository.findByUserId(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Лекар (по userId)", userId));
    }

    @Cacheable(value = DOCTORS_LIST, key = "{#specialization, #hospitalId, #city, #pageable.pageNumber, #pageable.pageSize}")
    public Page<Doctor> search(String specialization, Long hospitalId, String city, Pageable pageable) {
        return doctorRepository.search(specialization, hospitalId, city, UserStatus.ACTIVE, pageable);
    }

    @Transactional
    @CacheEvict(value = {DOCTORS_LIST, DOCTOR_BY_ID}, allEntries = true)
    public Doctor updateForUser(Long userId, UpdateDoctorRequest req) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Лекар (по userId)", userId));

        if (req.qualification()     != null) doctor.setQualification(req.qualification());
        if (req.experienceYears()   != null) doctor.setExperienceYears(req.experienceYears());
        if (req.officeNumber()      != null) doctor.setOfficeNumber(req.officeNumber());
        if (req.facsimileNumber()   != null) doctor.setFacsimileNumber(req.facsimileNumber());
        if (req.consultationFee()   != null) doctor.setConsultationFee(req.consultationFee());
        if (req.availabilityHours() != null) doctor.setAvailabilityHours(req.availabilityHours());
        if (req.bio()               != null) doctor.setBio(req.bio());

        return doctorRepository.save(doctor);
    }
}
