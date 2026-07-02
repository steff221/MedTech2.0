// React компонента: горна навигација за докторот.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  Bell,
  Calendar,
  Clock,
  ClipboardList,
  FileText,
  LogOut,
  Menu,
  Notebook,
  Scissors,
  ShieldPlus,
  Stethoscope,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType, useState } from "react";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import { initials } from "@/utils/format";

type NavItem = {
  labelKey: keyof ReturnType<typeof useT>["doctorNav"];
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { labelKey: "referrals",      href: "/doctor/referrals",       icon: ClipboardList   },
  { labelKey: "schedule",       href: "/doctor/schedule",        icon: Calendar        },
  { labelKey: "patients",       href: "/doctor/patients",        icon: Users           },
  { labelKey: "operations",     href: "/doctor/operations",      icon: Scissors        },
  { labelKey: "medicalJournal", href: "/doctor/medical-journal", icon: Notebook        },
  { labelKey: "mkb10",          href: "/doctor/mkb10",           icon: ShieldPlus      },
  { labelKey: "guidelines",     href: "/doctor/guidelines",      icon: FileText        },
  { labelKey: "settings",       href: "/doctor/settings",        icon: Wrench          },
  { labelKey: "notifications",  href: "/doctor/notifications",   icon: Bell            },
  { labelKey: "availability",   href: "/doctor/availability",    icon: Clock           },
];

export function DoctorTopNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: doctor } = useDoctorProfile();
  const t = useT();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        {/* Brand bar */}
        <div className="flex h-12 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 sm:px-6">
          <Link href="/doctor" className="flex items-center gap-2">
            <Image src="/Logo-removebg-preview.png" alt="MedTech" width={32} height={32} />
            <span className="text-sm font-bold text-slate-900">MedTech</span>
            <span className="text-xs font-medium text-slate-400">· {t.doctorNav.portal}</span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageToggle size="sm" />
            <NotificationBell />

            {user && (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-700">
                    {initials(user.firstName, user.lastName)}
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-slate-800">
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
                  className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:flex"
                >
                  <LogOut className="h-3.5 w-3.5" /> {t.common.signOut}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Main nav — desktop only */}
        <nav className="hidden items-center gap-1 overflow-x-auto px-4 lg:flex">
          <Link
            href="/doctor"
            className={cn(
              "flex h-12 items-center px-3 text-sm font-medium transition-colors",
              pathname === "/doctor" ? "text-emerald-700" : "text-slate-600 hover:text-slate-900",
            )}
            aria-label={t.doctorNav.home}
          >
            <Stethoscope className="h-4 w-4" />
          </Link>
          {NAV.map((item) => (
            <NavEntry key={item.labelKey} item={item} pathname={pathname ?? ""} label={t.doctorNav[item.labelKey]} />
          ))}
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 bg-black/30 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 right-0 z-30 w-72 overflow-y-auto bg-white shadow-2xl lg:hidden"
            >
              <div className="flex h-14 items-center justify-between border-b border-slate-100 px-5">
                <span className="text-sm font-semibold text-slate-800">{t.doctorNav.portal}</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-3 py-4">
                <Link
                  href="/doctor"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === "/doctor"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <Stethoscope className="h-4 w-4" />
                  {t.doctorNav.home}
                </Link>
                {NAV.map((item) => {
                  const isActive = pathname?.startsWith(item.href.split("?")[0]);
                  return (
                    <Link
                      key={item.labelKey}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "mt-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {t.doctorNav[item.labelKey]}
                    </Link>
                  );
                })}
              </div>

              {user && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700">
                      {initials(user.firstName, user.lastName)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Dr. {user.firstName} {user.lastName}</p>
                      {doctor && <p className="text-xs text-slate-500">{doctor.specialization}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  >
                    <LogOut className="h-4 w-4" /> {t.common.signOut}
                  </button>
                </div>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NavEntry({ item, pathname, label }: { item: NavItem; pathname: string; label: string }) {
  const isActive = pathname.startsWith(item.href.split("?")[0]);

  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex h-12 items-center whitespace-nowrap px-3 text-sm font-medium transition-colors",
        isActive ? "text-emerald-700" : "text-slate-600 hover:text-slate-900",
      )}
    >
      {isActive && (
        <motion.span
          layoutId="doctor-nav-active"
          className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-emerald-500"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      {label}
    </Link>
  );
}
