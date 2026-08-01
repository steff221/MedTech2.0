// React компонента: група филтер-копчиња (една избрана вредност).
"use client";

import { Check } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/utils/cn";

export interface FilterOption<T extends string> {
  value:  T;
  label:  string;
  /** Optional tally shown after the label, e.g. how many rows match. */
  count?: number;
}

interface FilterChipsProps<T extends string> {
  /** Visible group heading. Also names the group for assistive tech. */
  label:     string;
  options:   ReadonlyArray<FilterOption<T>>;
  value:     T;
  onChange:  (value: T) => void;
  size?:     "sm" | "md";
  /**
   * Hide the heading visually while keeping it for assistive tech. For groups
   * that sit inline in a toolbar where a printed heading would break the row —
   * the group still has to be named, it just isn't drawn.
   */
  hideLabel?: boolean;
  className?: string;
}

/**
 * A single-select filter group.
 *
 * These were previously loose <button> elements: five plain buttons announced
 * with no indication that they form one choice, no statement of which is
 * active, and no keyboard path between them. Only the colour said "selected",
 * which is also the one signal a colour-blind user is least likely to catch.
 *
 * It is now a real radiogroup — `aria-checked` states the selection, a check
 * mark states it a second time without relying on colour, arrow keys move
 * through the options, and a roving tabindex keeps the whole group to a single
 * tab stop instead of one per option.
 */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
  size = "sm",
  hideLabel = false,
  className,
}: FilterChipsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const last = options.length - 1;
    let next: number | null = null;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;

    if (next === null) return;
    // In a radiogroup the arrow keys move *and* select, so the filtered view
    // follows the focus rather than waiting for a second keypress.
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div className={className}>
      <p
        id={`${label}-label`}
        className={cn(
          hideLabel
            ? "sr-only"
            : "mb-1.5 block text-sm font-medium text-slate-700",
        )}
      >
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={`${label}-label`} className="flex flex-wrap gap-1.5">
        {options.map((opt, i) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={selected}
              // Roving tabindex: the group is one tab stop, arrows do the rest.
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1",
                size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs",
                selected
                  ? "border-brand-600 bg-brand-500 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-slate-50",
              )}
            >
              {/* Redundant with the fill, deliberately: selection should not
                  rest on colour alone. */}
              {selected && <Check className="h-3 w-3 shrink-0" aria-hidden />}
              {opt.label}
              {opt.count !== undefined && (
                <span className={cn("tabular-nums", selected ? "text-white/70" : "text-slate-400")}>
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
