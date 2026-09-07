import { describe, it, expect } from 'vitest';
import { aiService } from '../src/services/ai.service.js';
import { UIContextSnapshot } from '../src/types/index.js';

describe('AIService UI Action Generation', () => {
  const defaultContext: UIContextSnapshot = {
    currentView: 'inbox',
    composeState: { isOpen: false },
    currentFilters: { folder: 'inbox' },
  };

  it('should generate OPEN_COMPOSE and confirmation for "Send an email to john@example.com..."', async () => {
    const prompt = "Send an email to john@example.com with subject 'Meeting Tomorrow' and body 'Let’s meet at 3pm'";
    const res = await aiService.processChat('test_user', prompt, defaultContext);

    expect(res.actions.length).toBeGreaterThan(0);
    const composeAction = res.actions.find(a => a.type === 'OPEN_COMPOSE');
    expect(composeAction).toBeDefined();
    expect(composeAction?.payload.to).toBe('john@example.com');
    expect(composeAction?.payload.subject).toBe('Meeting Tomorrow');
    expect(composeAction?.payload.body).toContain('3pm');

    // Verify confirmation card is also generated (bonus: human-in-the-loop)
    const confirmAction = res.actions.find(a => a.type === 'REQUEST_CONFIRMATION');
    expect(confirmAction).toBeDefined();
  });

  it('should generate FILTER_EMAILS with dateRangeDays for "Show me emails from the last 10 days"', async () => {
    const prompt = 'Show me emails from the last 10 days';
    const res = await aiService.processChat('test_user', prompt, defaultContext);

    const filterAction = res.actions.find(a => a.type === 'FILTER_EMAILS');
    expect(filterAction).toBeDefined();
    expect(filterAction?.payload.dateRangeDays).toBe(10);
  });

  it('should generate FILTER_EMAILS for "Find the email from Sarah about the project update"', async () => {
    const prompt = 'Find the email from Sarah about the project update';
    const res = await aiService.processChat('test_user', prompt, defaultContext);

    const filterAction = res.actions.find(a => a.type === 'FILTER_EMAILS');
    expect(filterAction).toBeDefined();
    expect(filterAction?.payload.sender?.toLowerCase()).toContain('sarah');
    expect(filterAction?.payload.query?.toLowerCase()).toContain('project update');
  });

  it('should generate NAVIGATE_TO_EMAIL for "Open the latest email from David"', async () => {
    const prompt = 'Open the latest email from David';
    const res = await aiService.processChat('test_user', prompt, defaultContext);

    const navAction = res.actions.find(a => a.type === 'NAVIGATE_TO_EMAIL');
    expect(navAction).toBeDefined();
    expect(navAction?.payload.senderQuery?.toLowerCase()).toContain('david');
    expect(navAction?.payload.latest).toBe(true);
  });

  it('should use current active email context for "Reply to this"', async () => {
    const contextWithOpenEmail: UIContextSnapshot = {
      currentView: 'detail',
      activeEmailId: 'msg_david_01',
      activeEmail: {
        id: 'msg_david_01',
        from: 'david@techcorp.io',
        to: 'abinaya@example.com',
        subject: 'Q3 Roadmap Review',
        snippet: 'Let us meet tomorrow',
        body: 'Can we meet at 3pm?',
        date: new Date().toISOString(),
        threadId: 'thread_david_roadmap',
      },
      composeState: { isOpen: false },
      currentFilters: { folder: 'inbox' },
    };

    const prompt = 'Reply to this';
    const res = await aiService.processChat('test_user', prompt, contextWithOpenEmail);

    const composeAction = res.actions.find(a => a.type === 'OPEN_COMPOSE');
    expect(composeAction).toBeDefined();
    expect(composeAction?.payload.to).toBe('david@techcorp.io');
    expect(composeAction?.payload.subject).toContain('Q3 Roadmap Review');
    expect(composeAction?.payload.mode).toBe('reply');
    expect(composeAction?.payload.replyToEmailId).toBe('msg_david_01');
  });

  it('should generate FILTER_EMAILS for "Show only unread emails from this week"', async () => {
    const prompt = 'Show only unread emails from this week';
    const res = await aiService.processChat('test_user', prompt, defaultContext);

    const filterAction = res.actions.find(a => a.type === 'FILTER_EMAILS');
    expect(filterAction).toBeDefined();
    expect(filterAction?.payload.isUnread).toBe(true);
    expect(filterAction?.payload.dateRangeDays).toBe(7);
  });

  it('should handle colloquial count query "need last 2 mail"', async () => {
    const prompt = 'need last 2 mail';
    const res = await aiService.processChat('test_user', prompt, defaultContext);

    expect(res.actions.length).toBeGreaterThan(0);
    const filterAction = res.actions.find(a => a.type === 'FILTER_EMAILS');
    expect(filterAction).toBeDefined();
    expect(filterAction?.payload.limit).toBe(2);
    expect(res.message).toContain('2');
  });

  it('should handle universal topic query "need roadmap mail"', async () => {
    const prompt = 'need roadmap mail';
    const res = await aiService.processChat('test_user', prompt, defaultContext);

    expect(res.actions.length).toBeGreaterThan(0);
    const filterAction = res.actions.find(a => a.type === 'FILTER_EMAILS');
    expect(filterAction).toBeDefined();
    expect(filterAction?.payload.query?.toLowerCase()).toContain('roadmap');
  });

  it('should generate action timeline, undo action, and email previews for count query', async () => {
    const prompt = 'show last 2 emails';
    const res = await aiService.processChat('test_user', prompt, defaultContext);

    expect(res.timeline).toBeDefined();
    expect(res.timeline?.length).toBeGreaterThanOrEqual(2);
    expect(res.timeline?.[0].status).toBe('completed');

    expect(res.undoAction).toBeDefined();
    expect(res.undoAction?.type).toBe('FILTER_EMAILS');

    expect(res.emailPreviews).toBeDefined();
    expect(Array.isArray(res.emailPreviews)).toBe(true);
  });

  it('should generate undo action and timeline for compose email', async () => {
    const prompt = "send an email to abinaya@example.com with subject 'Testing' and body 'Hello world'";
    const res = await aiService.processChat('test_user', prompt, defaultContext);

    expect(res.timeline).toBeDefined();
    expect(res.undoAction).toBeDefined();
    expect(res.undoAction?.type).toBe('CLOSE_COMPOSE');
  });

  it('should handle "Show my recent emails" without literal search for "my recent"', async () => {
    const prompt = 'Show my recent emails';
    const res = await aiService.processChat('test_user', prompt, defaultContext);

    expect(res.actions.length).toBeGreaterThan(0);
    const filterAction = res.actions.find(a => a.type === 'FILTER_EMAILS');
    expect(filterAction).toBeDefined();
    expect(filterAction?.payload.query).toBeUndefined();
    expect(res.message.toLowerCase()).toContain('recent emails');
  });

  it('should handle "show emails from sarah" by filtering sender sarah', async () => {
    const prompt = 'show emails from sarah';
    const res = await aiService.processChat('test_user', prompt, defaultContext);

    expect(res.actions.length).toBeGreaterThan(0);
    const filterAction = res.actions.find(a => a.type === 'FILTER_EMAILS');
    expect(filterAction).toBeDefined();
    expect(filterAction?.payload.sender?.toLowerCase()).toContain('sarah');
  });

  it('should handle "show unread emails" by filtering isUnread', async () => {
    const prompt = 'show unread emails';
    const res = await aiService.processChat('test_user', prompt, defaultContext);

    expect(res.actions.length).toBeGreaterThan(0);
    const filterAction = res.actions.find(a => a.type === 'FILTER_EMAILS');
    expect(filterAction).toBeDefined();
    expect(filterAction?.payload.isUnread).toBe(true);
  });
});


