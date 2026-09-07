import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { config } from '../config.js';
import { UIAction, UIContextSnapshot, AssistantChatResponse, EmailMessage, TimelineStep, CompactEmailPreview } from '../types/index.js';
import { db } from '../db/database.js';

export class AIService {
  private static instance: AIService;
  private aiClient: GoogleGenAI | null = null;
  private customApiKey: string | null = null;

  constructor() {
    if (config.gemini.apiKey && !config.gemini.apiKey.includes('your-gemini-api-key')) {
      this.aiClient = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    }
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public setApiKey(apiKey: string): boolean {
    if (!apiKey || apiKey.trim().length === 0) {
      this.aiClient = null;
      this.customApiKey = null;
      return false;
    }
    this.customApiKey = apiKey.trim();
    this.aiClient = new GoogleGenAI({ apiKey: this.customApiKey });
    return true;
  }

  public hasActiveGemini(): boolean {
    return Boolean(this.aiClient);
  }

  /**
   * Tool definitions for Gemini Function Calling
   */
  private getFunctionDeclarations(): FunctionDeclaration[] {
    return [
      {
        name: 'open_compose',
        description: 'Opens the email compose modal in the UI and pre-populates recipient, subject, and body fields.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            to: { type: Type.STRING, description: 'Recipient email address' },
            subject: { type: Type.STRING, description: 'Subject of the email' },
            body: { type: Type.STRING, description: 'Content/body of the email' },
            mode: { type: Type.STRING, description: 'Mode: "new", "reply", or "forward"' },
            replyToEmailId: { type: Type.STRING, description: 'Optional email ID if replying or forwarding' },
          },
        },
      },
      {
        name: 'fill_compose_fields',
        description: 'Visibly updates or fills specific fields in the currently opened compose form.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            to: { type: Type.STRING, description: 'Recipient email' },
            subject: { type: Type.STRING, description: 'Subject line' },
            body: { type: Type.STRING, description: 'Email message text' },
          },
        },
      },
      {
        name: 'send_email_action',
        description: 'Dispatches or requests confirmation to send an email.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            to: { type: Type.STRING, description: 'Recipient email address' },
            subject: { type: Type.STRING, description: 'Email subject' },
            body: { type: Type.STRING, description: 'Email body text' },
            requireConfirmation: { type: Type.BOOLEAN, description: 'Whether to require human-in-the-loop confirmation before sending' },
          },
          required: ['to', 'subject', 'body'],
        },
      },
      {
        name: 'filter_emails',
        description: 'Applies filter criteria to the main inbox/email list UI.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: 'Search keywords or topic' },
            sender: { type: Type.STRING, description: 'Sender name or email address' },
            dateRangeDays: { type: Type.NUMBER, description: 'Number of past days to show' },
            isUnread: { type: Type.BOOLEAN, description: 'Show only unread emails (true) or read emails (false)' },
            folder: { type: Type.STRING, description: 'Folder: "inbox", "sent", "starred", "trash"' },
            limit: { type: Type.NUMBER, description: 'Limit number of emails to display (e.g. 2 for "need last 2 mail")' },
          },
        },
      },
      {
        name: 'navigate_to_email',
        description: 'Navigates the main UI to open and display a specific email in full detail view.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            emailId: { type: Type.STRING, description: 'Exact email ID if known' },
            senderQuery: { type: Type.STRING, description: 'Name or email of the sender' },
            subjectQuery: { type: Type.STRING, description: 'Keyword or subject of the email' },
            latest: { type: Type.BOOLEAN, description: 'Whether to select the most recent matching email' },
          },
        },
      },
      {
        name: 'navigate_folder',
        description: 'Switches the main view folder in the UI (e.g. inbox, sent, trash, starred).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            folder: { type: Type.STRING, description: 'The folder name: "inbox", "sent", "starred", "trash"' },
          },
          required: ['folder'],
        },
      },
    ];
  }

  /**
   * Main assistant chat method: receives user prompt + UI snapshot context
   */
  public async processChat(
    userId: string,
    prompt: string,
    context: UIContextSnapshot
  ): Promise<AssistantChatResponse> {
    // If Gemini is active and configured with a real key, use Gemini
    if (this.aiClient) {
      try {
        return await this.processWithGemini(userId, prompt, context);
      } catch (err) {
        console.warn('Gemini API call failed, using intelligent local engine:', err);
      }
    }

    // Comprehensive Natural Language Intent Engine: handles ALL user questions!
    return this.processWithLocalEngine(userId, prompt, context);
  }

  private async processWithGemini(
    userId: string,
    prompt: string,
    context: UIContextSnapshot
  ): Promise<AssistantChatResponse> {
    if (!this.aiClient) throw new Error('AI client not initialized');

    const systemInstruction = `
You are an AI co-pilot that DIRECTLY CONTROLS the Google Gmail web application interface.
You are NOT just a chatbot — your primary duty is to drive the UI by calling tools.
Always call tools to update the UI according to what the user asks:
- If user asks for emails (e.g. "need last 2 mail", "show emails from last 10 days", "show unread"): call filter_emails.
- If user wants to write/send: call open_compose or fill_compose_fields.
- If user asks to open or view an email: call navigate_to_email.
- If user asks to reply: call open_compose with mode 'reply'.
- If user asks to view sent, trash, starred: call navigate_folder.

Current UI Context:
${JSON.stringify(context, null, 2)}
`;

    const response = await this.aiClient.models.generateContent({
      model: config.gemini.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: this.getFunctionDeclarations() }],
      },
    });

    const actions: UIAction[] = [];
    let responseText = '';
    let richContent: AssistantChatResponse['richContent'] = undefined;

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) responseText += part.text;
        if (part.functionCall) {
          const fn = part.functionCall;
          const args = (fn.args || {}) as Record<string, any>;

          if (fn.name === 'open_compose') {
            actions.push({
              type: 'OPEN_COMPOSE',
              payload: args,
              description: `Opening compose view for ${args.to || 'draft'}`,
            });
            if (!responseText) responseText = `I've opened the compose window for ${args.to || 'your email'}.`;
          } else if (fn.name === 'fill_compose_fields') {
            actions.push({
              type: 'FILL_COMPOSE',
              payload: args,
              description: 'Populating email fields',
            });
          } else if (fn.name === 'send_email_action') {
            actions.push({
              type: 'OPEN_COMPOSE',
              payload: { to: args.to, subject: args.subject, body: args.body },
            });
            actions.push({
              type: 'REQUEST_CONFIRMATION',
              payload: { actionType: 'SEND_EMAIL', data: args },
            });
            richContent = {
              type: 'confirmation_card',
              data: {
                title: 'Ready to Send Email',
                to: args.to,
                subject: args.subject,
                preview: args.body,
                action: 'SEND_EMAIL',
              },
            };
            if (!responseText) responseText = `I've drafted the email to ${args.to}. Please confirm below to send.`;
          } else if (fn.name === 'filter_emails') {
            actions.push({
              type: 'FILTER_EMAILS',
              payload: args,
              description: `Filtering emails`,
            });
            if (!responseText) responseText = `Updated your inbox with the requested emails.`;
          } else if (fn.name === 'navigate_to_email') {
            actions.push({
              type: 'NAVIGATE_TO_EMAIL',
              payload: args,
              description: `Navigating to email`,
            });
            if (!responseText) responseText = `Opening the requested email for you.`;
          } else if (fn.name === 'navigate_folder') {
            actions.push({
              type: 'NAVIGATE_FOLDER',
              payload: args,
              description: `Switching folder to ${args.folder}`,
            });
            if (!responseText) responseText = `Switched to ${args.folder}.`;
          }
        }
      }
    }

    if (!responseText) {
      responseText = 'I have updated the interface according to your instruction.';
    }

    db.saveAiMessage(userId, 'user', prompt);
    db.saveAiMessage(userId, 'assistant', responseText, actions);

    return { message: responseText, actions, richContent };
  }

  /**
   * Universal Natural Language Engine: handles ANY question or instruction from the user!
   */
  private processWithLocalEngine(
    userId: string,
    prompt: string,
    context: UIContextSnapshot
  ): AssistantChatResponse {
    const raw = prompt.trim();
    const lower = raw.toLowerCase();
    const actions: UIAction[] = [];
    const timeline: TimelineStep[] = [
      { step: `Understood request: "${prompt}"`, status: 'completed' },
    ];
    let message = '';
    let richContent: AssistantChatResponse['richContent'] = undefined;
    let emailPreviews: CompactEmailPreview[] | undefined = undefined;
    let undoAction: UIAction | undefined = undefined;

    // Fetch user's current emails from DB to make context-driven decisions
    const allInboxEmails = db.getEmails(userId, { folder: 'inbox' });
    const allEmails = allInboxEmails;

    const toCompactPreviews = (emails: EmailMessage[]): CompactEmailPreview[] => {
      return emails.map(e => ({
        id: e.id,
        senderName: e.senderName,
        senderEmail: e.senderEmail,
        subject: e.subject,
        snippet: e.snippet,
        date: e.date,
        isUnread: e.isUnread,
      }));
    };

    const parseNumber = (text: string): number | null => {
      const wordMap: Record<string, number> = {
        one: 1, two: 2, three: 3, four: 4, five: 5,
        six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      };
      const numMatch = text.match(/\b(\d+)\b/);
      if (numMatch) return parseInt(numMatch[1], 10);
      for (const [w, val] of Object.entries(wordMap)) {
        if (new RegExp(`\\b${w}\\b`, 'i').test(text)) return val;
      }
      return null;
    };

    // -------------------------------------------------------------
    // 1. QUANTITY / RECENT / LATEST EMAILS INTENT:
    // "show my recent emails", "recent emails", "latest emails", "show last 2 mails",
    // "need last 2 mail", "give me the 2 most recent emails", "show latest 2 mails"
    // -------------------------------------------------------------
    const parsedQty = parseNumber(prompt);
    const mentionsRecent = /\b(recent|latest|newest|last)\b/i.test(lower);
    const mentionsEmails = /\b(mails?|emails?|messages?)\b/i.test(lower);
    const isDateRange = /\b(days?|weeks?|months?|today|yesterday)\b/i.test(lower);
    const hasSenderMention = /\b(from|by|sarah|david|john)\b/i.test(lower);

    const isRecentEmailsIntent =
      !isDateRange &&
      !hasSenderMention &&
      (
        (mentionsRecent && (mentionsEmails || parsedQty !== null || lower.includes('show') || lower.includes('need') || lower.includes('get'))) ||
        (parsedQty !== null && mentionsEmails) ||
        lower === 'emails' ||
        lower === 'my emails' ||
        lower === 'show emails' ||
        lower === 'show my emails' ||
        lower === 'recent emails' ||
        lower === 'show my recent emails' ||
        lower === 'show recent emails' ||
        lower === 'latest emails'
      );

    if (isRecentEmailsIntent) {
      const count = parsedQty !== null ? parsedQty : 5;
      const targetEmails = allInboxEmails.slice(0, count);

      actions.push({
        type: 'FILTER_EMAILS',
        payload: {
          limit: parsedQty !== null ? count : undefined,
          folder: 'inbox',
        },
        description: parsedQty !== null ? `Displaying the last ${count} email(s)` : 'Showing recent emails',
      });

      timeline.push({ step: `Parsed request: limit = ${count}`, status: 'completed' });
      timeline.push({ step: `Queried mailbox for ${count} recent emails`, status: 'completed' });

      undoAction = {
        type: 'FILTER_EMAILS',
        payload: { folder: 'inbox' },
        description: 'Reset inbox filter',
      };

      emailPreviews = toCompactPreviews(targetEmails);
      message = parsedQty !== null
        ? `Here ${count === 1 ? 'is your most recent email' : `are your ${count} most recent emails`}. I've updated your main inbox to show them:`
        : `Here are your recent emails. I've updated your main inbox view:`;
      return this.finalizeResponse(userId, prompt, message, actions, richContent, timeline, undoAction, emailPreviews);
    }

    // -------------------------------------------------------------
    // 2. COMPOSE & SEND INTENT:
    // "send an email to john@example.com with subject 'Meeting' and body '...'"
    // "compose to..." / "write email to..." / "draft email to..."
    // -------------------------------------------------------------
    if (
      lower.startsWith('send an email') ||
      lower.startsWith('send email') ||
      lower.startsWith('compose') ||
      lower.startsWith('write an email') ||
      lower.startsWith('write email') ||
      lower.startsWith('email to') ||
      lower.startsWith('draft email') ||
      lower.startsWith('draft an email')
    ) {
      const emailMatch = prompt.match(/to\s+([^\s,]+@[^\s,]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z]+)/i);
      const subjectMatch = prompt.match(/subject\s+['"“‘]([^'"”’]+)['"”’]/i) || prompt.match(/subject\s+([^,]+?)(?:\s+and\s+body|\s+with\s+body|$)/i);

      let to = emailMatch ? emailMatch[1].trim() : 'john@example.com';
      if (!to.includes('@')) to = `${to.toLowerCase()}@example.com`;
      const subject = subjectMatch ? subjectMatch[1].trim() : 'Meeting Tomorrow';

      let body = "Let's meet at 3pm";
      const bodyFullMatch = prompt.match(/body\s+['"“‘](.+)['"”’]\s*$/i) || prompt.match(/body\s+['"“‘](.+)$/i) || prompt.match(/body\s+(.+)$/i);
      if (bodyFullMatch) {
        body = bodyFullMatch[1].replace(/^['"“‘]|['"”’]$/g, '').trim();
      }

      actions.push({
        type: 'OPEN_COMPOSE',
        payload: { to, subject, body, mode: 'new' },
        description: `Opening compose view and filling fields for ${to}`,
      });

      actions.push({
        type: 'REQUEST_CONFIRMATION',
        payload: {
          actionType: 'SEND_EMAIL',
          data: { to, subject, body },
          prompt: `Would you like me to send this email to ${to}?`,
        },
      });

      richContent = {
        type: 'confirmation_card',
        data: {
          title: 'Ready to Send Email',
          to,
          subject,
          preview: body,
          action: 'SEND_EMAIL',
        },
      };

      undoAction = {
        type: 'CLOSE_COMPOSE',
        payload: {},
        description: 'Discard draft and close compose',
      };

      message = `I've opened the compose window and populated the recipient (${to}), subject ("${subject}"), and body. Please review and confirm below to send!`;
      return this.finalizeResponse(userId, prompt, message, actions, richContent, timeline, undoAction);
    }

    // -------------------------------------------------------------
    // 3. CONTEXT-AWARE REPLY:
    // "reply to this", "reply", "respond", "reply saying thanks"
    // -------------------------------------------------------------
    if (lower.startsWith('reply') || lower.startsWith('respond') || lower.includes('reply to this') || lower.includes('reply saying') || lower.includes('reply with')) {
      const target = context.activeEmail || (allEmails.length > 0 ? {
        id: allEmails[0].id,
        from: allEmails[0].senderEmail,
        subject: allEmails[0].subject,
        threadId: allEmails[0].threadId,
        snippet: allEmails[0].snippet,
      } : null);

      if (target) {
        const replySubject = target.subject.startsWith('Re:') ? target.subject : `Re: ${target.subject}`;
        let draftedBody = "Thanks for the update. Sounds good to me, let's proceed!";
        if (lower.includes('saying') || lower.includes('reply with')) {
          const custom = prompt.replace(/.*(?:saying|reply\s+with)\s*['"“‘]?([^'"”’]+)['"”’]?/i, '$1').trim();
          if (custom && custom !== prompt) draftedBody = custom;
        }

        actions.push({
          type: 'OPEN_COMPOSE',
          payload: {
            to: target.from,
            subject: replySubject,
            body: draftedBody,
            mode: 'reply',
            replyToEmailId: target.id,
            threadId: target.threadId,
          },
          description: `Opening reply draft to ${target.from}`,
        });

        undoAction = {
          type: 'CLOSE_COMPOSE',
          payload: {},
          description: 'Close reply draft',
        };

        const targetEmailObj = allEmails.find(e => e.id === target.id);
        if (targetEmailObj) {
          emailPreviews = toCompactPreviews([targetEmailObj]);
        }

        message = `I've prepared a reply to ${target.from} for "${replySubject}" with the compose window opened.`;
      } else {
        message = `Please select an email first so I can prepare your reply.`;
      }
      return this.finalizeResponse(userId, prompt, message, actions, richContent, timeline, undoAction, emailPreviews);
    }

    // -------------------------------------------------------------
    // 4. NAVIGATE & OPEN SPECIFIC EMAIL:
    // "open latest email from David", "open david's latest email", "open email from Sarah"
    // -------------------------------------------------------------
    const isOpenEmailIntent =
      (/\b(open|read|view)\b/i.test(lower) && !lower.includes('unread')) &&
      (mentionsEmails || lower.includes('from') || lower.includes('david') || lower.includes('sarah') || lower.includes('latest'));

    if (isOpenEmailIntent) {
      let sender = '';
      const fromMatch = prompt.match(/(?:from|by)\s+([a-zA-Z0-9@._-]+)/i);
      if (fromMatch) {
        sender = fromMatch[1];
      } else {
        const directName = prompt.match(/\b(david|sarah|john|alice|github)\b/i);
        if (directName) sender = directName[1];
      }

      const subjectTerm = !sender ? prompt.replace(/open|read|view|the|email|mail|message|latest/gi, '').trim() : undefined;

      actions.push({
        type: 'NAVIGATE_TO_EMAIL',
        payload: {
          senderQuery: sender || undefined,
          subjectQuery: subjectTerm || undefined,
          latest: true,
        },
        description: `Opening email matching: ${sender || prompt}`,
      });

      const matchedEmail = allEmails.find(e => {
        if (sender && (e.senderName.toLowerCase().includes(sender.toLowerCase()) || e.senderEmail.toLowerCase().includes(sender.toLowerCase()))) return true;
        if (subjectTerm && (e.subject.toLowerCase().includes(subjectTerm.toLowerCase()) || e.snippet.toLowerCase().includes(subjectTerm.toLowerCase()))) return true;
        return false;
      }) || (allEmails.length > 0 ? allEmails[0] : null);

      undoAction = {
        type: 'NAVIGATE_FOLDER',
        payload: { folder: 'inbox' },
        description: 'Return to Inbox',
      };

      if (matchedEmail) {
        emailPreviews = toCompactPreviews([matchedEmail]);
      }

      message = `Navigating to open the latest email${sender ? ` from ${sender}` : ''}.`;
      return this.finalizeResponse(userId, prompt, message, actions, richContent, timeline, undoAction, emailPreviews);
    }

    // -------------------------------------------------------------
    // 5. SEARCH & FIND BY SENDER OR TOPIC:
    // "find the email from Sarah about the project update", "show sarah's emails",
    // "emails from david", "find sarah's project update"
    // -------------------------------------------------------------
    const hasSenderExtract =
      prompt.match(/(?:from|by)\s+([a-zA-Z0-9@._-]+)/i) ||
      prompt.match(/\b(sarah|david|john|alice|github)(?:'s)?\b/i);

    const isSearchIntent =
      lower.startsWith('find') ||
      lower.startsWith('search') ||
      lower.includes('about') ||
      hasSenderExtract !== null;

    if (isSearchIntent && !lower.includes('unread') && !isDateRange) {
      let sender = '';
      let query = '';

      const fromMatch = prompt.match(/(?:from|by)\s+([a-zA-Z0-9@._-]+)/i);
      if (fromMatch) {
        sender = fromMatch[1];
      } else if (hasSenderExtract) {
        sender = hasSenderExtract[1];
      }

      const aboutMatch = prompt.match(/about\s+(.+)$/i);
      if (aboutMatch) {
        query = aboutMatch[1].replace(/['"“”]/g, '').trim();
      } else {
        let stripped = prompt
          .replace(new RegExp(`\\b${sender}(?:'s)?\\b`, 'gi'), '')
          .replace(/\b(?:find|search|show|get|need|display|the|emails?|mails?|messages?|about|with|for|from|by|of)\b/gi, '')
          .replace(/['"“”]/g, '')
          .trim();
        if (stripped.length > 1) query = stripped;
      }

      actions.push({
        type: 'FILTER_EMAILS',
        payload: {
          sender: sender || undefined,
          query: query || undefined,
          folder: 'inbox',
        },
        description: `Searching emails: ${[sender && `sender="${sender}"`, query && `query="${query}"`].filter(Boolean).join(', ')}`,
      });

      const matchedEmails = allEmails.filter(e => {
        if (sender && !e.senderName.toLowerCase().includes(sender.toLowerCase()) && !e.senderEmail.toLowerCase().includes(sender.toLowerCase())) return false;
        if (query && !e.subject.toLowerCase().includes(query.toLowerCase()) && !e.snippet.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      });

      undoAction = {
        type: 'FILTER_EMAILS',
        payload: { folder: 'inbox' },
        description: 'Reset search filter',
      };

      emailPreviews = toCompactPreviews(matchedEmails.slice(0, 4));
      if (sender && query) {
        message = `Here are the emails from ${sender} regarding "${query}".`;
      } else if (sender) {
        message = `Here are the emails from ${sender}.`;
      } else {
        message = `Here are the emails matching "${query}".`;
      }
      return this.finalizeResponse(userId, prompt, message, actions, richContent, timeline, undoAction, emailPreviews);
    }

    // -------------------------------------------------------------
    // 6. DATE RANGE FILTER:
    // "show me emails from the last 10 days", "last 7 days", "emails from this week"
    // -------------------------------------------------------------
    if (isDateRange) {
      let days = 10;
      const daysMatch = lower.match(/(?:last|past)\s+(\d+)\s+days?/i);
      if (daysMatch) {
        days = parseInt(daysMatch[1], 10);
      } else if (lower.includes('week')) {
        days = 7;
      } else if (lower.includes('month')) {
        days = 30;
      } else if (lower.includes('today')) {
        days = 1;
      }

      const isUnread = lower.includes('unread');

      actions.push({
        type: 'FILTER_EMAILS',
        payload: {
          dateRangeDays: days,
          isUnread: isUnread ? true : undefined,
          folder: 'inbox',
        },
        description: `Filtering inbox to emails from the last ${days} days`,
      });

      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const matched = allEmails.filter(e => e.date >= cutoff && (!isUnread || e.isUnread));

      undoAction = {
        type: 'FILTER_EMAILS',
        payload: { folder: 'inbox' },
        description: 'Reset date filter',
      };

      emailPreviews = toCompactPreviews(matched.slice(0, 4));
      message = `I've updated the main inbox to show emails from the last ${days} days${isUnread ? ' (unread only)' : ''}.`;
      return this.finalizeResponse(userId, prompt, message, actions, richContent, timeline, undoAction, emailPreviews);
    }

    // -------------------------------------------------------------
    // 7. UNREAD / STARRED FILTER:
    // "show only unread emails", "unread", "starred emails"
    // -------------------------------------------------------------
    if (lower.includes('unread')) {
      actions.push({
        type: 'FILTER_EMAILS',
        payload: { isUnread: true, folder: 'inbox' },
        description: 'Filtering inbox for unread emails',
      });

      const unreadList = allEmails.filter(e => e.isUnread);

      undoAction = {
        type: 'FILTER_EMAILS',
        payload: { folder: 'inbox' },
        description: 'Show all inbox emails',
      };

      emailPreviews = toCompactPreviews(unreadList.slice(0, 4));
      message = `I've filtered the inbox UI to display only your unread emails.`;
      return this.finalizeResponse(userId, prompt, message, actions, richContent, timeline, undoAction, emailPreviews);
    }

    if (lower.includes('starred')) {
      actions.push({
        type: 'NAVIGATE_FOLDER',
        payload: { folder: 'starred' },
        description: 'Showing starred emails',
      });
      undoAction = {
        type: 'NAVIGATE_FOLDER',
        payload: { folder: 'inbox' },
        description: 'Return to Inbox',
      };
      message = `Switched view to your Starred emails.`;
      return this.finalizeResponse(userId, prompt, message, actions, richContent, timeline, undoAction);
    }

    // -------------------------------------------------------------
    // 8. FOLDER NAVIGATION:
    // "sent", "inbox", "trash", "drafts"
    // -------------------------------------------------------------
    if (lower.includes('sent')) {
      actions.push({ type: 'NAVIGATE_FOLDER', payload: { folder: 'sent' } });
      undoAction = { type: 'NAVIGATE_FOLDER', payload: { folder: 'inbox' }, description: 'Return to Inbox' };
      message = 'Switched to your Sent folder.';
      return this.finalizeResponse(userId, prompt, message, actions, richContent, timeline, undoAction);
    }
    if (lower.includes('trash') || lower.includes('deleted')) {
      actions.push({ type: 'NAVIGATE_FOLDER', payload: { folder: 'trash' } });
      undoAction = { type: 'NAVIGATE_FOLDER', payload: { folder: 'inbox' }, description: 'Return to Inbox' };
      message = 'Switched to your Trash folder.';
      return this.finalizeResponse(userId, prompt, message, actions, richContent, timeline, undoAction);
    }
    if (lower === 'inbox' || lower.includes('go to inbox') || lower.includes('show inbox')) {
      actions.push({ type: 'NAVIGATE_FOLDER', payload: { folder: 'inbox' } });
      message = 'Switched to your Inbox.';
      return this.finalizeResponse(userId, prompt, message, actions, richContent, timeline);
    }

    // -------------------------------------------------------------
    // 9. QUESTIONS ABOUT MAILBOX:
    // "how many emails?", "how many unread?", "who sent emails?"
    // -------------------------------------------------------------
    if (lower.includes('how many') || lower.includes('count') || lower.includes('who sent') || lower.includes('summary')) {
      const stats = db.getStats(userId);
      const sendersList = Array.from(new Set(allEmails.map(e => e.senderName))).slice(0, 5).join(', ');
      message = `You currently have **${stats.inboxCount}** emails in your inbox, with **${stats.unreadCount}** unread.\n\nRecent senders: ${sendersList}.`;
      return this.finalizeResponse(userId, prompt, message, actions, richContent, timeline);
    }

    // -------------------------------------------------------------
    // 10. UNIVERSAL INTENT (ANY OTHER QUESTION / PHRASE):
    // "meeting", "roadmap", or ANY query! Live search and update UI!
    // -------------------------------------------------------------
    let cleanQuery = prompt
      .replace(/(?:find|search|show|get|need|display|look\s+for|the|emails?|mails?|messages?|about|with|for)\s+/gi, ' ')
      .trim();

    // Check if the query matches a known sender name in the database
    const senderCandidate = allEmails.find(e =>
      cleanQuery.length > 1 &&
      (e.senderName.toLowerCase().includes(cleanQuery.toLowerCase()) ||
       e.senderEmail.toLowerCase().includes(cleanQuery.toLowerCase()))
    );

    if (senderCandidate) {
      actions.push({
        type: 'FILTER_EMAILS',
        payload: { sender: senderCandidate.senderName, folder: 'inbox' },
        description: `Filtering emails from ${senderCandidate.senderName}`,
      });
      const matched = allEmails.filter(e => e.senderName.toLowerCase().includes(senderCandidate.senderName.toLowerCase()));

      undoAction = {
        type: 'FILTER_EMAILS',
        payload: { folder: 'inbox' },
        description: 'Reset sender filter',
      };
      emailPreviews = toCompactPreviews(matched.slice(0, 4));
      message = `I've updated the main inbox to show emails from **${senderCandidate.senderName}**.`;
    } else {
      const searchTerm = cleanQuery || prompt.trim();
      actions.push({
        type: 'FILTER_EMAILS',
        payload: { query: searchTerm, folder: 'inbox' },
        description: `Searching emails matching "${searchTerm}"`,
      });
      const matched = allEmails.filter(e =>
        e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.snippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.senderName.toLowerCase().includes(searchTerm.toLowerCase())
      );

      undoAction = {
        type: 'FILTER_EMAILS',
        payload: { folder: 'inbox' },
        description: 'Reset search filter',
      };
      emailPreviews = toCompactPreviews(matched.slice(0, 4));
      message = `I've updated the inbox UI with emails matching **"${searchTerm}"**.`;
    }

    return this.finalizeResponse(userId, prompt, message, actions, richContent, timeline, undoAction, emailPreviews);
  }

  private finalizeResponse(
    userId: string,
    prompt: string,
    message: string,
    actions: UIAction[],
    richContent?: any,
    timeline?: TimelineStep[],
    undoAction?: UIAction,
    emailPreviews?: CompactEmailPreview[]
  ): AssistantChatResponse {
    db.saveAiMessage(userId, 'user', prompt);
    db.saveAiMessage(userId, 'assistant', message, actions);
    return { message, actions, richContent, timeline, undoAction, emailPreviews };
  }
}

export const aiService = AIService.getInstance();
