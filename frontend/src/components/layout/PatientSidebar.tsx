"use client";

import { motion } from "framer-motion";
import { Activity, Calendar, FileText, LayoutDashboard, Pill, Stethoscope, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";

const nav = [
  { href: "/dashboard",      label: "Dashboard",      icon: LayoutDashboard },
  { href: "/appointments",   label: "Appointments",   icon: Calendar },
  { href: "/health-records", label: "Health records", icon: FileText },
  { href: "/prescriptions",  label: "Prescriptions",  icon: Pill },
  { href: "/doctors",        label: "Find a doctor",  icon: Stethoscope },
  { href: "/profile",        label: "Profile",        icon: User },
];

export function PatientSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <Link href="/dashboard" className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
          <Activity className="h-4 w-4" />
        </div>
        <span className="text-lg font-semibold text-slate-900">MedTech</span>
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
                active ? "text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-brand-50"
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
