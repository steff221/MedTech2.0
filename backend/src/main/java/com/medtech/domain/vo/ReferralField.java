package com.medtech.domain.vo;

/**
 * Полиња што ги бара образецот, освен заедничките.
 *
 * <p>Every ФЗОМ referral form carries the same core — patient, МКБ-10 code,
 * issuing institution, date and signature. These are the boxes that differ per
 * form, declared on {@link ReferralType} so that validation, the dialog and the
 * printed layout all read the same list and cannot drift apart.
 */
public enum ReferralField {

    /** Здравствена установа to which the patient is referred. All forms. */
    INSTITUTION,

    /** Специјалност — СУ and БУ. */
    SPECIALTY,

    /** Вид на здравствена услуга — лабораториска анализа (ЛУ). */
    SERVICE_KIND,

    /** Назив на апарат / „За снимање на:" (РДУ). */
    APPARATUS,

    /** Работна единица — Одделение (БУ). */
    WARD_UNIT
}
