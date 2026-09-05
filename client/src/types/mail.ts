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
  date: number;
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

export interface EmailFilterParams {
  folder?: string;
  query?: string;
  sender?: string;
  dateRangeDays?: number;
  isUnread?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isDemoUser?: boolean;
}

export interface MailStats {
  inboxCount: number;
  unreadCount: number;
  sentCount: number;
  starredCount: number;
}
