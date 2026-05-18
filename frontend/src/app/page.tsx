"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { Spinner } from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const router = useRouter();
  const { isHydrated, isAuthenticated, user } = useAuth();

  // Authenticated users skip the landing and go straight to their dashboard.
  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) return;
    if (user.role === "DOCTOR") router.replace("/doctor");
    else router.replace("/dashboard");
  }, [isHydrated, isAuthenticated, user, router]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // While the redirect for an authed user is in-flight, render nothing so the
  // landing page doesn't flash on logged-in users.
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return <LandingPage />;
}
