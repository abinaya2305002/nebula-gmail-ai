import { create } from 'zustand';
import { EmailFilterParams, EmailMessage, EmailThread, MailStats } from '../types/mail.js';

const API_BASE = 'http://localhost:5000/api';

interface MailState {
  emails: EmailMessage[];
  selectedEmail: EmailMessage | null;
  selectedThread: EmailThread | null;
  activeFolder: string;
  filters: EmailFilterParams;
  stats: MailStats;
  isLoading: boolean;
  isSending: boolean;
  highlightedEmailId: string | null;

  fetchEmails: (customParams?: Partial<EmailFilterParams>) => Promise<void>;
  fetchStats: () => Promise<void>;
  selectEmail: (id: string | null) => Promise<void>;
  fetchThread: (threadId: string) => Promise<void>;
  setFilters: (filters: Partial<EmailFilterParams>) => void;
  resetFilters: () => void;
  setActiveFolder: (folder: string) => void;
  markAsRead: (id: string, isUnread: boolean) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  deleteEmail: (id: string) => Promise<void>;
  sendEmail: (payload: { to: string; subject: string; body: string; replyToId?: string; threadId?: string }) => Promise<boolean>;
  addIncomingEmail: (email: EmailMessage) => void;
  setHighlightedEmailId: (id: string | null) => void;
}

export const useMailStore = create<MailState>((set, get) => ({
  emails: [],
  selectedEmail: null,
  selectedThread: null,
  activeFolder: 'inbox',
  filters: { folder: 'inbox' },
  stats: { inboxCount: 0, unreadCount: 0, sentCount: 0, starredCount: 0 },
  isLoading: false,
  isSending: false,
  highlightedEmailId: null,

  fetchEmails: async (customParams) => {
    try {
      set({ isLoading: true });
      const currentFilters = { ...get().filters, ...customParams };
      const params = new URLSearchParams();

      if (currentFilters.folder) params.append('folder', currentFilters.folder);
      if (currentFilters.query) params.append('query', currentFilters.query);
      if (currentFilters.sender) params.append('sender', currentFilters.sender);
      if (currentFilters.dateRangeDays) params.append('dateRangeDays', currentFilters.dateRangeDays.toString());
      if (currentFilters.isUnread !== undefined) params.append('isUnread', currentFilters.isUnread.toString());

      const res = await fetch(`${API_BASE}/mail?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        set({ emails: data.messages, filters: currentFilters, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      get().fetchStats();
    } catch (err) {
      console.error('Failed to fetch emails:', err);
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const res = await fetch(`${API_BASE}/mail/stats`);
      if (res.ok) {
        const stats = await res.json();
        set({ stats });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  },

  selectEmail: async (id) => {
    if (!id) {
      set({ selectedEmail: null, selectedThread: null });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/mail/${id}`);
      if (res.ok) {
        const email = await res.json();
        set({ selectedEmail: email });

        // Auto mark as read if unread
        if (email.isUnread) {
          get().markAsRead(id, false);
        }

        // Fetch thread if threadId exists
        if (email.threadId) {
          get().fetchThread(email.threadId);
        }
      }
    } catch (err) {
      console.error('Failed to load email:', err);
    }
  },

  fetchThread: async (threadId) => {
    try {
      const res = await fetch(`${API_BASE}/mail/threads/${threadId}`);
      if (res.ok) {
        const thread = await res.json();
        set({ selectedThread: thread });
      }
    } catch (err) {
      console.error('Failed to load thread:', err);
    }
  },

  setFilters: (newFilters) => {
    const updated = { ...get().filters, ...newFilters };
    set({ filters: updated });
    get().fetchEmails(updated);
  },

  resetFilters: () => {
    const defaultFilters: EmailFilterParams = { folder: get().activeFolder };
    set({ filters: defaultFilters });
    get().fetchEmails(defaultFilters);
  },

  setActiveFolder: (folder) => {
    set({
      activeFolder: folder,
      selectedEmail: null,
      selectedThread: null,
      filters: { ...get().filters, folder },
    });
    get().fetchEmails({ folder });
  },

  markAsRead: async (id, isUnread) => {
    try {
      await fetch(`${API_BASE}/mail/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUnread }),
      });

      set((state) => ({
        emails: state.emails.map((e) => (e.id === id ? { ...e, isUnread } : e)),
        selectedEmail: state.selectedEmail?.id === id ? { ...state.selectedEmail, isUnread } : state.selectedEmail,
      }));
      get().fetchStats();
    } catch (err) {
      console.error('Failed to update unread status:', err);
    }
  },

  toggleStar: async (id) => {
    const email = get().emails.find((e) => e.id === id);
    if (!email) return;
    const isStarred = !email.isStarred;

    try {
      await fetch(`${API_BASE}/mail/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred }),
      });

      set((state) => ({
        emails: state.emails.map((e) => (e.id === id ? { ...e, isStarred } : e)),
        selectedEmail: state.selectedEmail?.id === id ? { ...state.selectedEmail, isStarred } : state.selectedEmail,
      }));
      get().fetchStats();
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  },

  deleteEmail: async (id) => {
    try {
      await fetch(`${API_BASE}/mail/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'trash' }),
      });

      set((state) => ({
        emails: state.emails.filter((e) => e.id !== id),
        selectedEmail: state.selectedEmail?.id === id ? null : state.selectedEmail,
      }));
      get().fetchStats();
    } catch (err) {
      console.error('Failed to trash email:', err);
    }
  },

  sendEmail: async (payload) => {
    try {
      set({ isSending: true });
      const res = await fetch(`${API_BASE}/mail/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      set({ isSending: false });

      if (res.ok) {
        get().fetchEmails();
        get().fetchStats();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to send email:', err);
      set({ isSending: false });
      return false;
    }
  },

  addIncomingEmail: (email) => {
    set((state) => {
      // Avoid duplicate
      if (state.emails.some((e) => e.id === email.id)) {
        return state;
      }
      return {
        emails: [email, ...state.emails],
        highlightedEmailId: email.id,
      };
    });
    get().fetchStats();
  },

  setHighlightedEmailId: (id) => set({ highlightedEmailId: id }),
}));
