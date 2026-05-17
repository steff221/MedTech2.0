"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DoctorTopNav } from "@/components/layout/DoctorTopNav";
import { Spinner } from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user && user.role !== "DOCTOR") {
      router.replace(user.role === "PATIENT" ? "/dashboard" : "/");
    }
  }, [isHydrated, isAuthenticated, user, router]);

  if (!isHydrated || !isAuthenticated || user?.role !== "DOCTOR") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <DoctorTopNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
