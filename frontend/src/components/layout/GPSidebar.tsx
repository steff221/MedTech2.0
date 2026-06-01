"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  Bell,
  Pill,
  Settings,
  Share2,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

export function GPSidebar() {
  const pathname = usePathname();
  const t = useT();

  const nav = [
    { href: "/gp/overview",        label: t.gpNav.overview,       icon: LayoutDashboard },
    { href: "/gp/schedule",        label: t.gpNav.schedule,        icon: CalendarDays    },
    { href: "/gp/patients",        label: t.gpNav.patients,        icon: Users           },
    { href: "/gp/prescriptions",   label: t.gpNav.prescriptions,   icon: Pill            },
    { href: "/gp/referrals",       label: t.gpNav.referrals,       icon: Share2          },
    { href: "/gp/medical-journal", label: t.gpNav.medicalJournal,  icon: BookOpen        },
    { href: "/gp/notifications",   label: t.gpNav.notifications,   icon: Bell            },
    { href: "/gp/settings",        label: t.gpNav.settings,        icon: Settings        },
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <Link
        href="/gp/overview"
        className="flex h-16 items-center gap-2 border-b border-slate-200 px-6"
      >
        <Image src="/Logo-removebg-preview.png" alt="MedTech" width={36} height={36} />
        <div className="flex flex-col">
          <p className="text-base font-semibold leading-tight text-slate-900">MedTech</p>
          <p className="text-[10px] font-medium text-teal-600">{t.gpNav.portal}</p>
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
                active ? "text-teal-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {active && (
                <motion.span
                  layoutId="gp-sidebar-active"
                  className="absolute inset-0 rounded-lg bg-teal-50"
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
