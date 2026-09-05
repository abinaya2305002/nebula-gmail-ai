import { Router } from 'express';
import { mailService } from '../services/gmail.service.js';
import { db } from '../db/database.js';
import { EmailFilterParams } from '../types/index.js';
import { syncService } from '../services/sync.service.js';

export const mailRouter = Router();

// Middleware to get user ID
const getUserId = (req: any): string => {
  return (req.query.userId as string) || (req.headers['x-user-id'] as string) || 'demo_user_nebula';
};

mailRouter.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const params: EmailFilterParams = {
      folder: (req.query.folder as string) || 'inbox',
      query: req.query.query as string,
      sender: req.query.sender as string,
      dateRangeDays: req.query.dateRangeDays ? parseInt(req.query.dateRangeDays as string, 10) : undefined,
      isUnread: req.query.isUnread !== undefined ? req.query.isUnread === 'true' : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
    };

    const result = await mailService.listMessages(userId, params);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mailRouter.get('/stats', (req, res) => {
  try {
    const userId = getUserId(req);
    const stats = db.getStats(userId);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mailRouter.get('/threads/:threadId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const thread = await mailService.getThread(userId, req.params.threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    res.json(thread);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mailRouter.get('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const email = await mailService.getMessage(userId, req.params.id);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    res.json(email);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mailRouter.post('/send', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { to, subject, body, replyToId, threadId } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    const sent = await mailService.sendMessage(userId, { to, subject, body, replyToId, threadId });
    syncService.broadcast(userId, 'EMAIL_SENT', sent);
    res.json({ success: true, message: sent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

mailRouter.patch('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { isUnread, isStarred, folder } = req.body;
    const success = await mailService.updateMessage(userId, req.params.id, { isUnread, isStarred, folder });
    if (success) {
      syncService.broadcast(userId, 'EMAIL_UPDATED', { id: req.params.id, isUnread, isStarred, folder });
    }
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
