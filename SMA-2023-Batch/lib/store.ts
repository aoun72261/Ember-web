import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const AUTH_KEY = 'sma2023_authed';

type AuthStore = {
  isAuthed: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  setAuthed: (value: boolean) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthed: false,
  isLoading: true,

  checkAuth: async () => {
    try {
      const value = await SecureStore.getItemAsync(AUTH_KEY);
      set({ isAuthed: value === 'true', isLoading: false });
    } catch {
      set({ isAuthed: false, isLoading: false });
    }
  },

  setAuthed: async (value: boolean) => {
    await SecureStore.setItemAsync(AUTH_KEY, String(value));
    set({ isAuthed: value });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(AUTH_KEY);
    set({ isAuthed: false });
  },
}));
