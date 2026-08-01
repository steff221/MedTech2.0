// Помошни функции: безбедно вметнување текст во HTML.

/**
 * Escapes a value for interpolation into an HTML string.
 *
 * The print/export features build documents as HTML strings and hand them to
 * `document.write` in a new window. Every value in those documents is
 * attacker-influenced: patient names come from self-registration, and
 * diagnoses, dosages and notes are free text typed by clinicians. Interpolated
 * raw, a name such as `<img src=x onerror=…>` executes on the application's own
 * origin the moment anyone prints the record.
 *
 * Escaping the five HTML-significant characters is sufficient here because
 * every interpolation lands in element content or a double-quoted attribute —
 * there is no unquoted-attribute or inline-script context in these documents.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Short alias — these documents interpolate heavily. */
export const esc = escapeHtml;
