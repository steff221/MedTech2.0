"use client";

import { motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  LayoutDashboard,
  Pill,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

export function DoctorSidebar() {
  const pathname = usePathname();
  const t = useT();

  const nav = [
    { href: "/doctor/schedule",      label: t.doctorNav.schedule,      icon: CalendarDays },
    { href: "/doctor/patients",      label: t.doctorNav.patients,      icon: Users },
    { href: "/doctor/prescriptions", label: t.doctorNav.prescriptions, icon: Pill },
    { href: "/doctor/overview",      label: t.doctorNav.overview,      icon: LayoutDashboard },
    { href: "/doctor/settings",      label: t.doctorNav.settings,      icon: Settings },
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <Link
        href="/doctor/schedule"
        className="flex h-16 items-center gap-2 border-b border-slate-200 px-6"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
          <Activity className="h-4 w-4" />
        </div>
        <p className="text-base font-semibold text-slate-900">MedTech</p>
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
    </aside>
  );
}
