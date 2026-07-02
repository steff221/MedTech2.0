// React hook: пристап до преводите (i18n) во компонентите.
"use client";

import { useLanguageStore } from "@/store/language.store";
import { translations } from "@/i18n/translations";

/** Returns the full translation dictionary for the current language. */
export function useT() {
  const lang = useLanguageStore((s) => s.lang);
  return translations[lang];
}
