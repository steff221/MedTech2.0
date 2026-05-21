import { api } from "./api";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/api";

export const authService = {
  login: (body: LoginRequest) =>
    api.post<AuthResponse>("/auth/login", body).then((r) => r.data),

  register: (body: RegisterRequest) =>
    api.post<AuthResponse>("/auth/register", body).then((r) => r.data),

  // Cookie is sent automatically by the browser; no body needed.
  refresh: () =>
    api.post<AuthResponse>("/auth/refresh", null).then((r) => r.data),

  logout: () =>
    api.post<void>("/auth/logout", null).then((r) => r.data),
};
