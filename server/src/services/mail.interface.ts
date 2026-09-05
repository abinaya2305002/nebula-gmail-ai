import { EmailFilterParams, EmailMessage, EmailThread } from '../types/index.js';

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  replyToId?: string;
  threadId?: string;
}

export interface IMailService {
  listMessages(userId: string, params?: EmailFilterParams): Promise<{ messages: EmailMessage[]; total: number }>;
  getMessage(userId: string, messageId: string): Promise<EmailMessage | null>;
  getThread(userId: string, threadId: string): Promise<EmailThread | null>;
  sendMessage(userId: string, payload: SendEmailPayload): Promise<EmailMessage>;
  updateMessage(userId: string, messageId: string, updates: { isUnread?: boolean; isStarred?: boolean; folder?: string }): Promise<boolean>;
  syncMailbox(userId: string): Promise<{ newCount: number; updatedCount: number }>;
}
