import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { EmailMessage, EmailFilterParams, UserAccount } from '../types/index.js';

class AppDatabase {
  private db: Database.Database;

  constructor() {
    const dbDir = path.dirname(config.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.db = new Database(config.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
    this.seedDemoDataIfEmpty();
  }

  private initSchema() {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      this.db.exec(schemaSql);
    } else {
      // Inline fallback
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          display_name TEXT,
          avatar_url TEXT,
          google_access_token TEXT,
          google_refresh_token TEXT,
          token_expires_at INTEGER,
          history_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS emails (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          thread_id TEXT NOT NULL,
          folder TEXT NOT NULL,
          sender_name TEXT,
          sender_email TEXT NOT NULL,
          recipient_email TEXT NOT NULL,
          subject TEXT,
          snippet TEXT,
          body_text TEXT,
          body_html TEXT,
          date INTEGER NOT NULL,
          is_unread BOOLEAN DEFAULT 1,
          is_starred BOOLEAN DEFAULT 0,
          labels TEXT,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS ai_messages (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          actions_json TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_emails_user_folder_date ON emails(user_id, folder, date DESC);
        CREATE INDEX IF NOT EXISTS idx_emails_thread ON emails(thread_id);
      `);
    }
  }

  public upsertUser(user: UserAccount): void {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, display_name, avatar_url, google_access_token, google_refresh_token, token_expires_at, history_id, updated_at)
      VALUES (@id, @email, @displayName, @avatarUrl, @googleAccessToken, @googleRefreshToken, @tokenExpiresAt, @historyId, CURRENT_TIMESTAMP)
      ON CONFLICT(email) DO UPDATE SET
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        google_access_token = COALESCE(excluded.google_access_token, users.google_access_token),
        google_refresh_token = COALESCE(excluded.google_refresh_token, users.google_refresh_token),
        token_expires_at = COALESCE(excluded.token_expires_at, users.token_expires_at),
        history_id = COALESCE(excluded.history_id, users.history_id),
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run({
      id: user.id,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      avatarUrl: user.avatarUrl || null,
      googleAccessToken: user.googleAccessToken || null,
      googleRefreshToken: user.googleRefreshToken || null,
      tokenExpiresAt: user.tokenExpiresAt || null,
      historyId: user.historyId || null,
    });
  }

  public getUser(id: string): UserAccount | null {
    const row = this.db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      googleAccessToken: row.google_access_token,
      googleRefreshToken: row.google_refresh_token,
      tokenExpiresAt: row.token_expires_at,
      historyId: row.history_id,
    };
  }

  public getUserByEmail(email: string): UserAccount | null {
    const row = this.db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as any;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      googleAccessToken: row.google_access_token,
      googleRefreshToken: row.google_refresh_token,
      tokenExpiresAt: row.token_expires_at,
      historyId: row.history_id,
    };
  }

  public upsertEmail(email: EmailMessage, userId: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO emails (id, user_id, thread_id, folder, sender_name, sender_email, recipient_email, subject, snippet, body_text, body_html, date, is_unread, is_starred, labels)
      VALUES (@id, @userId, @threadId, @folder, @senderName, @senderEmail, @recipientEmail, @subject, @snippet, @bodyText, @bodyHtml, @date, @isUnread, @isStarred, @labels)
      ON CONFLICT(id) DO UPDATE SET
        folder = excluded.folder,
        subject = excluded.subject,
        snippet = excluded.snippet,
        body_text = excluded.body_text,
        body_html = excluded.body_html,
        is_unread = excluded.is_unread,
        is_starred = excluded.is_starred,
        labels = excluded.labels
    `);
    stmt.run({
      id: email.id,
      userId,
      threadId: email.threadId,
      folder: email.folder,
      senderName: email.senderName,
      senderEmail: email.senderEmail,
      recipientEmail: email.recipientEmail,
      subject: email.subject,
      snippet: email.snippet,
      bodyText: email.bodyText,
      bodyHtml: email.bodyHtml,
      date: email.date,
      isUnread: email.isUnread ? 1 : 0,
      isStarred: email.isStarred ? 1 : 0,
      labels: JSON.stringify(email.labels || []),
    });
  }

  public upsertEmails(emails: EmailMessage[], userId: string): void {
    const tx = this.db.transaction((items: EmailMessage[]) => {
      for (const item of items) {
        this.upsertEmail(item, userId);
      }
    });
    tx(emails);
  }

  public getEmails(userId: string, params: EmailFilterParams = {}): EmailMessage[] {
    let sql = `SELECT * FROM emails WHERE user_id = ?`;
    const args: any[] = [userId];

    if (params.folder) {
      if (params.folder === 'starred') {
        sql += ` AND is_starred = 1`;
      } else {
        sql += ` AND folder = ?`;
        args.push(params.folder);
      }
    }

    if (params.isUnread !== undefined) {
      sql += ` AND is_unread = ?`;
      args.push(params.isUnread ? 1 : 0);
    }

    if (params.sender) {
      sql += ` AND (sender_email LIKE ? OR sender_name LIKE ?)`;
      args.push(`%${params.sender}%`, `%${params.sender}%`);
    }

    if (params.dateRangeDays && params.dateRangeDays > 0) {
      const cutoff = Date.now() - params.dateRangeDays * 24 * 60 * 60 * 1000;
      sql += ` AND date >= ?`;
      args.push(cutoff);
    }

    if (params.query && params.query.trim()) {
      const q = `%${params.query.trim()}%`;
      sql += ` AND (subject LIKE ? OR sender_name LIKE ? OR sender_email LIKE ? OR snippet LIKE ? OR body_text LIKE ?)`;
      args.push(q, q, q, q, q);
    }

    sql += ` ORDER BY date DESC`;

    if (params.limit) {
      sql += ` LIMIT ?`;
      args.push(params.limit);
      if (params.page && params.page > 1) {
        sql += ` OFFSET ?`;
        args.push((params.page - 1) * params.limit);
      }
    }

    const rows = this.db.prepare(sql).all(...args) as any[];
    return rows.map(this.mapEmailRow);
  }

  public getEmailById(id: string, userId: string): EmailMessage | null {
    const row = this.db.prepare(`SELECT * FROM emails WHERE id = ? AND user_id = ?`).get(id, userId) as any;
    if (!row) return null;
    return this.mapEmailRow(row);
  }

  public getThread(threadId: string, userId: string): EmailMessage[] {
    const rows = this.db.prepare(`SELECT * FROM emails WHERE thread_id = ? AND user_id = ? ORDER BY date ASC`).all(threadId, userId) as any[];
    return rows.map(this.mapEmailRow);
  }

  public updateEmailStatus(id: string, userId: string, updates: { isUnread?: boolean; isStarred?: boolean; folder?: string }): boolean {
    const fields: string[] = [];
    const args: any[] = [];

    if (updates.isUnread !== undefined) {
      fields.push(`is_unread = ?`);
      args.push(updates.isUnread ? 1 : 0);
    }
    if (updates.isStarred !== undefined) {
      fields.push(`is_starred = ?`);
      args.push(updates.isStarred ? 1 : 0);
    }
    if (updates.folder !== undefined) {
      fields.push(`folder = ?`);
      args.push(updates.folder);
    }

    if (fields.length === 0) return false;

    args.push(id, userId);
    const result = this.db.prepare(`UPDATE emails SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...args);
    return result.changes > 0;
  }

  public getStats(userId: string): { inboxCount: number; unreadCount: number; sentCount: number; starredCount: number } {
    const inbox = this.db.prepare(`SELECT COUNT(*) as c FROM emails WHERE user_id = ? AND folder = 'inbox'`).get(userId) as any;
    const unread = this.db.prepare(`SELECT COUNT(*) as c FROM emails WHERE user_id = ? AND folder = 'inbox' AND is_unread = 1`).get(userId) as any;
    const sent = this.db.prepare(`SELECT COUNT(*) as c FROM emails WHERE user_id = ? AND folder = 'sent'`).get(userId) as any;
    const starred = this.db.prepare(`SELECT COUNT(*) as c FROM emails WHERE user_id = ? AND is_starred = 1`).get(userId) as any;

    return {
      inboxCount: inbox?.c || 0,
      unreadCount: unread?.c || 0,
      sentCount: sent?.c || 0,
      starredCount: starred?.c || 0,
    };
  }

  public saveAiMessage(userId: string, role: 'user' | 'assistant', content: string, actions?: any): void {
    this.db.prepare(`
      INSERT INTO ai_messages (id, user_id, role, content, actions_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      role,
      content,
      actions ? JSON.stringify(actions) : null
    );
  }

  public getAiMessages(userId: string, limit: number = 20): Array<{ role: 'user' | 'assistant'; content: string; actions?: any; created_at: string }> {
    const rows = this.db.prepare(`
      SELECT role, content, actions_json, created_at FROM ai_messages
      WHERE user_id = ? ORDER BY created_at ASC LIMIT ?
    `).all(userId, limit) as any[];

    return rows.map(r => ({
      role: r.role,
      content: r.content,
      actions: r.actions_json ? JSON.parse(r.actions_json) : undefined,
      created_at: r.created_at,
    }));
  }

  private mapEmailRow(row: any): EmailMessage {
    let labels: string[] = [];
    try {
      labels = JSON.parse(row.labels || '[]');
    } catch {
      labels = [];
    }
    return {
      id: row.id,
      threadId: row.thread_id,
      folder: row.folder,
      senderName: row.sender_name || row.sender_email,
      senderEmail: row.sender_email,
      recipientEmail: row.recipient_email,
      subject: row.subject || '(No Subject)',
      snippet: row.snippet || '',
      bodyText: row.body_text || '',
      bodyHtml: row.body_html || '',
      date: row.date,
      isUnread: Boolean(row.is_unread),
      isStarred: Boolean(row.is_starred),
      labels,
    };
  }

  private seedDemoDataIfEmpty() {
    const demoUser: UserAccount = {
      id: 'demo_user_nebula',
      email: 'alex.developer@example.com',
      displayName: 'Alex Developer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    };
    this.upsertUser(demoUser);

    const count = this.db.prepare(`SELECT COUNT(*) as c FROM emails WHERE user_id = ?`).get(demoUser.id) as any;
    if (count && count.c > 0) return;

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const demoEmails: EmailMessage[] = [
      {
        id: 'msg_david_01',
        threadId: 'thread_david_roadmap',
        folder: 'inbox',
        senderName: 'David Miller',
        senderEmail: 'david@techcorp.io',
        recipientEmail: 'alex.developer@example.com',
        subject: 'Q3 Roadmap & Architecture Review',
        snippet: 'Hey Alex, attached is the updated Q3 engineering roadmap. Let me know when you have 15 mins to review the AI pipeline architecture.',
        bodyText: "Hey Alex,\n\nI updated our Q3 engineering roadmap to prioritize the AI co-pilot and real-time synchronization layers. Let's make sure our UI action dispatch protocol is fully covered.\n\nCould we meet tomorrow at 3pm to review the architecture?\n\nBest,\nDavid",
        bodyHtml: "<p>Hey Alex,</p><p>I updated our Q3 engineering roadmap to prioritize the AI co-pilot and real-time synchronization layers. Let's make sure our UI action dispatch protocol is fully covered.</p><p>Could we meet tomorrow at 3pm to review the architecture?</p><p>Best,<br><strong>David Miller</strong><br>VP of Engineering</p>",
        date: now - 1 * 60 * 60 * 1000, // 1 hour ago
        isUnread: true,
        isStarred: true,
        labels: ['INBOX', 'IMPORTANT', 'UNREAD'],
      },
      {
        id: 'msg_sarah_01',
        threadId: 'thread_sarah_project',
        folder: 'inbox',
        senderName: 'Sarah Jenkins',
        senderEmail: 'sarah.j@knowlab.org',
        recipientEmail: 'alex.developer@example.com',
        subject: 'Project Update: Design System & UX components',
        snippet: 'Hi Alex, the design system updates for dark mode and the AI assistant panel are ready in Figma. Check out the token variables.',
        bodyText: "Hi Alex,\n\nThe new design tokens for the mail app are finalized! We gave special attention to the animated compose modal and interactive chips in the assistant panel.\n\nPlease take a look at the attached Figma link and let me know if you need any SVGs or icons exported.\n\nCheers,\nSarah",
        bodyHtml: "<p>Hi Alex,</p><p>The new design tokens for the mail app are finalized! We gave special attention to the animated compose modal and interactive chips in the assistant panel.</p><p>Please take a look at the Figma link and let me know if you need any SVGs or icons exported.</p><p>Cheers,<br>Sarah Jenkins</p>",
        date: now - 3 * day, // 3 days ago
        isUnread: false,
        isStarred: false,
        labels: ['INBOX'],
      },
      {
        id: 'msg_john_01',
        threadId: 'thread_john_sync',
        folder: 'inbox',
        senderName: 'John Edwards',
        senderEmail: 'john@example.com',
        recipientEmail: 'alex.developer@example.com',
        subject: 'Meeting Tomorrow: Product Strategy',
        snippet: 'Looking forward to our sync tomorrow at 3pm. Let me know if the agenda needs any adjustments.',
        bodyText: "Alex,\n\nConfirming our session for tomorrow. We'll be walking through user feedback on the natural language UI controls.\n\nSee you then,\nJohn",
        bodyHtml: "<p>Alex,</p><p>Confirming our session for tomorrow. We'll be walking through user feedback on the natural language UI controls.</p><p>See you then,<br>John</p>",
        date: now - 5 * day, // 5 days ago
        isUnread: false,
        isStarred: false,
        labels: ['INBOX'],
      },
      {
        id: 'msg_github_01',
        threadId: 'thread_github_pr',
        folder: 'inbox',
        senderName: 'GitHub Notifications',
        senderEmail: 'notifications@github.com',
        recipientEmail: 'alex.developer@example.com',
        subject: '[PR #42] Merge: Implement Gemini tool calling & action dispatch',
        snippet: 'Pull request #42 was successfully reviewed and approved by Aswath363 and akshaiP.',
        bodyText: "Pull request #42: 'Implement Gemini tool calling & action dispatch' has been approved and merged into main.\n\nCollaborators: Aswath363, akshaiP, ashwanthnebula",
        bodyHtml: "<p>Pull request <strong>#42</strong>: <em>Implement Gemini tool calling & action dispatch</em> has been approved and merged into main.</p><p>Collaborators: <code>Aswath363</code>, <code>akshaiP</code>, <code>ashwanthnebula</code></p>",
        date: now - 7 * day, // 7 days ago
        isUnread: true,
        isStarred: true,
        labels: ['INBOX', 'UNREAD'],
      },
      {
        id: 'msg_elena_01',
        threadId: 'thread_elena_ai',
        folder: 'inbox',
        senderName: 'Dr. Elena Rostova',
        senderEmail: 'elena.rostova@ai-research.edu',
        recipientEmail: 'alex.developer@example.com',
        subject: 'Paper preprint: Programmatic UI Manipulation via LLM Function Calling',
        snippet: 'Dear Alex, here is our draft on how agentic assistants can directly paint UIs and automate complex multi-turn workflows.',
        bodyText: "Dear Alex,\n\nWe just finalized the preprint comparing text-only chatbots with interface-controlling agents. The evaluation showed a 78% increase in task completion speed when LLMs drive form fills and navigation directly.\n\nBest regards,\nElena",
        bodyHtml: "<p>Dear Alex,</p><p>We just finalized the preprint comparing text-only chatbots with interface-controlling agents. The evaluation showed a <strong>78% increase in task completion speed</strong> when LLMs drive form fills and navigation directly.</p><p>Best regards,<br>Elena",
        date: now - 9 * day, // 9 days ago
        isUnread: false,
        isStarred: false,
        labels: ['INBOX'],
      },
      {
        id: 'msg_sent_01',
        threadId: 'thread_david_roadmap',
        folder: 'sent',
        senderName: 'Alex Developer',
        senderEmail: 'alex.developer@example.com',
        recipientEmail: 'david@techcorp.io',
        subject: 'Re: Q3 Roadmap & Architecture Review',
        snippet: 'Thanks David. 3pm tomorrow works well for me. I will prepare the UI action flow diagram.',
        bodyText: "David,\n\nSounds great! 3pm tomorrow works well. I'll walk through the SSE sync engine and how the assistant pre-fills forms with visual feedback.\n\nCheers,\nAlex",
        bodyHtml: "<p>David,</p><p>Sounds great! 3pm tomorrow works well. I'll walk through the SSE sync engine and how the assistant pre-fills forms with visual feedback.</p><p>Cheers,<br>Alex</p>",
        date: now - 30 * 60 * 1000, // 30 mins ago
        isUnread: false,
        isStarred: false,
        labels: ['SENT'],
      }
    ];

    this.upsertEmails(demoEmails, demoUser.id);
  }
}

export const db = new AppDatabase();
