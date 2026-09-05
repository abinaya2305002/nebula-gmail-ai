import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { authRouter } from './routes/auth.routes.js';
import { mailRouter } from './routes/mail.routes.js';
import { aiRouter } from './routes/ai.routes.js';
import { syncRouter } from './routes/sync.routes.js';

const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/mail', mailRouter);
app.use('/api/ai', aiRouter);
app.use('/api/sync', syncRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`  AI-Powered Mail Server listening on port ${config.port}`);
  console.log(`  Client URL: ${config.clientUrl}`);
  console.log(`  Google OAuth configured: ${Boolean(config.google.clientId && config.google.clientSecret)}`);
  console.log(`  Gemini API configured: ${Boolean(config.gemini.apiKey)}`);
  console.log(`=======================================================`);
});
