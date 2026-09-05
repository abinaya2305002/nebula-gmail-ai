import { gmail, gmail_v1 } from '@googleapis/gmail';
import { IMailService, SendEmailPayload } from './mail.interface.js';
import { AuthService } from './auth.service.js';
import { db } from '../db/database.js';
import { EmailMessage, EmailFilterParams, EmailThread } from '../types/index.js';
import { EmailParser } from '../utils/email-parser.js';
import { QueryBuilder } from '../utils/query-builder.js';

export class GmailService implements IMailService {
  private static instance: GmailService;

  public static getInstance(): GmailService {
    if (!GmailService.instance) {
      GmailService.instance = new GmailService();
    }
    return GmailService.instance;
  }

  private async getGmailClient(userId: string): Promise<gmail_v1.Gmail | null> {
    const auth = await AuthService.getAuthenticatedClient(userId);
    if (!auth) return null;
    return gmail({ version: 'v1', auth: auth as any });
  }

  public async listMessages(userId: string, params: EmailFilterParams = {}): Promise<{ messages: EmailMessage[]; total: number }> {
    const gmailClient = await this.getGmailClient(userId);

    // If real Gmail is connected, query Gmail API and synchronize to DB
    if (gmailClient) {
      try {
        const q = QueryBuilder.toGmailQuery(params);
        const labelIds: string[] = [];
        if (params.folder === 'inbox') labelIds.push('INBOX');
        if (params.folder === 'sent') labelIds.push('SENT');
        if (params.folder === 'trash') labelIds.push('TRASH');

        const listRes = await gmailClient.users.messages.list({
          userId: 'me',
          q: q || undefined,
          labelIds: labelIds.length > 0 ? labelIds : undefined,
          maxResults: params.limit || 20,
        });

        const rawList = listRes.data.messages || [];
        const fetchedMessages: EmailMessage[] = [];

        // Fetch detail for each message in parallel
        await Promise.all(
          rawList.slice(0, 20).map(async (item) => {
            if (!item.id) return;
            try {
              const detailRes = await gmailClient.users.messages.get({
                userId: 'me',
                id: item.id,
                format: 'full',
              });
              const parsed = EmailParser.parseGmailMessage(detailRes.data);
              fetchedMessages.push(parsed);
              db.upsertEmail(parsed, userId);
            } catch (err) {
              console.warn(`Failed to fetch details for message ${item.id}:`, err);
            }
          })
        );

        if (fetchedMessages.length > 0) {
          fetchedMessages.sort((a, b) => b.date - a.date);
          return {
            messages: fetchedMessages,
            total: listRes.data.resultSizeEstimate || fetchedMessages.length,
          };
        }
      } catch (err) {
        console.error('Error fetching from Gmail API, falling back to local cache:', err);
      }
    }

    // Return from local database cache (works for both offline Gmail cache & Demo account)
    const cached = db.getEmails(userId, params);
    return {
      messages: cached,
      total: cached.length,
    };
  }

  public async getMessage(userId: string, messageId: string): Promise<EmailMessage | null> {
    const gmailClient = await this.getGmailClient(userId);

    if (gmailClient) {
      try {
        const res = await gmailClient.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full',
        });
        const parsed = EmailParser.parseGmailMessage(res.data);
        db.upsertEmail(parsed, userId);
        return parsed;
      } catch (err) {
        console.warn('Error fetching message from Gmail API:', err);
      }
    }

    return db.getEmailById(messageId, userId);
  }

  public async getThread(userId: string, threadId: string): Promise<EmailThread | null> {
    const gmailClient = await this.getGmailClient(userId);

    if (gmailClient) {
      try {
        const res = await gmailClient.users.threads.get({
          userId: 'me',
          id: threadId,
          format: 'full',
        });

        const rawMessages = res.data.messages || [];
        const messages = rawMessages.map(m => EmailParser.parseGmailMessage(m));
        messages.sort((a, b) => a.date - b.date);

        for (const m of messages) {
          db.upsertEmail(m, userId);
        }

        const lastMsg = messages[messages.length - 1];
        return {
          id: threadId,
          subject: lastMsg?.subject || '(No Subject)',
          snippet: lastMsg?.snippet || '',
          lastMessageDate: lastMsg?.date || Date.now(),
          messageCount: messages.length,
          hasUnread: messages.some(m => m.isUnread),
          messages,
        };
      } catch (err) {
        console.warn('Error fetching thread from Gmail API:', err);
      }
    }

    // Cache fallback
    const cachedMessages = db.getThread(threadId, userId);
    if (cachedMessages.length === 0) return null;

    const lastMsg = cachedMessages[cachedMessages.length - 1];
    return {
      id: threadId,
      subject: lastMsg?.subject || '(No Subject)',
      snippet: lastMsg?.snippet || '',
      lastMessageDate: lastMsg?.date || Date.now(),
      messageCount: cachedMessages.length,
      hasUnread: cachedMessages.some(m => m.isUnread),
      messages: cachedMessages,
    };
  }

  public async sendMessage(userId: string, payload: SendEmailPayload): Promise<EmailMessage> {
    const user = db.getUser(userId) || AuthService.getUser(userId);
    const gmailClient = await this.getGmailClient(userId);

    if (gmailClient) {
      const rawMime = EmailParser.createMimeMessage({
        from: user.email,
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
        inReplyTo: payload.replyToId,
      });

      const res = await gmailClient.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: rawMime,
          threadId: payload.threadId,
        },
      });

      const sentMsgId = res.data.id || 'msg_sent_' + Date.now();
      const sentMessage: EmailMessage = {
        id: sentMsgId,
        threadId: res.data.threadId || payload.threadId || ('thread_' + sentMsgId),
        folder: 'sent',
        senderName: user.displayName,
        senderEmail: user.email,
        recipientEmail: payload.to,
        subject: payload.subject,
        snippet: payload.body.slice(0, 100),
        bodyText: payload.body,
        bodyHtml: `<p>${payload.body.replace(/\n/g, '<br/>')}</p>`,
        date: Date.now(),
        isUnread: false,
        isStarred: false,
        labels: ['SENT'],
      };

      db.upsertEmail(sentMessage, userId);
      return sentMessage;
    }

    // Demo Mode: simulate instant delivery and local storage
    const msgId = 'msg_demo_sent_' + Date.now();
    const sentMessage: EmailMessage = {
      id: msgId,
      threadId: payload.threadId || ('thread_' + msgId),
      folder: 'sent',
      senderName: user.displayName,
      senderEmail: user.email,
      recipientEmail: payload.to,
      subject: payload.subject,
      snippet: payload.body.slice(0, 120),
      bodyText: payload.body,
      bodyHtml: `<p>${payload.body.replace(/\n/g, '<br/>')}</p>`,
      date: Date.now(),
      isUnread: false,
      isStarred: false,
      labels: ['SENT'],
    };

    db.upsertEmail(sentMessage, userId);
    return sentMessage;
  }

  public async updateMessage(
    userId: string,
    messageId: string,
    updates: { isUnread?: boolean; isStarred?: boolean; folder?: string }
  ): Promise<boolean> {
    const gmailClient = await this.getGmailClient(userId);

    if (gmailClient) {
      try {
        const addLabels: string[] = [];
        const removeLabels: string[] = [];

        if (updates.isUnread === true) addLabels.push('UNREAD');
        if (updates.isUnread === false) removeLabels.push('UNREAD');
        if (updates.isStarred === true) addLabels.push('STARRED');
        if (updates.isStarred === false) removeLabels.push('STARRED');
        if (updates.folder === 'trash') addLabels.push('TRASH');

        await gmailClient.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            addLabelIds: addLabels,
            removeLabelIds: removeLabels,
          },
        });
      } catch (err) {
        console.error('Failed to update label on Gmail API:', err);
      }
    }

    return db.updateEmailStatus(messageId, userId, updates);
  }

  public async syncMailbox(userId: string): Promise<{ newCount: number; updatedCount: number }> {
    const gmailClient = await this.getGmailClient(userId);
    if (!gmailClient) {
      return { newCount: 0, updatedCount: 0 };
    }

    try {
      const user = db.getUser(userId);
      let historyId = user?.historyId;

      if (!historyId) {
        // Initial sync: fetch latest 30 messages
        const list = await this.listMessages(userId, { limit: 30 });
        const profile = await gmailClient.users.getProfile({ userId: 'me' });
        if (profile.data.historyId) {
          db.upsertUser({
            ...user!,
            historyId: profile.data.historyId,
          });
        }
        return { newCount: list.messages.length, updatedCount: 0 };
      }

      // Delta sync using history.list
      const historyRes = await gmailClient.users.history.list({
        userId: 'me',
        startHistoryId: historyId,
      });

      let newCount = 0;
      let updatedCount = 0;

      const histories = historyRes.data.history || [];
      for (const h of histories) {
        if (h.messagesAdded) {
          for (const item of h.messagesAdded) {
            if (item.message?.id) {
              await this.getMessage(userId, item.message.id);
              newCount++;
            }
          }
        }
        if (h.labelsAdded || h.labelsRemoved) {
          updatedCount++;
        }
      }

      if (historyRes.data.historyId) {
        db.upsertUser({
          ...user!,
          historyId: historyRes.data.historyId,
        });
      }

      return { newCount, updatedCount };
    } catch (err) {
      console.warn('Sync failed:', err);
      return { newCount: 0, updatedCount: 0 };
    }
  }
}

export const mailService = GmailService.getInstance();
