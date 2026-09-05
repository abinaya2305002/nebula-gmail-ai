import { Router } from 'express';
import { syncService } from '../services/sync.service.js';
import { mailService } from '../services/gmail.service.js';

export const syncRouter = Router();

const getUserId = (req: any): string => {
  return (req.query.userId as string) || (req.headers['x-user-id'] as string) || 'demo_user_nebula';
};

// SSE stream endpoint
syncRouter.get('/stream', (req, res) => {
  const userId = getUserId(req);
  const clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  syncService.addClient(clientId, userId, res);
});

// Demo trigger: simulates push delivery of an incoming email
syncRouter.post('/trigger-simulated', (req, res) => {
  const userId = getUserId(req);
  const email = syncService.triggerSimulatedIncomingEmail(userId);
  res.json({ success: true, email });
});

// Force manual sync
syncRouter.post('/manual', async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await mailService.syncMailbox(userId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Google Cloud Pub/Sub push webhook
syncRouter.post('/webhook', async (req, res) => {
  // Acknowledge Pub/Sub quickly
  res.status(200).send('OK');

  try {
    const message = req.body?.message;
    if (message?.data) {
      const decoded = Buffer.from(message.data, 'base64').toString('utf8');
      const data = JSON.parse(decoded);
      if (data.emailAddress) {
        // Find user by email and trigger sync
        const { db } = await import('../db/database.js');
        const user = db.getUserByEmail(data.emailAddress);
        if (user) {
          const result = await mailService.syncMailbox(user.id);
          syncService.broadcast(user.id, 'SYNC_COMPLETE', result);
        }
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }
});
