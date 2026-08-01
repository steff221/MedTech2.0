package com.medtech.domain.vo;

import java.util.Set;

/**
 * Енумерација: тип на упат.
 *
 * <p>These are <em>clinical intents</em> — where the doctor is sending the
 * patient — not ФЗОМ form codes. The concrete form (Образец СУ, ЛУ-1, ЛУ-2,
 * РДУ-1, РДУ-2, БУ) is derived by {@code FzomFormResolver}, because for the
 * laboratory and radiology referrals the correct form depends on whether the
 * issuing doctor is a GP or a specialist. A doctor should choose where the
 * patient is going; the Fund's numbering is our problem, not theirs.
 *
 * @see com.medtech.application.service.FzomFormResolver
 */
public enum ReferralType {

    /** Образец СУ — специјалистички/супспецијалистички преглед. */
    SPECIALIST_EXAM("СУ", "Специјалистички преглед", false,
            Set.of(ReferralField.SPECIALTY, ReferralField.INSTITUTION)),

    /** Образец ЛУ-1 (матичен лекар) или ЛУ-2 (специјалист). */
    LABORATORY("ЛУ", "Лабораторија", true,
            Set.of(ReferralField.INSTITUTION, ReferralField.SERVICE_KIND)),

    /** Образец РДУ-1 (матичен лекар) или РДУ-2 (специјалист). */
    RADIOLOGY("РДУ", "Радиодијагностика", true,
            Set.of(ReferralField.INSTITUTION, ReferralField.APPARATUS)),

    /** Образец БУ — болнички упат. */
    HOSPITAL("БУ", "Болница", false,
            Set.of(ReferralField.INSTITUTION, ReferralField.SPECIALTY, ReferralField.WARD_UNIT));

    /**
     * Form family as printed by the Fund. For the variant types this is a
     * prefix that the resolver completes with "-1" or "-2".
     */
    private final String fzomBaseCode;

    /** Label shown to the doctor. Macedonian Cyrillic, as everywhere else. */
    private final String displayMk;

    /** Whether the concrete form depends on the issuing doctor's role. */
    private final boolean variantByIssuer;

    /** Fields this form cannot be issued without, beyond the common ones. */
    private final Set<ReferralField> requiredFields;

    ReferralType(String fzomBaseCode, String displayMk, boolean variantByIssuer,
                 Set<ReferralField> requiredFields) {
        this.fzomBaseCode    = fzomBaseCode;
        this.displayMk       = displayMk;
        this.variantByIssuer = variantByIssuer;
        this.requiredFields  = requiredFields;
    }

    public String fzomBaseCode()               { return fzomBaseCode; }
    public String displayMk()                  { return displayMk; }
    public boolean variantByIssuer()           { return variantByIssuer; }
    public Set<ReferralField> requiredFields() { return requiredFields; }
}
