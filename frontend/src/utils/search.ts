// Помошни функции: пребарување независно од писмо (кирилица/латиница).

/**
 * Macedonian Cyrillic → Latin, for search matching only.
 *
 * Digraphs first: `љ` must become `lj` before the single-letter pass, and the
 * multi-character results (`zh`, `sh`, `gj`) are what a person typing the name
 * in Latin would actually write.
 */
const CYRILLIC_TO_LATIN: Array<[RegExp, string]> = [
  [/љ/g, "lj"], [/њ/g, "nj"], [/џ/g, "dj"], [/ѓ/g, "gj"], [/ќ/g, "kj"],
  [/ж/g, "zh"], [/ч/g, "ch"], [/ш/g, "sh"], [/ѕ/g, "dz"],
  [/а/g, "a"], [/б/g, "b"], [/в/g, "v"], [/г/g, "g"], [/д/g, "d"],
  [/е/g, "e"], [/з/g, "z"], [/и/g, "i"], [/ј/g, "j"], [/к/g, "k"],
  [/л/g, "l"], [/м/g, "m"], [/н/g, "n"], [/о/g, "o"], [/п/g, "p"],
  [/р/g, "r"], [/с/g, "s"], [/т/g, "t"], [/у/g, "u"], [/ф/g, "f"],
  [/х/g, "h"], [/ц/g, "c"],
];

/**
 * Reduces text to a script-independent form for substring matching.
 *
 * The doctor list mixes scripts — most names are Cyrillic, some are Latin — and
 * the interface is Macedonian, so a patient will type Cyrillic. Matching raw
 * strings meant "Перовски" found nobody while "Perovski" found two people, and
 * the patient concluded the doctor was not in the system.
 *
 * Both sides of the comparison are normalised, so either script finds either
 * spelling. Diacritics are stripped too: "Ѓорѓи" typed as "Gjorgji" or
 * "Gorgi" should still land.
 */
export function normalizeForSearch(input: string | null | undefined): string {
  if (!input) return "";
  let s = input.toLowerCase();
  for (const [pattern, replacement] of CYRILLIC_TO_LATIN) {
    s = s.replace(pattern, replacement);
  }
  // Decompose and drop combining marks (š → s, ć → c) so Latin transliterations
  // that carry diacritics still match the plain form.
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * True when `haystack` contains `query`, ignoring script, case and diacritics.
 * An empty query matches everything, so callers can pass the raw input.
 */
export function matchesSearch(haystack: string, query: string): boolean {
  const q = normalizeForSearch(query).trim();
  if (!q) return true;
  return normalizeForSearch(haystack).includes(q);
}
