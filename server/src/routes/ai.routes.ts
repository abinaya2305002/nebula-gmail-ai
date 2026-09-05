import { Router } from 'express';
import { aiService } from '../services/ai.service.js';
import { db } from '../db/database.js';
import { UIContextSnapshot } from '../types/index.js';

export const aiRouter = Router();

const getUserId = (req: any): string => {
  return (req.query.userId as string) || (req.headers['x-user-id'] as string) || 'demo_user_nebula';
};

aiRouter.post('/chat', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { prompt, context } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const safeContext: UIContextSnapshot = context || {
      currentView: 'inbox',
      composeState: { isOpen: false },
      currentFilters: { folder: 'inbox' },
    };

    const result = await aiService.processChat(userId, prompt, safeContext);
    res.json(result);
  } catch (err: any) {
    console.error('AI chat endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

aiRouter.get('/history', (req, res) => {
  try {
    const userId = getUserId(req);
    const messages = db.getAiMessages(userId, 50);
    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
