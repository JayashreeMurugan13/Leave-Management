import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'PROFESSOR' | 'HOD' | 'PRINCIPAL';
  department: string | null;
  leaveBalance: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token?: string) => void;
  logout: () => void;
}

const stored = (() => {
  try {
    const u = sessionStorage.getItem('auth_user');
    const t = sessionStorage.getItem('auth_token');
    return u ? { user: JSON.parse(u), token: t } : null;
  } catch { return null; }
})();

export const useAuthStore = create<AuthState>((set) => ({
  user: stored?.user ?? null,
  token: stored?.token ?? null,
  isAuthenticated: !!stored?.user,
  login: (user, token) => {
    try {
      sessionStorage.setItem('auth_user', JSON.stringify(user));
      sessionStorage.setItem('auth_token', token ?? '');
    } catch {}
    set({ user, token: token ?? null, isAuthenticated: true });
  },
  logout: () => {
    try {
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_token');
    } catch {}
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
