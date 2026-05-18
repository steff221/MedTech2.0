"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PatientSidebar } from "@/components/layout/PatientSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Spinner } from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user?.role === "DOCTOR") router.replace("/doctor");
  }, [isHydrated, isAuthenticated, user, router]);

  if (!isHydrated || !isAuthenticated || user?.role === "DOCTOR") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <PatientSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-slate-50 px-6 py-8 md:px-10">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
