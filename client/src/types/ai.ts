export type UIActionType =
  | 'OPEN_COMPOSE'
  | 'CLOSE_COMPOSE'
  | 'FILL_COMPOSE'
  | 'SEND_EMAIL'
  | 'FILTER_EMAILS'
  | 'NAVIGATE_TO_EMAIL'
  | 'NAVIGATE_FOLDER'
  | 'REQUEST_CONFIRMATION'
  | 'SHOW_EMAIL_PREVIEW'
  | 'REPLY_TO_EMAIL'
  | 'FORWARD_EMAIL'
  | 'UNDO_LAST_ACTION';

export interface UIAction {
  type: UIActionType;
  payload?: Record<string, any>;
  description?: string;
}

export interface TimelineStep {
  step: string;
  status: 'completed' | 'in_progress' | 'pending';
}

export interface CompactEmailPreview {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  date: number;
  isUnread: boolean;
}

export interface UIContextSnapshot {
  currentView: 'inbox' | 'sent' | 'starred' | 'trash' | 'detail';
  activeEmailId?: string;
  activeEmail?: {
    id: string;
    from: string;
    to: string;
    subject: string;
    snippet: string;
    body: string;
    date: string;
    threadId?: string;
  };
  currentFilters?: {
    query?: string;
    sender?: string;
    dateRangeDays?: number;
    isUnread?: boolean;
    folder?: string;
  };
  composeState?: {
    isOpen: boolean;
    to?: string;
    subject?: string;
    body?: string;
    mode?: 'new' | 'reply' | 'forward';
  };
  visibleEmailsSummary?: Array<{
    id: string;
    from: string;
    subject: string;
    date: string;
    isUnread: boolean;
  }>;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: UIAction[];
  timeline?: TimelineStep[];
  undoAction?: UIAction;
  emailPreviews?: CompactEmailPreview[];
  richContent?: {
    type: 'email_preview' | 'confirmation_card' | 'quick_replies';
    data: any;
  };
  timestamp: number;
}

export interface AssistantChatResponse {
  message: string;
  actions: UIAction[];
  timeline?: TimelineStep[];
  undoAction?: UIAction;
  emailPreviews?: CompactEmailPreview[];
  richContent?: {
    type: 'email_preview' | 'confirmation_card' | 'quick_replies';
    data: any;
  };
}

