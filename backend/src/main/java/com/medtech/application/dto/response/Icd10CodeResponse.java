package com.medtech.application.dto.response;

import com.medtech.application.service.Icd10CatalogService.Icd10Code;

/** One entry of the WHO ICD-10 (MKB-10) catalog. */
/**
 * Излезен DTO: поединечен МКБ-10 (ICD-10) код со опис.
 */
public record Icd10CodeResponse(
        String code,
        String title,
        int chapter,
        String group,
        String groupTitle,
        boolean terminal
) {
    public static Icd10CodeResponse from(Icd10Code c, String groupTitle) {
        return new Icd10CodeResponse(c.code(), c.title(), c.chapter(), c.group(), groupTitle, c.terminal());
    }
}
