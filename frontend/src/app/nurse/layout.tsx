"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Spinner } from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { useEventStream } from "@/hooks/useEventStream";
import { Activity, LogOut, Users } from "lucide-react";

export default function NurseLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user, logout } = useAuth();
  useEventStream();

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user?.role === "DOCTOR") router.replace("/doctor");
    if (user?.role === "PATIENT") router.replace("/dashboard");
  }, [isHydrated, isAuthenticated, user, router]);

  if (!isHydrated || !isAuthenticated || user?.role !== "NURSE") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Topbar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-600" />
          <span className="font-bold text-slate-800">MedTech</span>
          <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
            Медицинска сестра
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            {user.firstName} {user.lastName}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut className="h-4 w-4" />
            Одјава
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="border-b border-slate-200 bg-white px-6">
        <div className="flex gap-6">
          <a
            href="/nurse"
            className="flex items-center gap-1.5 border-b-2 border-emerald-500 py-3 text-sm font-semibold text-emerald-600"
          >
            <Users className="h-4 w-4" />
            Пациенти
          </a>
        </div>
      </nav>

      <main className="flex-1 px-6 py-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
