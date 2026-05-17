"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Calendar,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  LogOut,
  Notebook,
  Scissors,
  Shield,
  ShieldPlus,
  Stethoscope,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { cn } from "@/utils/cn";
import { initials } from "@/utils/format";

type NavItem = {
  label: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  children?: { label: string; href: string; description?: string }[];
};

const NAV: NavItem[] = [
  {
    label: "Упати",
    icon: ClipboardList,
    children: [
      { label: "Издадени упати", href: "/doctor/referrals", description: "Историја на издадени" },
      { label: "Нов упат", href: "/doctor/referrals?new=1", description: "Создади нов упат" },
    ],
  },
  {
    label: "Календар",
    icon: Calendar,
    children: [
      { label: "Распоред", href: "/doctor/schedule", description: "Неделен преглед" },
      { label: "Прием на пациенти", href: "/doctor/patients?tab=TODAY", description: "Денешни приеми" },
    ],
  },
  { label: "Пациенти", href: "/doctor/patients", icon: Users },
  { label: "Операции", href: "/doctor/operations", icon: Scissors },
  { label: "Медицински дневник", href: "/doctor/medical-journal", icon: Notebook },
  {
    label: "Индивидуални пријави",
    icon: FileSpreadsheet,
    children: [
      { label: "Месечни пријави", href: "/doctor/medical-journal?view=monthly" },
      { label: "Извештаи", href: "/doctor/medical-journal?view=reports" },
    ],
  },
  { label: "МКБ10 Дијагноза", href: "/doctor/mkb10", icon: ShieldPlus },
  {
    label: "Упатства",
    icon: FileText,
    children: [
      { label: "Клинички упатства", href: "/doctor/mkb10" },
      { label: "Документи", href: "/doctor/referrals" },
    ],
  },
  { label: "Дополнителна дејност", href: "/doctor/settings", icon: Wrench },
  { label: "COVID19 пациенти", href: "/doctor/patients?tag=covid", icon: Shield },
];

export function DoctorTopNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: doctor } = useDoctorProfile();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
      {/* Brand bar */}
      <div className="flex h-12 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6">
        <Link href="/doctor" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-white">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-bold text-slate-900">MedTech</span>
          <span className="text-xs font-medium text-slate-400">· Clinician portal</span>
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700">
                  {initials(user.firstName, user.lastName)}
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">
                    Dr. {user.firstName} {user.lastName}
                  </p>
                  {doctor && (
                    <p className="-mt-0.5 text-[10px] text-slate-500">{doctor.specialization}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <LogOut className="h-3.5 w-3.5" /> Одјава
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex items-center gap-1 overflow-x-auto px-4">
        <Link
          href="/doctor"
          className={cn(
            "flex h-12 items-center px-3 text-sm font-medium transition-colors",
            pathname === "/doctor"
              ? "text-emerald-700"
              : "text-slate-600 hover:text-slate-900",
          )}
          aria-label="Почетна"
        >
          <Stethoscope className="h-4 w-4" />
        </Link>
        {NAV.map((item) => (
          <NavEntry key={item.label} item={item} pathname={pathname ?? ""} />
        ))}
      </nav>
    </header>
  );
}

function NavEntry({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isActive = item.href
    ? pathname.startsWith(item.href.split("?")[0])
    : item.children?.some((c) => pathname.startsWith(c.href.split("?")[0])) ?? false;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const labelClasses = cn(
    "relative flex h-12 items-center gap-1.5 whitespace-nowrap px-3 text-sm font-medium transition-colors",
    isActive ? "text-emerald-700" : "text-slate-600 hover:text-slate-900",
  );

  const indicator = isActive && (
    <motion.span
      layoutId="doctor-nav-active"
      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-emerald-500"
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    />
  );

  if (item.children) {
    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={labelClasses}
          aria-expanded={open}
        >
          {indicator}
          {item.label}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-40 mt-1 min-w-[240px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
            >
              {item.children.map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm transition-colors hover:bg-emerald-50"
                >
                  <p className="font-medium text-slate-900">{c.label}</p>
                  {c.description && (
                    <p className="text-xs text-slate-500">{c.description}</p>
                  )}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link href={item.href!} className={labelClasses}>
      {indicator}
      {item.label}
    </Link>
  );
}
