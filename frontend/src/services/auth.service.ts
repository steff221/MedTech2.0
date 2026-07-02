// API сервис: повици за автентикација (најава, регистрација, токени).
import { api } from "./api";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/api";

export const authService = {
  login: (body: LoginRequest) =>
    api.post<AuthResponse>("/auth/login", body).then((r) => r.data),

  register: (body: RegisterRequest) =>
    api.post<AuthResponse>("/auth/register", body).then((r) => r.data),

  // Cookie is sent automatically by the browser; no body needed.
  refresh: () =>
    api.post<AuthResponse>("/auth/refresh", null, { headers: { "Content-Type": "application/json" } }).then((r) => r.data),

  logout: () =>
    api.post<void>("/auth/logout", null, { headers: { "Content-Type": "application/json" } }).then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<void>("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (token: string, newPassword: string) =>
    api.post<void>("/auth/reset-password", { token, newPassword }).then((r) => r.data),

  verifyEmail: (token: string) =>
    api.get<void>(`/auth/verify-email?token=${encodeURIComponent(token)}`).then((r) => r.data),
};
