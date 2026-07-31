// React компонента: печат — официјален број на записот како втиснат печат.
"use client";

import { cn } from "@/utils/cn";

interface SealProps {
  /**
   * The record's own identifier — a referral number (УП-2026-007), a report
   * number (IP-2026-07-M001), a licence, an MKB-10-coded document reference.
   * This is real data; do not pass decorative text.
   */
  children: React.ReactNode;
  /** Field name above the mark, e.g. "Упат" / "Извештај". */
  label?: string;
  /** Animate the stamp settling onto the page. Use once per surface. */
  animate?: boolean;
  className?: string;
}

/**
 * The design system's signature element.
 *
 * Every clinical artifact in this system is issued with a number, and those
 * numbers are how staff actually refer to a record out loud. The seal gives
 * that number the weight it has on paper. It is deliberately the only
 * ornamented thing on a record surface — everything around it stays quiet.
 */
export function Seal({ children, label, animate = false, className }: SealProps) {
  return (
    <span className={cn("inline-flex flex-col items-start gap-1", className)}>
      {label && <span className="eyebrow">{label}</span>}
      <span
        className={cn("seal", animate && "animate-stamp-in")}
        // The number is the content; the stamp framing is presentation.
        title={typeof children === "string" ? children : undefined}
      >
        {children}
      </span>
    </span>
  );
}

/**
 * A controlled-vocabulary code — MKB-10 diagnosis codes and similar. Monospace
 * because the taxonomy is genuinely alphanumeric and column alignment carries
 * meaning when several are listed.
 */
export function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("code", className)}>{children}</span>;
}
