import { create } from 'zustand';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export interface ComposeModalState {
  isOpen: boolean;
  to: string;
  subject: string;
  body: string;
  mode: 'new' | 'reply' | 'forward';
  replyToId?: string;
  threadId?: string;
  isFilling: boolean;
  highlightedField?: 'to' | 'subject' | 'body' | null;
}

interface UIState {
  currentView: 'inbox' | 'sent' | 'starred' | 'trash' | 'detail';
  isDarkMode: boolean;
  isAssistantOpen: boolean;
  toasts: ToastItem[];
  composeModal: ComposeModalState;
  confirmationDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null;

  setCurrentView: (view: UIState['currentView']) => void;
  toggleDarkMode: () => void;
  toggleAssistant: () => void;
  setAssistantOpen: (open: boolean) => void;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  openCompose: (initialData?: Partial<ComposeModalState>) => void;
  closeCompose: () => void;
  updateComposeFields: (fields: Partial<ComposeModalState>) => void;
  animateFillCompose: (fields: { to?: string; subject?: string; body?: string }) => Promise<void>;
  showConfirmation: (config: NonNullable<UIState['confirmationDialog']>) => void;
  closeConfirmation: () => void;
}

export const useUIStore = create<UIState>((set, get) => {
  // Check system dark preference or localStorage
  const initialDark =
    typeof window !== 'undefined'
      ? localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
      : false;

  if (typeof document !== 'undefined' && initialDark) {
    document.documentElement.classList.add('dark');
  }

  return {
    currentView: 'inbox',
    isDarkMode: initialDark,
    isAssistantOpen: true, // Opened by default as the core feature!
    toasts: [],
    composeModal: {
      isOpen: false,
      to: '',
      subject: '',
      body: '',
      mode: 'new',
      isFilling: false,
      highlightedField: null,
    },
    confirmationDialog: null,

    setCurrentView: (view) => set({ currentView: view }),

    toggleDarkMode: () => {
      const next = !get().isDarkMode;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      set({ isDarkMode: next });
    },

    toggleAssistant: () => set((state) => ({ isAssistantOpen: !state.isAssistantOpen })),
    setAssistantOpen: (open) => set({ isAssistantOpen: open }),

    addToast: (toast) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
      set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
      setTimeout(() => {
        get().removeToast(id);
      }, 5000);
    },

    removeToast: (id) =>
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

    openCompose: (initialData) =>
      set({
        composeModal: {
          isOpen: true,
          to: initialData?.to || '',
          subject: initialData?.subject || '',
          body: initialData?.body || '',
          mode: initialData?.mode || 'new',
          replyToId: initialData?.replyToId,
          threadId: initialData?.threadId,
          isFilling: false,
          highlightedField: null,
        },
      }),

    closeCompose: () =>
      set((state) => ({
        composeModal: {
          ...state.composeModal,
          isOpen: false,
          isFilling: false,
          highlightedField: null,
        },
      })),

    updateComposeFields: (fields) =>
      set((state) => ({
        composeModal: { ...state.composeModal, ...fields },
      })),

    /**
     * Visible animated typing / filling effect driven by the AI Assistant
     */
    animateFillCompose: async (fields) => {
      const { openCompose, updateComposeFields } = get();

      // Ensure modal is open first
      openCompose({ mode: 'new' });
      updateComposeFields({ isFilling: true });

      // Step 1: Animate recipient "To"
      if (fields.to) {
        updateComposeFields({ highlightedField: 'to' });
        await new Promise((r) => setTimeout(r, 200));
        updateComposeFields({ to: fields.to });
        await new Promise((r) => setTimeout(r, 250));
      }

      // Step 2: Animate "Subject"
      if (fields.subject) {
        updateComposeFields({ highlightedField: 'subject' });
        await new Promise((r) => setTimeout(r, 200));
        updateComposeFields({ subject: fields.subject });
        await new Promise((r) => setTimeout(r, 250));
      }

      // Step 3: Animate "Body"
      if (fields.body) {
        updateComposeFields({ highlightedField: 'body' });
        await new Promise((r) => setTimeout(r, 200));
        updateComposeFields({ body: fields.body });
        await new Promise((r) => setTimeout(r, 300));
      }

      updateComposeFields({ isFilling: false, highlightedField: null });
    },

    showConfirmation: (config) => set({ confirmationDialog: config }),
    closeConfirmation: () => set({ confirmationDialog: null }),
  };
});
