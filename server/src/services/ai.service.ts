import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { config } from '../config.js';
import { UIAction, UIContextSnapshot, AssistantChatResponse } from '../types/index.js';
import { db } from '../db/database.js';

export class AIService {
  private static instance: AIService;
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    if (config.gemini.apiKey) {
      this.aiClient = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    }
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
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
            dateRangeDays: { type: Type.NUMBER, description: 'Number of past days to show (e.g. 7 for past week, 10 for last 10 days)' },
            isUnread: { type: Type.BOOLEAN, description: 'Show only unread emails (true) or read emails (false)' },
            folder: { type: Type.STRING, description: 'Folder to switch to: "inbox", "sent", "starred", "trash"' },
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
            senderQuery: { type: Type.STRING, description: 'Name or email of the sender (e.g. "David")' },
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
      {
        name: 'request_confirmation',
        description: 'Requests user confirmation in the UI before performing sensitive actions like sending an email or trashing.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            actionType: { type: Type.STRING, description: 'Type of action being confirmed' },
            description: { type: Type.STRING, description: 'User-friendly summary of what will happen' },
            payload: { type: Type.OBJECT, description: 'Action payload data' },
          },
          required: ['actionType', 'description'],
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
    // If Gemini API key is configured, use Gemini
    if (this.aiClient) {
      try {
        return await this.processWithGemini(userId, prompt, context);
      } catch (err) {
        console.error('Gemini API call failed, falling back to local action engine:', err);
      }
    }

    // Fallback: Intelligent natural language rule parser for zero-setup execution
    return this.processWithLocalEngine(userId, prompt, context);
  }

  private async processWithGemini(
    userId: string,
    prompt: string,
    context: UIContextSnapshot
  ): Promise<AssistantChatResponse> {
    if (!this.aiClient) throw new Error('AI client not initialized');

    const systemInstruction = `
You are an AI co-pilot that DIRECTLY CONTROLS the email application user interface.
You are NOT just a conversational chatbot — your primary duty is to drive the UI by calling tools.
When the user gives an instruction:
1. To write or send an email: call 'open_compose' or 'fill_compose_fields'. If they say "Send an email to...", open compose pre-filled, and ask if they'd like you to send it or click send.
2. To filter, search, or show emails (e.g. "Show me emails from the last 10 days", "Find emails from Sarah", "Show only unread"): call 'filter_emails'.
3. To open or view a specific email (e.g. "Open the latest email from David"): call 'navigate_to_email'.
4. To reply or forward (e.g. "Reply to this", "Forward to Bob"): use the currently opened email from UI context snapshot and call 'open_compose' with prefilled reply/forward content!
5. To switch views: call 'navigate_folder'.

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

    // Check function calls from candidate
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          responseText += part.text;
        }
        if (part.functionCall) {
          const fn = part.functionCall;
          const args = (fn.args || {}) as Record<string, any>;

          if (fn.name === 'open_compose') {
            actions.push({
              type: 'OPEN_COMPOSE',
              payload: args,
              description: `Opening compose view for ${args.to || 'draft'}`,
            });
            if (args.to && !responseText) {
              responseText = `I've opened the compose window and prepared an email to ${args.to}.`;
            }
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
              payload: {
                actionType: 'SEND_EMAIL',
                data: args,
                prompt: `Send this email to ${args.to} with subject "${args.subject}"?`,
              },
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
            if (!responseText) {
              responseText = `I've drafted the email to ${args.to}. Please review and confirm below to send it.`;
            }
          } else if (fn.name === 'filter_emails') {
            actions.push({
              type: 'FILTER_EMAILS',
              payload: args,
              description: `Filtering emails with criteria: ${JSON.stringify(args)}`,
            });
            if (!responseText) {
              const details: string[] = [];
              if (args.dateRangeDays) details.push(`last ${args.dateRangeDays} days`);
              if (args.sender) details.push(`from "${args.sender}"`);
              if (args.isUnread) details.push('unread only');
              if (args.query) details.push(`matching "${args.query}"`);
              responseText = `I've updated the inbox to show emails ${details.join(', ')}.`;
            }
          } else if (fn.name === 'navigate_to_email') {
            actions.push({
              type: 'NAVIGATE_TO_EMAIL',
              payload: args,
              description: `Navigating to email matching: ${args.senderQuery || args.subjectQuery || args.emailId}`,
            });
            if (!responseText) {
              responseText = `Opening the requested email for you.`;
            }
          } else if (fn.name === 'navigate_folder') {
            actions.push({
              type: 'NAVIGATE_FOLDER',
              payload: args,
              description: `Switching to ${args.folder}`,
            });
            if (!responseText) {
              responseText = `Switched view to ${args.folder}.`;
            }
          }
        }
      }
    }

    if (!responseText) {
      responseText = 'I have updated the interface according to your instruction.';
    }

    db.saveAiMessage(userId, 'user', prompt);
    db.saveAiMessage(userId, 'assistant', responseText, actions);

    return {
      message: responseText,
      actions,
      richContent,
    };
  }

  /**
   * Deterministic local parser ensuring full functionality even before setting an API key
   */
  private processWithLocalEngine(
    userId: string,
    prompt: string,
    context: UIContextSnapshot
  ): AssistantChatResponse {
    const lower = prompt.toLowerCase();
    const actions: UIAction[] = [];
    let message = '';
    let richContent: AssistantChatResponse['richContent'] = undefined;

    // 1. "Send an email to john@example.com with subject 'Meeting Tomorrow' and body 'Let’s meet at 3pm'"
    if (lower.startsWith('send an email to') || lower.startsWith('send email to') || lower.startsWith('compose email to') || lower.startsWith('write an email to')) {
      const emailMatch = prompt.match(/to\s+([^\s,]+@[^\s,]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z]+)/i);
      const subjectMatch = prompt.match(/subject\s+['"]([^'"]+)['"]/i) || prompt.match(/subject\s+([^,]+?)(?:\s+and\s+body|\s+with\s+body|$)/i);
      let to = emailMatch ? emailMatch[1].trim() : 'john@example.com';
      if (!to.includes('@')) {
        to = `${to.toLowerCase()}@example.com`;
      }
      const subject = subjectMatch ? subjectMatch[1].trim() : 'Meeting Tomorrow';
      
      let body = "Let's meet at 3pm";
      const bodyFullMatch = prompt.match(/body\s+['"“‘](.+)['"”’]\s*$/i) || prompt.match(/body\s+['"“‘](.+)$/i) || prompt.match(/body\s+(.+)$/i);
      if (bodyFullMatch) {
        body = bodyFullMatch[1].replace(/^['"“‘]|['"”’]$/g, '').trim();
      }

      // 1. Open compose & visibly fill fields
      actions.push({
        type: 'OPEN_COMPOSE',
        payload: { to, subject, body, mode: 'new' },
        description: `Opening compose view and filling fields for ${to}`,
      });

      // 2. Human in the loop confirmation
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

      message = `I've opened the compose window and filled in the recipient (${to}), subject ("${subject}"), and body. Please review and confirm to send!`;
    }
    // 2. "Reply to this" (context awareness)
    else if (lower.includes('reply to this') || lower === 'reply' || lower.startsWith('reply with')) {
      if (context.activeEmail) {
        const replySubject = context.activeEmail.subject.startsWith('Re:')
          ? context.activeEmail.subject
          : `Re: ${context.activeEmail.subject}`;

        let draftedBody = "Thanks for the update. Sounds good to me, let's proceed!";
        if (lower.includes('reply with')) {
          const customReply = prompt.replace(/.*reply with\s*['"]?([^'"]+)['"]?/i, '$1');
          if (customReply) draftedBody = customReply;
        }

        actions.push({
          type: 'OPEN_COMPOSE',
          payload: {
            to: context.activeEmail.from,
            subject: replySubject,
            body: draftedBody,
            mode: 'reply',
            replyToEmailId: context.activeEmail.id,
            threadId: context.activeEmail.threadId,
          },
          description: `Opening reply draft to ${context.activeEmail.from}`,
        });

        message = `I've prepared a reply to ${context.activeEmail.from} for "${replySubject}" with the compose window opened.`;
      } else {
        message = `Please select or open an email first so I know which email to reply to!`;
      }
    }
    // 3. "Show me emails from the last 10 days" / "Show emails from last X days"
    else if (lower.includes('last') && (lower.includes('day') || lower.includes('days') || lower.includes('week'))) {
      let days = 10;
      const daysMatch = lower.match(/last\s+(\d+)\s+days?/);
      if (daysMatch) {
        days = parseInt(daysMatch[1], 10);
      } else if (lower.includes('week')) {
        days = 7;
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

      message = `I've updated the main inbox to show emails from the last ${days} days${isUnread ? ' (unread only)' : ''}.`;
    }
    // 4. "Show only unread emails" / "Show unread emails from this week"
    else if (lower.includes('unread')) {
      const days = lower.includes('week') ? 7 : (lower.includes('month') ? 30 : undefined);
      actions.push({
        type: 'FILTER_EMAILS',
        payload: {
          isUnread: true,
          dateRangeDays: days,
          folder: 'inbox',
        },
        description: 'Filtering inbox for unread emails',
      });
      message = `Filtered the inbox to show only unread emails${days ? ` from the last ${days} days` : ''}.`;
    }
    // 5. "Find the email from Sarah about the project update" / "Search for..."
    else if (lower.includes('find') || lower.includes('search')) {
      let sender = '';
      let query = '';

      const fromMatch = prompt.match(/from\s+([a-zA-Z0-9@._-]+)/i);
      if (fromMatch) {
        sender = fromMatch[1];
      }

      const aboutMatch = prompt.match(/about\s+(.+)$/i);
      if (aboutMatch) {
        query = aboutMatch[1].replace(/['"]/g, '').trim();
      } else if (!sender) {
        query = prompt.replace(/find\s+(the\s+)?email(s)?\s*(about|with|for)?/i, '').trim();
      }

      actions.push({
        type: 'FILTER_EMAILS',
        payload: {
          sender: sender || undefined,
          query: query || undefined,
          folder: 'inbox',
        },
        description: `Searching emails: sender="${sender}", query="${query}"`,
      });

      message = `I've updated the email list with results for ${sender ? `sender "${sender}"` : ''} ${query ? `matching "${query}"` : ''}.`;
    }
    // 6. "Open the latest email from David" / "Open email from..."
    else if (lower.includes('open') && lower.includes('email')) {
      const senderMatch = prompt.match(/from\s+([a-zA-Z0-9@._-]+)/i);
      const sender = senderMatch ? senderMatch[1] : '';

      actions.push({
        type: 'NAVIGATE_TO_EMAIL',
        payload: {
          senderQuery: sender,
          latest: true,
        },
        description: `Opening latest email from ${sender || 'requested sender'}`,
      });

      message = `Navigating to open the latest email from ${sender || 'the sender'}.`;
    }
    // 7. Navigation: "Go to sent", "Show sent emails", "Go to trash"
    else if (lower.includes('sent')) {
      actions.push({
        type: 'NAVIGATE_FOLDER',
        payload: { folder: 'sent' },
        description: 'Switching to Sent folder',
      });
      message = 'Switched to your Sent folder.';
    } else if (lower.includes('inbox')) {
      actions.push({
        type: 'NAVIGATE_FOLDER',
        payload: { folder: 'inbox' },
        description: 'Switching to Inbox',
      });
      message = 'Switched to your Inbox.';
    }
    // Default fallback
    else {
      message = `I understand your request. You can instruct me to:
- "Send an email to john@example.com with subject 'Meeting' and body 'Hello'"
- "Show emails from the last 10 days"
- "Find the email from Sarah about the project update"
- "Open the latest email from David"
- "Reply to this" (while reading an email)
- "Show only unread emails from this week"`;
    }

    db.saveAiMessage(userId, 'user', prompt);
    db.saveAiMessage(userId, 'assistant', message, actions);

    return {
      message,
      actions,
      richContent,
    };
  }
}

export const aiService = AIService.getInstance();
