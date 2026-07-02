package com.medtech.presentation.controller;

import com.medtech.application.dto.response.Icd10ChapterResponse;
import com.medtech.application.dto.response.Icd10CodeResponse;
import com.medtech.application.service.Icd10CatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashSet;
import java.util.List;


/**
 * REST контролер: endpoints за пребарување на МКБ-10 (ICD-10) каталогот.
 */
@RestController
@RequestMapping("/api/icd10")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "ICD-10 catalog", description = "WHO ICD-10 2019 (MKB-10) diagnosis code catalog")
public class Icd10Controller {


        private final Icd10CatalogService catalog;
    @GetMapping("/search")
    @Operation(summary = "Search diagnosis codes by code prefix or title text")
    public ResponseEntity<List<Icd10CodeResponse>> search(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(catalog.search(q, limit).stream()
                .map(c -> Icd10CodeResponse.from(c, catalog.groupTitle(c.group())))
                .toList());
    }

    @GetMapping("/chapters")
    @Operation(summary = "List the 22 ICD-10 chapters with their blocks")
    public ResponseEntity<List<Icd10ChapterResponse>> chapters() {
        return ResponseEntity.ok(catalog.chapters().stream()
                .map(ch -> new Icd10ChapterResponse(ch.number(), ch.title(), ch.codeCount(),
                        chapterGroups(ch.number())))
                .toList());
    }

    @GetMapping("/chapters/{number}/codes")
    @Operation(summary = "All codes of one chapter, in code order")
    public ResponseEntity<List<Icd10CodeResponse>> chapterCodes(@PathVariable int number) {
        return ResponseEntity.ok(catalog.codesByChapter(number).stream()
                .map(c -> Icd10CodeResponse.from(c, catalog.groupTitle(c.group())))
                .toList());
    }

    private List<Icd10ChapterResponse.Icd10GroupResponse> chapterGroups(int chapterNumber) {
        // Preserve catalog order; LinkedHashSet dedupes ranges shared by many codes.
        LinkedHashSet<String> ranges = new LinkedHashSet<>();
        catalog.codesByChapter(chapterNumber).forEach(c -> ranges.add(c.group()));
        return ranges.stream()
                .map(r -> new Icd10ChapterResponse.Icd10GroupResponse(r, catalog.groupTitle(r)))
                .toList();
    }
}
