import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserResponse } from "@/types/api";

interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  isHydrated: boolean;
  setAuth: (user: UserResponse, accessToken: string) => void;
  setUser: (user: UserResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isHydrated: false,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "medtech-auth",
      storage: createJSONStorage(() => localStorage),
      // Refresh token is stored only in an httpOnly cookie — never in localStorage.
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true;
      },
    },
  ),
);
