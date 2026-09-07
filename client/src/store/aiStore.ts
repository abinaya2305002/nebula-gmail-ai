import { create } from 'zustand';
import { AssistantMessage, UIAction, UIContextSnapshot } from '../types/ai.js';
import { useMailStore } from './mailStore.js';
import { useUIStore } from './uiStore.js';

const API_BASE = 'http://localhost:5000/api';

interface AIState {
  messages: AssistantMessage[];
  isLoading: boolean;
  isExecuting: boolean;

  sendMessage: (prompt: string) => Promise<void>;
  executeAction: (action: UIAction) => Promise<void>;
  triggerUndo: (action?: UIAction) => Promise<void>;
  clearHistory: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  messages: [
    {
      id: 'welcome_msg',
      role: 'assistant',
      content:
        '👋 Welcome to **Nebula Gmail AI Copilot**! I directly control your inbox, compose drafts, filter threads, and navigate emails.\n\nAsk me anything in natural language:\n• "Send an email to john@example.com with subject \'Meeting Tomorrow\' and body \'Let’s meet at 3pm\'"\n• "Show my recent emails"\n• "Show emails from the last 10 days"\n• "Open the latest email from David"\n• "Reply to this saying sounds good"\n• "Show only unread emails from this week"\n• "Show last 2 emails"',
      timestamp: Date.now(),
    },
  ],
  isLoading: false,
  isExecuting: false,

  sendMessage: async (prompt: string) => {
    if (!prompt.trim()) return;

    const userMessage: AssistantMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    // Gather live UI Context Snapshot
    const mailState = useMailStore.getState();
    const uiState = useUIStore.getState();

    const contextSnapshot: UIContextSnapshot = {
      currentView: uiState.currentView,
      activeEmailId: mailState.selectedEmail?.id,
      activeEmail: mailState.selectedEmail
        ? {
            id: mailState.selectedEmail.id,
            from: mailState.selectedEmail.senderEmail,
            to: mailState.selectedEmail.recipientEmail,
            subject: mailState.selectedEmail.subject,
            snippet: mailState.selectedEmail.snippet,
            body: mailState.selectedEmail.bodyText,
            date: new Date(mailState.selectedEmail.date).toISOString(),
            threadId: mailState.selectedEmail.threadId,
          }
        : undefined,
      currentFilters: {
        query: mailState.filters.query,
        sender: mailState.filters.sender,
        dateRangeDays: mailState.filters.dateRangeDays,
        isUnread: mailState.filters.isUnread,
        folder: mailState.activeFolder,
      },
      composeState: {
        isOpen: uiState.composeModal.isOpen,
        to: uiState.composeModal.to,
        subject: uiState.composeModal.subject,
        body: uiState.composeModal.body,
        mode: uiState.composeModal.mode,
      },
      visibleEmailsSummary: mailState.emails.slice(0, 10).map((e) => ({
        id: e.id,
        from: `${e.senderName} <${e.senderEmail}>`,
        subject: e.subject,
        date: new Date(e.date).toLocaleDateString(),
        isUnread: e.isUnread,
      })),
    };

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: contextSnapshot,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        const assistantMsg: AssistantMessage = {
          id: 'ai_' + Date.now(),
          role: 'assistant',
          content: data.message,
          actions: data.actions,
          timeline: data.timeline,
          undoAction: data.undoAction,
          emailPreviews: data.emailPreviews,
          richContent: data.richContent,
          timestamp: Date.now(),
        };

        set((state) => ({
          messages: [...state.messages, assistantMsg],
          isLoading: false,
        }));

        // Execute actions on UI in sequence
        if (data.actions && Array.isArray(data.actions)) {
          for (const action of data.actions) {
            await get().executeAction(action);
          }
        }
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error('AI chat failed:', err);
      set({ isLoading: false });
    }
  },

  /**
   * Translates AI actions into UI mutations!
   */
  executeAction: async (action: UIAction) => {
    set({ isExecuting: true });
    const mailStore = useMailStore.getState();
    const uiStore = useUIStore.getState();
    const payload = action.payload || {};

    switch (action.type) {
      case 'OPEN_COMPOSE': {
        const { to, subject, body, mode, replyToEmailId, threadId } = payload;
        // Trigger visible animated filling so the user sees fields type in!
        await uiStore.animateFillCompose({ to, subject, body });
        if (replyToEmailId) {
          uiStore.updateComposeFields({ replyToId: replyToEmailId, threadId, mode: mode || 'reply' });
        }
        break;
      }

      case 'CLOSE_COMPOSE': {
        uiStore.closeCompose();
        break;
      }

      case 'FILL_COMPOSE': {
        const { to, subject, body } = payload;
        await uiStore.animateFillCompose({ to, subject, body });
        break;
      }

      case 'FILTER_EMAILS': {
        const { query, sender, dateRangeDays, isUnread, folder } = payload;
        if (folder && folder !== mailStore.activeFolder) {
          mailStore.setActiveFolder(folder);
        }
        mailStore.setFilters({
          query: query !== undefined ? query : undefined,
          sender: sender !== undefined ? sender : undefined,
          dateRangeDays: dateRangeDays !== undefined ? dateRangeDays : undefined,
          isUnread: isUnread !== undefined ? isUnread : undefined,
        });
        uiStore.setCurrentView('inbox');
        break;
      }

      case 'NAVIGATE_TO_EMAIL': {
        const { emailId, senderQuery, subjectQuery, latest } = payload;
        let targetId = emailId;

        // If no explicit ID, resolve against currently loaded emails or fetch
        if (!targetId && (senderQuery || subjectQuery || latest)) {
          const matched = mailStore.emails.find((e) => {
            const matchSender = senderQuery
              ? e.senderEmail.toLowerCase().includes(senderQuery.toLowerCase()) ||
                e.senderName.toLowerCase().includes(senderQuery.toLowerCase())
              : true;
            const matchSubject = subjectQuery
              ? e.subject.toLowerCase().includes(subjectQuery.toLowerCase())
              : true;
            return matchSender && matchSubject;
          });

          if (matched) {
            targetId = matched.id;
          } else if (mailStore.emails.length > 0 && latest) {
            targetId = mailStore.emails[0].id;
          }
        }

        if (targetId) {
          await mailStore.selectEmail(targetId);
          uiStore.setCurrentView('detail');
        }
        break;
      }

      case 'NAVIGATE_FOLDER': {
        const { folder } = payload;
        if (folder) {
          mailStore.setActiveFolder(folder);
          uiStore.setCurrentView('inbox');
        }
        break;
      }

      case 'UNDO_LAST_ACTION': {
        mailStore.undoLastAction();
        break;
      }

      case 'REQUEST_CONFIRMATION': {
        // Handled via Rich Confirmation Card inside Assistant Panel or Confirm Dialog
        break;
      }
    }

    set({ isExecuting: false });
  },

  triggerUndo: async (action?: UIAction) => {
    if (action) {
      await get().executeAction(action);
    } else {
      useMailStore.getState().undoLastAction();
    }
    useUIStore.getState().addToast({
      title: 'Action Undone',
      message: action?.description || 'Reverted previous action',
      type: 'info',
    });
  },

  clearHistory: () => set({ messages: [] }),
}));
