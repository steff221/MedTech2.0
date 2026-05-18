"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, onFocus, onBlur, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [focused, setFocused] = useState(false);
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "mb-1.5 block text-sm font-medium transition-colors duration-200",
            error
              ? "text-rose-600"
              : focused
                ? "text-brand-600"
                : "text-slate-700",
          )}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className={cn(
          "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
          // Slightly faster than 200ms feels snappier; ring grows with a brief shadow
          "transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-0",
          "focus:shadow-[0_0_0_4px_rgba(6,182,212,0.06)]",
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200/60"
            : "border-slate-300 focus:border-brand-500 focus:ring-brand-200/60",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
          <span className="inline-block h-1 w-1 rounded-full bg-rose-500" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
