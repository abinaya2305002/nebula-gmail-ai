import { EmailMessage } from '../types/index.js';

export class EmailParser {
  /**
   * Decodes a URL-safe Base64 string to utf-8 text
   */
  public static decodeBase64Url(base64UrlStr: string): string {
    if (!base64UrlStr) return '';
    try {
      const base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(base64, 'base64').toString('utf8');
    } catch {
      return '';
    }
  }

  /**
   * Encodes a string to URL-safe Base64
   */
  public static encodeBase64Url(str: string): string {
    return Buffer.from(str, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Builds an RFC822 compliant MIME message string and encodes it in base64url
   */
  public static createMimeMessage(params: {
    from: string;
    to: string;
    subject: string;
    body: string;
    inReplyTo?: string;
    references?: string;
  }): string {
    const lines: string[] = [
      `From: ${params.from}`,
      `To: ${params.to}`,
      `Subject: =?utf-8?B?${Buffer.from(params.subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
    ];

    if (params.inReplyTo) {
      lines.push(`In-Reply-To: ${params.inReplyTo}`);
    }
    if (params.references) {
      lines.push(`References: ${params.references}`);
    }

    lines.push('');
    // Ensure newlines are formatted as HTML if not already HTML
    const htmlBody = params.body.includes('<p>') || params.body.includes('<br>')
      ? params.body
      : params.body.replace(/\n/g, '<br/>');

    lines.push(htmlBody);

    const fullMessage = lines.join('\r\n');
    return this.encodeBase64Url(fullMessage);
  }

  /**
   * Parses Gmail API message resource into an EmailMessage model
   */
  public static parseGmailMessage(rawMessage: any): EmailMessage {
    const id = rawMessage.id;
    const threadId = rawMessage.threadId || id;
    const labelIds: string[] = rawMessage.labelIds || [];

    const headers: Record<string, string> = {};
    if (rawMessage.payload && rawMessage.payload.headers) {
      for (const h of rawMessage.payload.headers) {
        headers[h.name.toLowerCase()] = h.value;
      }
    }

    const fromHeader = headers['from'] || 'Unknown Sender';
    const toHeader = headers['to'] || '';
    const subject = headers['subject'] || '(No Subject)';
    const dateHeader = headers['date'];
    const date = dateHeader ? new Date(dateHeader).getTime() : parseInt(rawMessage.internalDate || Date.now().toString(), 10);

    // Extract Sender Name and Email
    let senderName = fromHeader;
    let senderEmail = fromHeader;
    const emailMatch = fromHeader.match(/<([^>]+)>/);
    if (emailMatch) {
      senderEmail = emailMatch[1];
      senderName = fromHeader.replace(/<[^>]+>/, '').replace(/["']/g, '').trim() || senderEmail;
    }

    // Determine folder
    let folder: EmailMessage['folder'] = 'inbox';
    if (labelIds.includes('SENT')) {
      folder = 'sent';
    } else if (labelIds.includes('TRASH')) {
      folder = 'trash';
    } else if (labelIds.includes('DRAFT')) {
      folder = 'drafts';
    }

    const isUnread = labelIds.includes('UNREAD');
    const isStarred = labelIds.includes('STARRED');

    // Extract Body
    const { text, html } = this.extractBodyParts(rawMessage.payload);

    return {
      id,
      threadId,
      folder,
      senderName,
      senderEmail,
      recipientEmail: toHeader,
      subject,
      snippet: rawMessage.snippet || '',
      bodyText: text || rawMessage.snippet || '',
      bodyHtml: html || text ? `<p>${(text || '').replace(/\n/g, '<br/>')}</p>` : '',
      date,
      isUnread,
      isStarred,
      labels: labelIds,
    };
  }

  private static extractBodyParts(payload: any): { text: string; html: string } {
    let text = '';
    let html = '';

    if (!payload) return { text, html };

    if (payload.body && payload.body.data) {
      const decoded = this.decodeBase64Url(payload.body.data);
      if (payload.mimeType === 'text/html') {
        html = decoded;
      } else {
        text = decoded;
      }
    }

    if (payload.parts && Array.isArray(payload.parts)) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body && part.body.data) {
          text = this.decodeBase64Url(part.body.data);
        } else if (part.mimeType === 'text/html' && part.body && part.body.data) {
          html = this.decodeBase64Url(part.body.data);
        } else if (part.parts) {
          const nested = this.extractBodyParts(part);
          if (!text && nested.text) text = nested.text;
          if (!html && nested.html) html = nested.html;
        }
      }
    }

    return { text, html };
  }
}
