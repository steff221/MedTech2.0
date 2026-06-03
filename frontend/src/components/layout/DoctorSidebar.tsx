"use client";

import { motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Microscope,
  Pill,
  Settings,
  Share2,
  Stethoscope,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

const groups: Array<Array<{ href: string; labelKey: string; icon: React.ElementType; color: string }>> = [
  [
    { href: "/doctor/schedule",          labelKey: "schedule",      icon: CalendarDays,   color: "text-emerald-600" },
    { href: "/doctor/patients",          labelKey: "patients",      icon: Users,           color: "text-violet-500"  },
    { href: "/doctor/prescriptions",     labelKey: "prescriptions", icon: Pill,            color: "text-sky-500"     },
    { href: "/doctor/referrals",         labelKey: "referrals",     icon: Share2,          color: "text-amber-500"   },
    { href: "/doctor/operations",        labelKey: "operations",    icon: Stethoscope,     color: "text-rose-500"    },
  ],
  [
    { href: "/doctor/medical-journal",   labelKey: "medicalJournal",icon: BookOpen,        color: "text-teal-500"    },
    { href: "/doctor/individual-reports",labelKey: "reports",       icon: ClipboardList,   color: "text-indigo-500"  },
    { href: "/doctor/mkb10",             labelKey: "mkb10",         icon: Microscope,      color: "text-pink-500"    },
    { href: "/doctor/guidelines",        labelKey: "guidelines",    icon: FileText,        color: "text-orange-500"  },
  ],
  [
    { href: "/doctor/availability",      labelKey: "availability",  icon: CalendarDays,   color: "text-cyan-500"    },
    { href: "/doctor/notifications",     labelKey: "notifications", icon: Bell,            color: "text-amber-500"   },
    { href: "/doctor/overview",          labelKey: "overview",      icon: LayoutDashboard, color: "text-brand-500"   },
    { href: "/doctor/settings",          labelKey: "settings",      icon: Settings,        color: "text-slate-500"   },
  ],
];

export function DoctorSidebar() {
  const pathname = usePathname();
  const t = useT();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/95 backdrop-blur-sm lg:flex lg:flex-col">
      {/* Logo */}
      <Link
        href="/doctor/schedule"
        className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-5 transition-opacity hover:opacity-80"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 shadow-glow-brand-sm">
          <Image src="/Logo-removebg-preview.png" alt="MedTech" width={22} height={22} className="brightness-0 invert" />
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-bold leading-tight text-slate-900">MedTech</p>
          <p className="text-[10px] font-semibold tracking-wide text-brand-600">{t.doctorNav.portal}</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {groups.map((group, gi) => (
          <div key={gi} className={cn(gi > 0 && "mt-1 border-t border-slate-100 pt-1")}>
            {group.map(({ href, labelKey, icon: Icon, color }) => {
              const active = pathname?.startsWith(href);
              const label = t.doctorNav[labelKey as keyof typeof t.doctorNav] as string;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    active
                      ? "text-emerald-800"
                      : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="doctor-sidebar-active"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/60 shadow-sm ring-1 ring-emerald-200/60"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      "relative h-4 w-4 shrink-0 transition-colors",
                      active ? color : "text-slate-400 group-hover:text-slate-500",
                    )}
                  />
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
