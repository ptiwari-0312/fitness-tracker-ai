/**
 * Authentication global state.
 * Tokens are persisted to expo-secure-store via MMKV for offline support.
 */
import { Platform } from "react-native";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  gender?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  target_weight_kg?: number;
  goal?: string;
  streak_days: number;
  total_points: number;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: UserProfile) => void;
  updateUser: (partial: Partial<UserProfile>) => void;
  logout: () => void;
}

// Platform-aware storage: SecureStore on native, localStorage on web
const secureStorage =
  Platform.OS === "web"
    ? {
        getItem: (name: string) => Promise.resolve(localStorage.getItem(name)),
        setItem: (name: string, value: string) => { localStorage.setItem(name, value); return Promise.resolve(); },
        removeItem: (name: string) => { localStorage.removeItem(name); return Promise.resolve(); },
      }
    : {
        getItem: (name: string) => SecureStore.getItemAsync(name),
        setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
        removeItem: (name: string) => SecureStore.deleteItemAsync(name),
      };

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      updateUser: (partial) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...partial } });
      },

      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: "fitness-auth",
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
