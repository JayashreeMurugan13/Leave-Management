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
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

// Pre-filled with a mock user to show off the UI without a backend API call yet
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
