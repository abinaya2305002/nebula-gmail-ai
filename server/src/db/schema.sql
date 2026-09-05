CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    google_access_token TEXT,
    google_refresh_token TEXT,
    token_expires_at INTEGER,
    history_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    thread_id TEXT NOT NULL,
    folder TEXT NOT NULL, -- 'inbox', 'sent', 'starred', 'trash'
    sender_name TEXT,
    sender_email TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT,
    snippet TEXT,
    body_text TEXT,
    body_html TEXT,
    date INTEGER NOT NULL, -- ms timestamp
    is_unread BOOLEAN DEFAULT 1,
    is_starred BOOLEAN DEFAULT 0,
    labels TEXT, -- JSON array
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user' | 'assistant'
    content TEXT NOT NULL,
    actions_json TEXT, -- JSON stringified actions
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emails_user_folder_date ON emails(user_id, folder, date DESC);
CREATE INDEX IF NOT EXISTS idx_emails_thread ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_unread ON emails(user_id, is_unread);
