import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth.store";
import type { ApiError, AuthResponse } from "@/types/api";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  timeout: 15000,
});

// ---------------------------------------------------------------------------
// Request interceptor: attach bearer token from the auth store.
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor: on 401, attempt a single silent token refresh and
// retry the original request. If the refresh fails (or this *is* the refresh
// request itself, or we've already retried once), boot the user to /login.
//
// The in-flight refresh promise is shared so a burst of parallel 401s only
// triggers one /auth/refresh call — followers wait on the same promise.
// ---------------------------------------------------------------------------
type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let inflightRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setAuth } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    // Direct axios call (not `api`) — we don't want to recurse through this
    // interceptor for the refresh itself.
    const res = await axios.post<AuthResponse>(
      `${api.defaults.baseURL}/auth/refresh`,
      { refreshToken },
      { timeout: 10000 },
    );
    setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
    return res.data.accessToken;
  } catch {
    return null;
  }
}

function bootToLogin() {
  useAuthStore.getState().logout();
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  window.location.href = "/login";
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    // Not a 401, or no original request to retry → bubble up untouched.
    if (status !== 401 || !original) {
      return Promise.reject(error);
    }

    // The refresh endpoint itself returned 401 → tokens are dead, log out.
    if (original.url?.includes("/auth/refresh")) {
      bootToLogin();
      return Promise.reject(error);
    }

    // Already retried once → don't loop, log out.
    if (original._retried) {
      bootToLogin();
      return Promise.reject(error);
    }
    original._retried = true;

    // Share the refresh promise across parallel 401s.
    inflightRefresh ??= refreshAccessToken().finally(() => {
      inflightRefresh = null;
    });
    const newToken = await inflightRefresh;

    if (!newToken) {
      bootToLogin();
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  },
);

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    const data = error.response?.data;
    if (data?.errors?.length) {
      return data.errors.map((e) => `${e.field}: ${e.message}`).join("; ");
    }
    return data?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
