"use client";

import { create } from "zustand";
import type { AuthResult, AuthUser } from "@future-fit/types";
import { AUTH_ROUTES } from "@future-fit/config";
import { apiRequest, refreshSession } from "@/lib/api-client";
import { clearDrafts } from "@/lib/offline-assessment";

interface AuthState {
  user: AuthUser | null;
  initialized: boolean;
  setAuth: (result: AuthResult) => void;
  restore: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  setAuth: (result) => {
    set({ user: result.user, initialized: true });
  },
  restore: async () => {
    try {
      const result = await refreshSession();
      set({ user: result.user, initialized: true });
    } catch {
      set({ user: null, initialized: true });
    }
  },
  logout: async () => {
    await apiRequest<void>(AUTH_ROUTES.logout, { method: "POST" });
    await clearDrafts();
    set({ user: null, initialized: true });
  },
}));
