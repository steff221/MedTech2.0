package com.medtech.application.service;

import com.medtech.application.dto.request.AvailabilitySlotRequest;
import com.medtech.application.dto.response.AvailabilitySlotResponse;
import com.medtech.constant.ErrorCode;
import com.medtech.domain.entity.Doctor;
import com.medtech.domain.entity.DoctorAvailability;
import com.medtech.domain.repository.DoctorAvailabilityRepository;
import com.medtech.domain.repository.DoctorRepository;
import com.medtech.infrastructure.exception.ResourceNotFoundException;
import com.medtech.infrastructure.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Сервис: управување со слободните термини (достапноста) на докторите.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DoctorAvailabilityService {

    private final DoctorAvailabilityRepository availabilityRepo;
    private final DoctorRepository doctorRepo;

    public List<AvailabilitySlotResponse> getForDoctor(Long doctorId) {
        return availabilityRepo.findByDoctorId(doctorId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<AvailabilitySlotResponse> save(Long doctorId, List<AvailabilitySlotRequest> slots) {
        Doctor doctor = doctorRepo.findById(doctorId)
                .orElseThrow(() -> ResourceNotFoundException.of("Doctor", doctorId));

        for (AvailabilitySlotRequest slot : slots) {
            if (slot.active() && (slot.startTime() == null || slot.endTime() == null)) {
                throw new ValidationException(ErrorCode.VALIDATION_FAILED,
                        "Start and end time are required for active day " + slot.dayOfWeek());
            }
            if (slot.active() && !slot.endTime().isAfter(slot.startTime())) {
                throw new ValidationException(ErrorCode.VALIDATION_FAILED,
                        "End time must be after start time for day " + slot.dayOfWeek());
            }
        }

        availabilityRepo.deleteByDoctorId(doctorId);

        List<DoctorAvailability> entities = slots.stream().map(slot -> {
            DoctorAvailability da = new DoctorAvailability();
            da.setDoctor(doctor);
            da.setDayOfWeek(slot.dayOfWeek());
            da.setActive(slot.active());
            if (slot.active()) {
                da.setStartTime(slot.startTime());
                da.setEndTime(slot.endTime());
            } else {
                da.setStartTime(slot.startTime() != null ? slot.startTime() : java.time.LocalTime.of(8, 0));
                da.setEndTime(slot.endTime() != null ? slot.endTime() : java.time.LocalTime.of(16, 0));
            }
            return da;
        }).toList();

        return availabilityRepo.saveAll(entities).stream().map(this::toResponse).toList();
    }

    private AvailabilitySlotResponse toResponse(DoctorAvailability da) {
        return new AvailabilitySlotResponse(da.getDayOfWeek(), da.getStartTime(), da.getEndTime(), da.isActive());
    }
}
