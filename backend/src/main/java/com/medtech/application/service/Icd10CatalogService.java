package com.medtech.application.service;

import com.medtech.infrastructure.exception.ValidationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * In-memory catalog of the complete WHO ICD-10 (2019 release, with COVID-19
 * updates) — 12 221 codes, 263 blocks, 22 chapters. Loaded once at startup
 * from classpath TSV resources generated from the official WHO distribution
 * (https://icdcdn.who.int/icd10/index.html).
 *
 * <p>Reference data is read-only and versioned by release year, so it lives
 * on the classpath instead of the database: no migration weight, no joins
 * needed (clinical entities store the code as a plain string), and search is
 * a sub-millisecond in-memory scan.
 */
@Slf4j
@Service
public class Icd10CatalogService {

    public record Icd10Code(String code, String title, int chapter, String group, boolean terminal) {}
    public record Icd10Chapter(int number, String title, int codeCount) {}
    public record Icd10Group(String range, String title, int chapter) {}

    private final List<Icd10Code> codes;
    private final Map<String, Icd10Code> byCode;
    private final List<Icd10Chapter> chapters;
    private final List<Icd10Group> groups;
    private final Map<String, String> groupTitles;

    public Icd10CatalogService() {
        this.codes = readTsv("icd10/icd10_2019_codes.tsv", parts -> new Icd10Code(
                parts[0], parts[1], Integer.parseInt(parts[2]), parts[3], "1".equals(parts[4])));
        this.byCode = codes.stream().collect(Collectors.toUnmodifiableMap(Icd10Code::code, Function.identity()));

        Map<Integer, Long> countsPerChapter = codes.stream()
                .collect(Collectors.groupingBy(Icd10Code::chapter, Collectors.counting()));
        this.chapters = readTsv("icd10/icd10_2019_chapters.tsv", parts -> {
            int no = Integer.parseInt(parts[0]);
            return new Icd10Chapter(no, parts[1], countsPerChapter.getOrDefault(no, 0L).intValue());
        });
        this.groups = readTsv("icd10/icd10_2019_groups.tsv",
                parts -> new Icd10Group(parts[0], parts[1], Integer.parseInt(parts[2])));
        Map<String, String> titles = new HashMap<>();
        groups.forEach(g -> titles.put(g.range(), g.title()));
        this.groupTitles = Map.copyOf(titles);

        log.info("Loaded WHO ICD-10 2019 catalog: {} codes, {} groups, {} chapters",
                codes.size(), groups.size(), chapters.size());
    }

    private static <T> List<T> readTsv(String resource, Function<String[], T> mapper) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource(resource).getInputStream(), StandardCharsets.UTF_8))) {
            List<T> out = new ArrayList<>();
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.isBlank()) {
                    out.add(mapper.apply(line.split("\t", -1)));
                }
            }
            return List.copyOf(out);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to load ICD-10 resource " + resource, e);
        }
    }

    /**
     * Searches by code prefix or title substring (case-insensitive).
     * Ranking: exact code, then code prefix, then title match — each tier in
     * natural code order.
     */
    public List<Icd10Code> search(String query, int limit) {
        int max = Math.min(Math.max(limit, 1), 100);
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        if (q.isEmpty()) {
            return codes.subList(0, max);
        }
        String qUpper = q.toUpperCase(Locale.ROOT);

        List<Icd10Code> exact = new ArrayList<>(1);
        List<Icd10Code> codePrefix = new ArrayList<>();
        List<Icd10Code> titleMatch = new ArrayList<>();
        for (Icd10Code c : codes) {
            if (c.code().equals(qUpper)) {
                exact.add(c);
            } else if (c.code().startsWith(qUpper)) {
                if (codePrefix.size() < max) codePrefix.add(c);
            } else if (c.title().toLowerCase(Locale.ROOT).contains(q)) {
                if (titleMatch.size() < max) titleMatch.add(c);
            }
            if (exact.size() + codePrefix.size() >= max && titleMatch.size() >= max) break;
        }
        List<Icd10Code> out = new ArrayList<>(exact);
        out.addAll(codePrefix);
        out.addAll(titleMatch);
        return out.size() > max ? out.subList(0, max) : out;
    }

    public List<Icd10Chapter> chapters() {
        return chapters;
    }

    public List<Icd10Code> codesByChapter(int chapterNumber) {
        return codes.stream()
                .filter(c -> c.chapter() == chapterNumber)
                .sorted(Comparator.comparing(Icd10Code::code))
                .toList();
    }

    public String groupTitle(String range) {
        return groupTitles.getOrDefault(range, range);
    }

    public boolean exists(String code) {
        return code != null && byCode.containsKey(code.trim().toUpperCase(Locale.ROOT));
    }

    /**
     * Validates a user-submitted diagnosis code against the WHO catalog.
     * Blank/null is allowed (diagnosis is optional on most clinical forms);
     * a non-blank code must exist in the 2019 release.
     */
    public void requireValidCode(String code) {
        if (code == null || code.isBlank()) {
            return;
        }
        if (!exists(code)) {
            // Do not echo the submitted value back — error messages must not
            // reflect raw user input (it ends up verbatim in API responses).
            throw new ValidationException("MKB10_CODE_UNKNOWN",
                    "The submitted MKB-10 / ICD-10 code is not in the WHO 2019 release");
        }
    }
}
