"use client";

import { useLanguageStore } from "@/store/language.store";
import { cn } from "@/utils/cn";

interface LanguageToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function LanguageToggle({ className, size = "md" }: LanguageToggleProps) {
  const { lang, setLang } = useLanguageStore();

  return (
    <div
      className={cn(
        "flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5",
        size === "sm" ? "gap-0" : "gap-0",
        className,
      )}
    >
      {(["mk", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            "rounded-md font-semibold uppercase tracking-wide transition-all",
            size === "sm"
              ? "px-2 py-0.5 text-[10px]"
              : "px-2.5 py-1 text-xs",
            lang === l
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-400 hover:text-slate-600",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
