import { Router } from 'express';
import { AuthService } from '../services/auth.service.js';
import { config } from '../config.js';

export const authRouter = Router();

authRouter.get('/google/url', (req, res) => {
  try {
    const url = AuthService.getAuthUrl();
    res.json({ url });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

authRouter.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.status(400).send('Missing authorization code');
  }

  try {
    const user = await AuthService.handleCallback(code);
    // Redirect to frontend with user id param or success flag
    res.redirect(`${config.clientUrl}?auth_success=true&user_id=${user.id}`);
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    res.redirect(`${config.clientUrl}?auth_error=${encodeURIComponent(err.message)}`);
  }
});

authRouter.get('/me', (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  const user = AuthService.getUser(userId);
  res.json({ user });
});

authRouter.post('/logout', (req, res) => {
  res.json({ success: true });
});
