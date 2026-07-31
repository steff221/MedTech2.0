// React hook: пристап до преводите (i18n) во компонентите.
"use client";

import { translations } from "@/i18n/translations";

/** Returns the translation dictionary (Macedonian only). */
export function useT() {
  return translations.mk;
}
