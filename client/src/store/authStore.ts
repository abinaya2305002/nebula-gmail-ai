import { create } from 'zustand';
import { UserProfile } from '../types/mail.js';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  connectGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const API_BASE = 'http://localhost:5000/api';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  fetchUser: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await fetch(`${API_BASE}/auth/me`);
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  connectGoogle: async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/google/url`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(`Google OAuth Setup: ${data.error}\n\nPlease add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env to connect your personal Gmail account.`);
      }
    } catch (err: any) {
      alert('Could not initiate Google login: ' + err.message);
    }
  },

  logout: async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    set({ user: null });
  },
}));
