export interface EmailMessage {
  id: string;
  threadId: string;
  folder: 'inbox' | 'sent' | 'starred' | 'trash' | 'drafts';
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  snippet: string;
  bodyText: string;
  bodyHtml: string;
  date: number; // Unix timestamp in ms
  isUnread: boolean;
  isStarred: boolean;
  labels: string[];
}

export interface EmailThread {
  id: string;
  subject: string;
  snippet: string;
  lastMessageDate: number;
  messageCount: number;
  hasUnread: boolean;
  messages: EmailMessage[];
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isDemoUser?: boolean;
}

export interface UserAccount extends UserProfile {
  googleAccessToken?: string;
  googleRefreshToken?: string;
  tokenExpiresAt?: number;
  historyId?: string;
}

export type UIActionType =
  | 'OPEN_COMPOSE'
  | 'FILL_COMPOSE'
  | 'SEND_EMAIL'
  | 'FILTER_EMAILS'
  | 'NAVIGATE_TO_EMAIL'
  | 'NAVIGATE_FOLDER'
  | 'REQUEST_CONFIRMATION'
  | 'SHOW_EMAIL_PREVIEW'
  | 'REPLY_TO_EMAIL'
  | 'FORWARD_EMAIL';

export interface UIAction {
  type: UIActionType;
  payload: Record<string, any>;
  description?: string;
}

export interface UIContextSnapshot {
  currentView: 'inbox' | 'sent' | 'starred' | 'trash' | 'detail' | 'compose';
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

export interface AssistantChatResponse {
  message: string;
  actions: UIAction[];
  richContent?: {
    type: 'email_preview' | 'confirmation_card' | 'quick_replies';
    data: any;
  };
}

export interface EmailFilterParams {
  query?: string;
  sender?: string;
  dateRangeDays?: number;
  isUnread?: boolean;
  folder?: string;
  page?: number;
  limit?: number;
}
