"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { extractErrorMessage } from "@/services/api";
import type { LoginRequest, RegisterRequest, UserRole } from "@/types/api";

function homeFor(role: UserRole): string {
  if (role === "DOCTOR") return "/doctor";
  return "/dashboard";
}

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, isHydrated, setAuth, logout: clearAuth } = useAuthStore();

  const login = useCallback(
    async (body: LoginRequest) => {
      try {
        const res = await authService.login(body);
        setAuth(res.user, res.accessToken, res.refreshToken);
        toast.success(`Welcome back, ${res.user.firstName}`);
        router.push(homeFor(res.user.role));
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
        setAuth(res.user, res.accessToken, res.refreshToken);
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
      // stateless JWT — failure to call /logout is fine, we still clear locally
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
