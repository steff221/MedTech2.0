package com.medtech.application.dto.response;

import java.util.List;

/** ICD-10 chapter summary (e.g. chapter IX "Diseases of the circulatory system"). */
public record Icd10ChapterResponse(
        int number,
        String title,
        int codeCount,
        List<Icd10GroupResponse> groups
) {
    /** ICD-10 block within a chapter (e.g. "I10-I15 Hypertensive diseases"). */
    public record Icd10GroupResponse(String range, String title) {}
}
