"use client";

import { motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  LayoutDashboard,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";

const nav = [
  { href: "/doctor/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/doctor/patients", label: "Patients", icon: Users },
  { href: "/doctor/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/doctor/settings", label: "Settings", icon: Settings },
];

export function DoctorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <Link
        href="/doctor/schedule"
        className="flex h-16 items-center gap-2 border-b border-slate-200 px-6"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Doctor</p>
          <p className="-mt-0.5 text-base font-semibold text-slate-900">MedTech</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "text-emerald-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {active && (
                <motion.span
                  layoutId="doctor-sidebar-active"
                  className="absolute inset-0 rounded-lg bg-emerald-50"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <item.icon className="relative h-4 w-4" />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Stethoscope className="h-3.5 w-3.5" />
          Clinician portal
        </div>
      </div>
    </aside>
  );
}
