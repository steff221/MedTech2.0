package com.medtech.application.service;

import com.medtech.domain.repository.PrescriptionRepository;
import com.medtech.domain.vo.PrescriptionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Runs daily at 00:05 and moves ACTIVE prescriptions whose end_date has passed
 * to COMPLETED status so they no longer appear as refillable in the patient portal.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PrescriptionExpiryJob {

    private final PrescriptionRepository prescriptionRepository;

    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void expireOverduePrescriptions() {
        try {
            int count = prescriptionRepository.expireByEndDate(
                    PrescriptionStatus.ACTIVE, PrescriptionStatus.COMPLETED, LocalDate.now());
            if (count > 0) {
                log.info("PrescriptionExpiryJob: expired {} prescription(s)", count);
            }
        } catch (Exception ex) {
            log.error("PrescriptionExpiryJob failed — prescriptions may not have been expired: {}", ex.getMessage(), ex);
        }
    }
}
