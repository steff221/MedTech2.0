package com.medtech.application.service;

import com.medtech.application.service.Icd10CatalogService.Icd10Code;
import com.medtech.infrastructure.exception.ValidationException;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit тестови за Icd10CatalogService (пребарување на МКБ-10 каталог).
 */
class Icd10CatalogServiceTest {

    static Icd10CatalogService catalog;

    @BeforeAll
    static void load() {
        catalog = new Icd10CatalogService();
    }

    @Test
    @DisplayName("loads the complete WHO ICD-10 2019 release")
    void loadsFullCatalog() {
        assertThat(catalog.chapters()).hasSize(22);
        int total = catalog.chapters().stream().mapToInt(c -> c.codeCount()).sum();
        assertThat(total).isEqualTo(12_221);
    }

    @Test
    @DisplayName("search by exact code ranks the code first")
    void searchByExactCode() {
        List<Icd10Code> hits = catalog.search("I10", 10);
        assertThat(hits).isNotEmpty();
        assertThat(hits.get(0).code()).isEqualTo("I10");
        assertThat(hits.get(0).title()).containsIgnoringCase("hypertension");
    }

    @Test
    @DisplayName("search by code prefix returns the whole block")
    void searchByCodePrefix() {
        List<Icd10Code> hits = catalog.search("E11", 20);
        assertThat(hits).extracting(Icd10Code::code)
                .contains("E11", "E11.0", "E11.9");
    }

    @Test
    @DisplayName("search by title text is case-insensitive")
    void searchByTitle() {
        List<Icd10Code> hits = catalog.search("cholera", 10);
        assertThat(hits).extracting(Icd10Code::code).contains("A00");
    }

    @Test
    @DisplayName("search respects the limit and caps it at 100")
    void searchRespectsLimit() {
        assertThat(catalog.search("disease", 5)).hasSize(5);
        assertThat(catalog.search("", 5000)).hasSize(100);
    }

    @Test
    @DisplayName("chapter listing returns codes in code order")
    void chapterCodes() {
        List<Icd10Code> ch9 = catalog.codesByChapter(9);
        assertThat(ch9).isNotEmpty();
        assertThat(ch9).extracting(Icd10Code::code).contains("I10");
        assertThat(ch9).isSortedAccordingTo((a, b) -> a.code().compareTo(b.code()));
    }

    @Test
    @DisplayName("requireValidCode accepts known, blank and null codes")
    void validCodes() {
        assertThatCode(() -> catalog.requireValidCode("K35.8")).doesNotThrowAnyException();
        assertThatCode(() -> catalog.requireValidCode(null)).doesNotThrowAnyException();
        assertThatCode(() -> catalog.requireValidCode("  ")).doesNotThrowAnyException();
        // lower case is normalised
        assertThatCode(() -> catalog.requireValidCode("i10")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("requireValidCode rejects codes outside the WHO catalog")
    void invalidCode() {
        // The message must NOT echo the submitted value (reflected-input hygiene).
        assertThatThrownBy(() -> catalog.requireValidCode("Z99.99X"))
                .isInstanceOf(ValidationException.class)
                .hasMessageNotContaining("Z99.99X");
    }
}
