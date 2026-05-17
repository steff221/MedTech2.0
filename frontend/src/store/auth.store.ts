import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserResponse } from "@/types/api";

interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  setAuth: (user: UserResponse, accessToken: string, refreshToken: string) => void;
  setUser: (user: UserResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isHydrated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "medtech-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true;
      },
    },
  ),
);
