import { describe, expect, it } from "vitest";
import { matchesSearch, normalizeForSearch } from "@/utils/search";
import { escapeHtml } from "@/utils/html";

describe("normalizeForSearch", () => {
  it("transliterates Macedonian Cyrillic to Latin", () => {
    expect(normalizeForSearch("Перовски")).toBe("perovski");
    expect(normalizeForSearch("Зоран")).toBe("zoran");
    expect(normalizeForSearch("Николовски")).toBe("nikolovski");
  });

  it("handles digraphs before single letters", () => {
    expect(normalizeForSearch("Љубен")).toBe("ljuben");
    expect(normalizeForSearch("Њего")).toBe("njego");
    expect(normalizeForSearch("Ѓорѓи")).toBe("gjorgji");
    expect(normalizeForSearch("Шишков")).toBe("shishkov");
  });

  it("strips diacritics so Latin spellings still match", () => {
    // A Latin-script name carrying diacritics reduces to its plain form, so a
    // patient typing without them still finds it.
    expect(normalizeForSearch("Šiškov")).toBe("siskov");
    expect(matchesSearch("Šiškov", "siskov")).toBe(true);
  });

  it("is safe on empty input", () => {
    expect(normalizeForSearch(null)).toBe("");
    expect(normalizeForSearch(undefined)).toBe("");
  });
});

describe("matchesSearch", () => {
  // The reported bug: the doctor list mixes scripts, so a patient typing the
  // name in Cyrillic found nobody while the Latin spelling found the doctor.
  it("finds a Latin-stored name from a Cyrillic query", () => {
    expect(matchesSearch("Zoran Perovski", "Перовски")).toBe(true);
    expect(matchesSearch("Zoran Perovski", "Зоран")).toBe(true);
  });

  it("finds a Cyrillic-stored name from a Latin query", () => {
    expect(matchesSearch("Зоран Николовски", "Nikolovski")).toBe(true);
    expect(matchesSearch("Зоран Николовски", "zoran")).toBe(true);
  });

  it("still matches within the same script", () => {
    expect(matchesSearch("Zoran Perovski", "Perovski")).toBe(true);
    expect(matchesSearch("Зоран Николовски", "Николовски")).toBe(true);
  });

  it("does not match an unrelated name", () => {
    expect(matchesSearch("Zoran Perovski", "Марковска")).toBe(false);
  });

  it("treats an empty query as matching everything", () => {
    expect(matchesSearch("Zoran Perovski", "")).toBe(true);
    expect(matchesSearch("Zoran Perovski", "   ")).toBe(true);
  });
});

// ── HTML escaping ────────────────────────────────────────────────────────────
// The print/export documents interpolate patient names and clinician free text
// into raw HTML, so escaping is the control that stops a stored value from
// executing when a record is printed.
describe("escapeHtml", () => {
  it("neutralises a script payload in a patient name", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
    expect(escapeHtml("<script>alert(1)</script>")).not.toContain("<script>");
  });

  it("escapes quotes so attribute contexts stay closed", () => {
    expect(escapeHtml(`" onmouseover="x`)).toBe("&quot; onmouseover=&quot;x");
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("escapes ampersands first so entities are not double-decoded", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("renders null and undefined as empty, not as text", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("leaves ordinary clinical text unchanged", () => {
    expect(escapeHtml("Акутен инфаркт на миокард")).toBe("Акутен инфаркт на миокард");
  });
});
