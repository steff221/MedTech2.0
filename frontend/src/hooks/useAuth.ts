"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { extractErrorMessage } from "@/services/api";
import type { LoginRequest, RegisterRequest, UserRole } from "@/types/api";

function homeFor(role: UserRole): string {
  if (role === "DOCTOR") return "/doctor";
  if (role === "PATIENT") return "/dashboard";
  if (role === "NURSE") return "/nurse";
  if (role === "ADMIN") return "/admin";
  return "/";
}

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, isHydrated, setAuth, logout: clearAuth } = useAuthStore();

  // Silent refresh on hard reload: user profile is in localStorage but accessToken was
  // cleared from memory. Re-acquire it using the httpOnly refresh_token cookie.
  useEffect(() => {
    if (!isHydrated) return;
    if (user && !accessToken) {
      authService.refresh().then((res) => {
        setAuth(res.user, res.accessToken);
      }).catch(() => {
        // Refresh token expired or missing — clear stale user profile
        clearAuth();
      });
    }
  }, [isHydrated, user, accessToken, setAuth, clearAuth]);

  const login = useCallback(
    async (body: LoginRequest, redirectTo?: string) => {
      try {
        const res = await authService.login(body);
        setAuth(res.user, res.accessToken);
        toast.success(`Welcome back, ${res.user.firstName}`);
        const dest = redirectTo && redirectTo.startsWith("/") ? redirectTo : homeFor(res.user.role);
        router.push(dest);
        return res;
      } catch (err) {
        toast.error(extractErrorMessage(err));
        throw err;
      }
    },
    [router, setAuth],
  );

  const register = useCallback(
    async (body: RegisterRequest) => {
      try {
        const res = await authService.register(body);
        setAuth(res.user, res.accessToken);
        toast.success("Account created. Welcome to MedTech.");
        router.push(homeFor(res.user.role));
        return res;
      } catch (err) {
        toast.error(extractErrorMessage(err));
        throw err;
      }
    },
    [router, setAuth],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // best-effort — always clear locally even if the server call fails
    }
    clearAuth();
    router.push("/login");
  }, [router, clearAuth]);

  return {
    user,
    isAuthenticated: !!accessToken,
    isHydrated,
    login,
    register,
    logout,
  };
}
