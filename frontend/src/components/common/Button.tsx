// React компонента: копче (button) за повеќекратна употреба.
"use client";

import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

/**
 * The push button.
 *
 * A thick bottom border stands in for the side of a physical key: hover grows
 * it to 6px and lifts the face 1px, active shrinks it to 2px and presses the
 * face 2px down, so the travel reads as the key going in and springing back.
 * The border colour has to stay a step darker than the face, otherwise the
 * edge reads as a stray outline rather than as the side of the key.
 *
 * Framer Motion is deliberately gone from this component: `whileHover` /
 * `whileTap` write a transform onto the same element the CSS `active:` state
 * translates, and the two fight over the press.
 */
const PUSH =
  "border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px] " +
  "active:border-b-[2px] active:brightness-90 active:translate-y-[2px]";

const variantStyles: Record<Variant, string> = {
  primary:   "bg-blue-500 text-white border-blue-600 " + PUSH,
  secondary: "bg-white text-slate-700 border-slate-300 " + PUSH,
  danger:    "bg-rose-500 text-white border-rose-600 " + PUSH,
  // Ghost stays flat — there is no key face to press.
  ghost:     "bg-transparent text-slate-700 border-transparent hover:bg-slate-100 hover:text-slate-900",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-1.5 text-xs font-medium gap-1.5 rounded-lg",
  md: "px-6 py-2 text-sm font-medium gap-2 rounded-lg",
  lg: "px-8 py-2.5 text-base font-medium gap-2 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, fullWidth, disabled, className, children, ...props },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        "relative inline-flex cursor-pointer items-center justify-center",
        "border-solid transition-all",
        // A disabled key cannot be pressed, so it keeps a flat edge.
        "disabled:cursor-not-allowed disabled:opacity-50",
        "disabled:hover:translate-y-0 disabled:hover:border-b-[4px] disabled:hover:brightness-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin opacity-70" />
          <span className="opacity-70">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});
