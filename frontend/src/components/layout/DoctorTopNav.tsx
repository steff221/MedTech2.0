"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Calendar,
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
import { type ComponentType } from "react";
import { LanguageToggle } from "@/components/common/LanguageToggle";
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
  { labelKey: "referrals",      href: "/doctor/referrals",          icon: ClipboardList   },
  { labelKey: "schedule",       href: "/doctor/schedule",            icon: Calendar        },
  { labelKey: "patients",       href: "/doctor/patients",            icon: Users           },
  { labelKey: "operations",     href: "/doctor/operations",          icon: Scissors        },
  { labelKey: "medicalJournal", href: "/doctor/medical-journal",     icon: Notebook        },
  { labelKey: "reports",        href: "/doctor/individual-reports",  icon: FileSpreadsheet },
  { labelKey: "mkb10",          href: "/doctor/mkb10",               icon: ShieldPlus      },
  { labelKey: "guidelines",     href: "/doctor/guidelines",          icon: FileText        },
  { labelKey: "settings",       href: "/doctor/settings",            icon: Wrench          },
  { labelKey: "covid",          href: "/doctor/patients?tag=covid",  icon: Shield          },
];

export function DoctorTopNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: doctor } = useDoctorProfile();
  const t = useT();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
      {/* Brand bar */}
      <div className="flex h-12 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6">
        <Link href="/doctor" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-white">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-bold text-slate-900">MedTech</span>
          <span className="text-xs font-medium text-slate-400">· {t.doctorNav.portal}</span>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageToggle size="sm" />

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
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <LogOut className="h-3.5 w-3.5" /> {t.common.signOut}
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
