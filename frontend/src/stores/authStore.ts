import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type AuthResponse, type AuthUser } from '@/api/auth.api';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  register: (payload: { name: string; email: string; password: string }) => Promise<boolean>;
  login: (payload: { email: string; password: string }) => Promise<boolean>;
  refresh: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const applyAuth = (response: AuthResponse) => ({
  accessToken: response.accessToken,
  refreshToken: response.refreshToken,
  user: response.user,
  isAuthenticated: true,
  error: null,
});

const errorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string; error?: string } } }).response;
    return response?.data?.message || response?.data?.error || 'Yeu cau xac thuc that bai';
  }
  return 'Yeu cau xac thuc that bai';
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,

      register: async (payload) => {
        set({ loading: true, error: null });
        try {
          const response = await authApi.register(payload);
          set({ ...applyAuth(response), loading: false });
          return true;
        } catch (error) {
          set({ loading: false, error: errorMessage(error) });
          return false;
        }
      },

      login: async (payload) => {
        set({ loading: true, error: null });
        try {
          const response = await authApi.login(payload);
          set({ ...applyAuth(response), loading: false });
          return true;
        } catch (error) {
          set({ loading: false, error: errorMessage(error) });
          return false;
        }
      },

      refresh: async () => {
        const token = get().refreshToken;
        if (!token) return false;
        try {
          const response = await authApi.refresh(token);
          set(applyAuth(response));
          return true;
        } catch {
          set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
          return false;
        }
      },

      logout: async () => {
        const token = get().refreshToken;
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false, error: null });
        if (token) {
          try {
            await authApi.logout(token);
          } catch {
            // Local logout should still succeed if the network request fails.
          }
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'vpt-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
