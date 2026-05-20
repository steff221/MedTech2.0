import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Lang } from "@/i18n/translations";

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: "mk",
      setLang: (lang) => set({ lang }),
      toggle: () => set({ lang: get().lang === "mk" ? "en" : "mk" }),
    }),
    {
      name: "medtech-lang",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
