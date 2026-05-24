"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Shield, LogOut } from "lucide-react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Spinner } from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user, logout } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
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
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
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
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
