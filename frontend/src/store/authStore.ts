import { create } from "zustand";
import type { User } from "../types";
import { getMe } from "../services/api";

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  loadUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem("token"),
  user: null,
  isLoading: true,

  setToken: (token: string) => {
    localStorage.setItem("token", token);
    set({ token });
  },

  loadUser: async () => {
    const { token } = get();
    if (!token) { set({ isLoading: false }); return; }
    try {
      const user = await getMe(token);
      set({ user, isLoading: false });
    } catch {
      localStorage.removeItem("token");
      set({ token: null, user: null, isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },
}));
