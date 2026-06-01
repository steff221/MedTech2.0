"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GPTopNav } from "@/components/layout/GPTopNav";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Spinner } from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { useEventStream } from "@/hooks/useEventStream";

export default function GPLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuth();
  useEventStream();

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "GENERAL_PRACTITIONER") {
      if (user.role === "PATIENT") router.replace("/dashboard");
      else if (user.role === "DOCTOR") router.replace("/doctor");
      else if (user.role === "ADMIN") router.replace("/admin");
      else router.replace("/");
    }
  }, [isHydrated, isAuthenticated, user, router]);

  if (!isHydrated || !isAuthenticated || user?.role !== "GENERAL_PRACTITIONER") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <GPTopNav />
      <main className="flex-1 pt-24">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
