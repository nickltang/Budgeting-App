import { create } from 'zustand';

interface User {
  id: string;
  householdId: string;
}

interface SessionStore {
  user?: User;
  loadMe: () => Promise<void>;
}

export const useSessionStore = create<SessionStore>((set) => ({
  user: undefined,
  loadMe: async () => {
    try {
      const { api } = await import('../lib/api');
      const user = await api.get<User>('/api/me');
      set({ user });
    } catch (error) {
      // Silently fail if /api/me doesn't exist or returns 401
      console.log('Session not loaded:', error);
    }
  },
}));

