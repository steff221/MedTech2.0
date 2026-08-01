package com.medtech.application.service;

import com.medtech.domain.vo.ReferralType;
import com.medtech.domain.vo.UserRole;
import org.springframework.stereotype.Service;

/**
 * Го определува конкретниот ФЗОМ образец за упатот.
 *
 * <p>Two of the four referral families come in a pair, and which half applies
 * is decided by <em>who is issuing</em>, not by what the doctor is asking for:
 *
 * <pre>
 *   матичен лекар (GP)  + лабораторија → ЛУ-1      + радиодијагностика → РДУ-1
 *   специјалист         + лабораторија → ЛУ-2      + радиодијагностика → РДУ-2
 * </pre>
 *
 * <p>This is the single place that rule lives. The doctor is never asked which
 * form to use — they say where the patient is going, this resolves the code,
 * and the UI shows it back as confirmation. If the Fund's rule turns out to be
 * different, correcting it is a change to {@link #resolve} and nothing else.
 *
 * <p>The result is persisted on the referral rather than recomputed on read: a
 * doctor's role can change, and a document already printed and handed to a
 * patient must not silently become a different form.
 */
@Service
public class FzomFormResolver {

    /**
     * @param type       what the doctor selected
     * @param issuerRole role of the doctor issuing the referral
     * @return the ФЗОМ form code, e.g. {@code СУ}, {@code ЛУ-1}, {@code РДУ-2}
     */
    public String resolve(ReferralType type, UserRole issuerRole) {
        if (!type.variantByIssuer()) {
            return type.fzomBaseCode();
        }
        return type.fzomBaseCode() + "-" + variantFor(issuerRole);
    }

    /**
     * Explains the resolution in Macedonian, so the dialog can say <em>why</em>
     * a code was chosen instead of presenting it as a bare fact.
     */
    public String explain(ReferralType type, UserRole issuerRole) {
        if (!type.variantByIssuer()) {
            return "Образец " + type.fzomBaseCode() + " — " + type.displayMk().toLowerCase() + ".";
        }
        String who = issuerRole == UserRole.GENERAL_PRACTITIONER ? "матичен лекар" : "специјалист";
        return "Образец " + resolve(type, issuerRole) + " — се издава од " + who + ".";
    }

    /**
     * A general practitioner issues the "-1" form; every other clinician issues
     * the "-2". Nurses and admins cannot issue referrals at all (enforced by
     * {@code Roles.CLINICIAN} on the controller), so they never reach here.
     */
    private int variantFor(UserRole issuerRole) {
        return issuerRole == UserRole.GENERAL_PRACTITIONER ? 1 : 2;
    }
}
