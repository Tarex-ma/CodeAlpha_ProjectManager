import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearTokens } from '../utils/tokenUtils';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => {
        clearTokens();
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: 'pf-auth' }
  )
);