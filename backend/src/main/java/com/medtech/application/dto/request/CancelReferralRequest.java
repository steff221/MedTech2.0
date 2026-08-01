package com.medtech.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Влезен DTO: причина за откажување упат.
 *
 * <p>A referral is a numbered document that may already be in the patient's
 * hands, so voiding one requires a stated reason — the number stays reserved
 * and the row stays visible, and without a reason nobody can later answer what
 * happened to it.
 */
public record CancelReferralRequest(
        @NotBlank(message = "Задолжителна е причина за откажување")
        @Size(max = 500) String reason
) {}
