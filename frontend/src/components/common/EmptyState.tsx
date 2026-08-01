// React компонента: приказ кога нема податоци (празна состојба).
"use client";

import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?:        LucideIcon;
  title:        string;
  description?: string;
  action?:      ReactNode;
}

/**
 * An empty section of a record is a blank field, not an event. The previous
 * version floated a gradient-filled icon inside two infinitely pulsing rings —
 * three simultaneous animations to report that nothing had happened yet. It now
 * reads as an unfilled part of the form: hairline border, the icon in drape
 * ink, and whatever action would fill it.
 */
export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-8 py-12 text-center">
      <Icon className="mb-4 h-6 w-6 text-slate-400" aria-hidden />

      <h3 className="text-base font-semibold text-slate-800">{title}</h3>

      {description && (
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
