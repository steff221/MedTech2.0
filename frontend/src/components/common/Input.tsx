// React компонента: поле за внес (input).
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
            "mb-1.5 block text-xs font-medium transition-colors duration-150",
            error
              ? "text-rose-600"
              : focused
                ? "text-brand-600"
                : "text-slate-600",
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
          // Fill, radius, padding, ink and the drop shadow all come from the
          // global input rule in globals.css so that raw <input> elements in
          // page markup match this component exactly. Only width and the error
          // state are set here — anything else would silently diverge from the
          // fields that don't use this component.
          "w-full",
          error && "outline outline-2 outline-rose-500",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
          <span aria-hidden>✳</span>
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
