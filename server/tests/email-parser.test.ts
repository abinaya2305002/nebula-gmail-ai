import { describe, it, expect } from 'vitest';
import { EmailParser } from '../src/utils/email-parser.js';
import { QueryBuilder } from '../src/utils/query-builder.js';

describe('EmailParser', () => {
  it('should encode and decode base64url correctly', () => {
    const raw = 'Hello World from Nebula KnowLab!';
    const encoded = EmailParser.encodeBase64Url(raw);
    const decoded = EmailParser.decodeBase64Url(encoded);
    expect(decoded).toBe(raw);
  });

  it('should construct valid RFC822 MIME message for sending', () => {
    const mimeBase64 = EmailParser.createMimeMessage({
      from: 'me@example.com',
      to: 'john@example.com',
      subject: 'Meeting Tomorrow',
      body: "Let's meet at 3pm",
    });

    expect(mimeBase64).toBeDefined();
    const decoded = EmailParser.decodeBase64Url(mimeBase64);
    expect(decoded).toContain('To: john@example.com');
    expect(decoded).toContain("Let's meet at 3pm");
  });

  it('should parse Gmail API raw payload into EmailMessage', () => {
    const mockRaw = {
      id: 'msg_12345',
      threadId: 'thread_12345',
      labelIds: ['INBOX', 'UNREAD'],
      snippet: 'Hey Alex, here is the proposal',
      payload: {
        headers: [
          { name: 'From', value: 'David Miller <david@techcorp.io>' },
          { name: 'To', value: 'alex@example.com' },
          { name: 'Subject', value: 'Proposal review' },
          { name: 'Date', value: 'Fri, 04 Sep 2026 10:00:00 GMT' },
        ],
        body: {
          data: EmailParser.encodeBase64Url('Hey Alex, here is the proposal body.'),
        },
      },
    };

    const parsed = EmailParser.parseGmailMessage(mockRaw);
    expect(parsed.id).toBe('msg_12345');
    expect(parsed.senderEmail).toBe('david@techcorp.io');
    expect(parsed.senderName).toBe('David Miller');
    expect(parsed.subject).toBe('Proposal review');
    expect(parsed.isUnread).toBe(true);
    expect(parsed.bodyText).toBe('Hey Alex, here is the proposal body.');
  });
});

describe('QueryBuilder', () => {
  it('should format search queries correctly', () => {
    const q1 = QueryBuilder.toGmailQuery({
      sender: 'David',
      isUnread: true,
      folder: 'inbox',
    });
    expect(q1).toContain('in:inbox');
    expect(q1).toContain('is:unread');
    expect(q1).toContain('from:David');

    const q2 = QueryBuilder.toGmailQuery({
      query: 'project update',
      dateRangeDays: 10,
    });
    expect(q2).toContain('project update');
    expect(q2).toContain('after:');
  });
});
