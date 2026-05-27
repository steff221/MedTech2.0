"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MobilePatientNav } from "@/components/layout/MobilePatientNav";
import { PatientSidebar } from "@/components/layout/PatientSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Spinner } from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { useEventStream } from "@/hooks/useEventStream";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuth();
  useEventStream();

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user?.role === "DOCTOR") router.replace("/doctor");
    if (user?.role === "NURSE") router.replace("/nurse");
    if (user?.role === "ADMIN") router.replace("/admin");
  }, [isHydrated, isAuthenticated, user, router]);

  if (!isHydrated || !isAuthenticated || user?.role === "DOCTOR" || user?.role === "NURSE" || user?.role === "ADMIN") {
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
        <main className="flex-1 overflow-y-auto bg-slate-50 px-6 py-8 pb-20 md:px-10 lg:pb-8">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
      <MobilePatientNav />
    </div>
  );
}
