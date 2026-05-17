"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const router = useRouter();
  const { isHydrated, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (user.role === "DOCTOR") {
      router.replace("/doctor");
    } else {
      router.replace("/dashboard");
    }
  }, [isHydrated, isAuthenticated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
