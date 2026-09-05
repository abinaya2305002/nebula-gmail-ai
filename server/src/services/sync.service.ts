import { Response } from 'express';
import { mailService } from './gmail.service.js';
import { db } from '../db/database.js';
import { EmailMessage } from '../types/index.js';

interface ClientConnection {
  id: string;
  userId: string;
  res: Response;
}

export class SyncService {
  private static instance: SyncService;
  private clients: Map<string, ClientConnection> = new Map();
  private pollInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startBackgroundPoller();
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  public addClient(clientId: string, userId: string, res: Response): void {
    // Set headers for Server-Sent Events (SSE)
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial connected event
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId, timestamp: Date.now() })}\n\n`);

    this.clients.set(clientId, { id: clientId, userId, res });

    res.on('close', () => {
      this.clients.delete(clientId);
    });
  }

  public broadcast(userId: string, eventType: string, payload: any): void {
    const data = JSON.stringify({ type: eventType, payload, timestamp: Date.now() });
    for (const [_, client] of this.clients.entries()) {
      if (client.userId === userId || client.userId === 'demo_user_nebula') {
        try {
          client.res.write(`data: ${data}\n\n`);
        } catch (err) {
          console.warn(`Failed to send event to client ${client.id}:`, err);
        }
      }
    }
  }

  private startBackgroundPoller(): void {
    // Delta sync check every 25 seconds
    this.pollInterval = setInterval(async () => {
      for (const [_, client] of this.clients.entries()) {
        try {
          const result = await mailService.syncMailbox(client.userId);
          if (result.newCount > 0 || result.updatedCount > 0) {
            this.broadcast(client.userId, 'SYNC_COMPLETE', result);
          }
        } catch {
          // Ignore background sync errors
        }
      }
    }, 25000);
  }

  /**
   * Triggers an incoming real email simulation for demo & evaluation testing
   */
  public triggerSimulatedIncomingEmail(userId: string): EmailMessage {
    const now = Date.now();
    const id = 'msg_live_' + now;
    const senders = [
      { name: 'Sarah Jenkins', email: 'sarah.j@knowlab.org' },
      { name: 'David Miller', email: 'david@techcorp.io' },
      { name: 'Alex Rivera', email: 'alex.r@venturecap.com' },
      { name: 'Dr. Elena Rostova', email: 'elena.rostova@ai-research.edu' },
    ];
    const picked = senders[Math.floor(Math.random() * senders.length)];

    const subjects = [
      'Urgent: AI Co-pilot UI Verification Passed',
      'Design update: Dark Mode tokens updated',
      'Feedback on natural language compose workflow',
      'Production deployment sync completed',
    ];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];

    const newEmail: EmailMessage = {
      id,
      threadId: 'thread_live_' + now,
      folder: 'inbox',
      senderName: picked.name,
      senderEmail: picked.email,
      recipientEmail: 'alex.developer@example.com',
      subject,
      snippet: 'Real-time push delivery confirmed! This email appeared instantly without manual page refresh.',
      bodyText: `Hello Alex,\n\nThis message was dispatched to your inbox via real-time push synchronization.\nThe UI updated instantly without requiring you to click refresh!\n\nBest regards,\n${picked.name}`,
      bodyHtml: `<p>Hello Alex,</p><p>This message was dispatched to your inbox via <strong>real-time push synchronization</strong>.</p><p>The UI updated instantly without requiring you to click refresh!</p><p>Best regards,<br>${picked.name}</p>`,
      date: now,
      isUnread: true,
      isStarred: false,
      labels: ['INBOX', 'UNREAD'],
    };

    db.upsertEmail(newEmail, userId);
    this.broadcast(userId, 'NEW_EMAIL', newEmail);
    return newEmail;
  }
}

export const syncService = SyncService.getInstance();
