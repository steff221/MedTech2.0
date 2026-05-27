"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ClipboardList, LayoutDashboard, LogOut, Shield, Users } from "lucide-react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Spinner } from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { href: "/admin/dashboard",      label: "Преглед",       icon: LayoutDashboard },
  { href: "/admin/users",          label: "Корисници",     icon: Users },
  { href: "/admin/audit-logs",     label: "Ревизија",      icon: ClipboardList },
  { href: "/admin/anomaly-alerts", label: "Аномалии",      icon: AlertTriangle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, user, logout } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user?.role !== "ADMIN") router.replace("/");
  }, [isHydrated, isAuthenticated, user, router]);

  if (!isHydrated || !isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-600" />
            <span className="font-bold text-slate-800">MedTech</span>
            <span className="ml-1 rounded bg-violet-100 px-1.5 py-0.5 text-xs font-semibold text-violet-700">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user.firstName} {user.lastName}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4" />
              Одјава
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-6">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-violet-600 text-violet-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
