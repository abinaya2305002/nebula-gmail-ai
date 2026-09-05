export type UIActionType =
  | 'OPEN_COMPOSE'
  | 'FILL_COMPOSE'
  | 'SEND_EMAIL'
  | 'FILTER_EMAILS'
  | 'NAVIGATE_TO_EMAIL'
  | 'NAVIGATE_FOLDER'
  | 'REQUEST_CONFIRMATION'
  | 'SHOW_EMAIL_PREVIEW';

export interface UIAction {
  type: UIActionType;
  payload: Record<string, any>;
  description?: string;
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
  richContent?: {
    type: 'email_preview' | 'confirmation_card' | 'quick_replies';
    data: any;
  };
  timestamp: number;
}

export interface AssistantChatResponse {
  message: string;
  actions: UIAction[];
  richContent?: {
    type: 'email_preview' | 'confirmation_card' | 'quick_replies';
    data: any;
  };
}
