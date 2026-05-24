package com.medtech.application.service;

import com.medtech.application.dto.request.InviteStaffRequest;
import com.medtech.application.dto.response.UserResponse;
import com.medtech.constant.ErrorCode;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.PasswordResetToken;
import com.medtech.domain.entity.User;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.domain.repository.HospitalRepository;
import com.medtech.domain.repository.PasswordResetTokenRepository;
import com.medtech.domain.repository.UserRepository;
import com.medtech.domain.vo.UserRole;
import com.medtech.domain.vo.UserStatus;
import com.medtech.infrastructure.exception.AppException;
import com.medtech.infrastructure.exception.ConflictException;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${medtech.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public Page<UserResponse> listUsers(Pageable pageable) {
        return userRepository.findAllByRoleIn(
                List.of(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN),
                pageable
        ).map(UserResponse::from);
    }

    @Transactional
    public UserResponse inviteStaff(InviteStaffRequest req) {
        if (req.role() == UserRole.PATIENT) {
            throw new AppException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Cannot invite PATIENT accounts via admin panel") {};
        }
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new ConflictException(ErrorCode.AUTH_EMAIL_TAKEN, "Email already registered");
        }
        if (req.role() == UserRole.DOCTOR) {
            if (req.hospitalId() == null || req.licenseNumber() == null || req.specialization() == null) {
                throw new AppException(ErrorCode.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                        "hospitalId, licenseNumber and specialization are required for DOCTOR invites") {};
            }
        }

        // Create user with a random locked password — they'll set their own via the invite link
        User user = new User();
        user.setEmail(req.email().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(randomPassword()));
        user.setFirstName(req.firstName());
        user.setLastName(req.lastName());
        user.setPhoneNumber(req.phoneNumber());
        user.setRole(req.role());
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedBy("ADMIN_INVITE");
        user = userRepository.save(user);

        // Auto-create Doctor profile if role is DOCTOR
        if (req.role() == UserRole.DOCTOR) {
            var hospital = hospitalRepository.findById(req.hospitalId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Hospital", req.hospitalId()));
            Doctor doctor = new Doctor();
            doctor.setUser(user);
            doctor.setHospital(hospital);
            doctor.setLicenseNumber(req.licenseNumber());
            doctor.setSpecialization(req.specialization());
            doctor.setStatus(UserStatus.ACTIVE);
            doctorRepository.save(doctor);
        }

        // Issue a 48-hour password reset token as the "set your password" link
        String plainToken = generateToken();
        PasswordResetToken prt = new PasswordResetToken();
        prt.setUser(user);
        prt.setTokenHash(hashToken(plainToken));
        prt.setExpiresAt(Instant.now().plus(Duration.ofHours(48)));
        passwordResetTokenRepository.save(prt);

        String setupLink = frontendUrl + "/reset-password?token=" + plainToken;
        String roleLabel = req.role() == UserRole.DOCTOR ? "Доктор" : "Медицинска сестра";
        emailService.sendInviteEmail(user.getEmail(), user.fullName(), roleLabel, setupLink);

        log.info("Admin invited user id={} email={} role={}", user.getId(), user.getEmail(), user.getRole());
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse setStatus(Long userId, UserStatus newStatus) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));
        if (user.getRole() == UserRole.ADMIN) {
            throw new AppException(ErrorCode.AUTH_FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Cannot suspend another admin account") {};
        }
        user.setStatus(newStatus);
        userRepository.save(user);
        log.info("Admin set user id={} status={}", userId, newStatus);
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse resendInvite(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", userId));

        passwordResetTokenRepository.invalidateAllForUser(user.getId(), Instant.now());

        String plainToken = generateToken();
        PasswordResetToken prt = new PasswordResetToken();
        prt.setUser(user);
        prt.setTokenHash(hashToken(plainToken));
        prt.setExpiresAt(Instant.now().plus(Duration.ofHours(48)));
        passwordResetTokenRepository.save(prt);

        String setupLink = frontendUrl + "/reset-password?token=" + plainToken;
        String roleLabel = user.getRole() == UserRole.DOCTOR ? "Доктор" : "Медицинска сестра";
        emailService.sendInviteEmail(user.getEmail(), user.fullName(), roleLabel, setupLink);

        log.info("Admin resent invite to user id={}", userId);
        return UserResponse.from(user);
    }

    private static String generateToken() {
        byte[] raw = new byte[32];
        SECURE_RANDOM.nextBytes(raw);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
    }

    private static String randomPassword() {
        byte[] raw = new byte[32];
        SECURE_RANDOM.nextBytes(raw);
        return Base64.getEncoder().encodeToString(raw);
    }

    private static String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
