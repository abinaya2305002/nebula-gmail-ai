# Nebula Mail — AI-Powered Mail Web Application

> **Hiring Task Submission for Nebula KnowLab**
>
> An email client connected to a real mail provider (Google Gmail API) with an integrated AI assistant that **programmatically controls the UI** — composing emails with animated field filling, navigating views, displaying filtered results, providing context-aware actions ("Reply to this"), and real-time push synchronization without manual refresh.

---

## 🌟 Key Features & Requirements Matrix

| Requirement | Implementation Details | Status |
|---|---|:---:|
| **1. Real Mail Integration** | Real Google Gmail API (`@googleapis/gmail`) with OAuth 2.0 PKCE / Refresh Token flow + RFC822 MIME parser & sender. | ✅ Done |
| **2. Inbox & Sent Views** | Real email rendering with sender, subject, preview, date, unread dots, stars, and trash. | ✅ Done |
| **3. Compose & Send via UI** | Floating compose dock with To, Subject, and Body fields, and instant send capabilities. | ✅ Done |
| **4. AI Controls UI: Compose & Send** | *"Send an email to john@example.com with subject 'Meeting Tomorrow' and body 'Let’s meet at 3pm'"* → Opens compose window and visibly fills in fields. | ✅ Done |
| **5. AI Controls UI: Search & Filter** | *"Show me emails from the last 10 days"*, *"Find the email from Sarah about the project update"* → Updates the inbox list & filter pills in real time. | ✅ Done |
| **6. AI Controls UI: Navigate & Open** | *"Open the latest email from David"* → Resolves email and navigates to the detail view. | ✅ Done |
| **7. AI Context Awareness** | *"Reply to this"* while reading an email → Reads active email context snapshot and opens pre-filled reply modal. | ✅ Done |
| **8. Real-time Mail Sync** | Server-Sent Events (SSE) push stream + GCP webhook handler + push simulation trigger for live zero-refresh inbox updates. | ✅ Done |
| **Bonus: Human-in-the-Loop Confirmation** | Assistant presents interactive confirmation cards before sending emails. | ⭐️ Bonus |
| **Bonus: Conversation Thread View** | Chronological thread view with collapsible message history cards. | ⭐️ Bonus |
| **Bonus: Dark Mode & Polished UI** | Modern design system with responsive sidebar, filter chips, dark/light theme, and micro-interactions. | ⭐️ Bonus |
| **Bonus: Test Suite** | 10 automated unit & integration tests covering RFC822 MIME encoding, query building, and all AI action triggers. | ⭐️ Bonus |

---

## 🏗️ Architecture & Technology Stack

```
ai-mail-app/
├── server/                     # Backend API & Services (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── db/                 # SQLite database with WAL mode & caching
│   │   ├── services/
│   │   │   ├── mail.interface.ts # IMailService contract
│   │   │   ├── gmail.service.ts  # Google Gmail API v1 client & MIME parser
│   │   │   ├── ai.service.ts     # Google Gemini API (@google/genai) & tool dispatch
│   │   │   ├── auth.service.ts   # Google OAuth 2.0 token management & refresher
│   │   │   └── sync.service.ts   # Server-Sent Events (SSE) push stream coordinator
│   │   ├── routes/             # Express REST endpoints (/api/mail, /api/ai, /api/auth, /api/sync)
│   │   └── utils/              # EmailParser (RFC822 MIME) & QueryBuilder
│   └── tests/                  # Automated Vitest test suite
│
└── client/                     # Frontend UI (React + TypeScript + Vite + Tailwind CSS)
    ├── src/
    │   ├── store/              # Zustand stores (mailStore, aiStore, uiStore, authStore)
    │   ├── hooks/              # useRealtimeSync (SSE listener)
    │   └── components/
    │       ├── layout/         # Sidebar, TopBar, FilterBar
    │       ├── mail/           # EmailList, EmailItem, EmailDetail, ThreadView, ComposeModal
    │       └── assistant/      # AssistantPanel, MessageList, ActionCard, SuggestionChips
```

### 1. Dual-Engine AI Action Dispatch Protocol
The AI assistant receives not just user prompts, but a structured **UI Context Snapshot**:
```ts
{
  currentView: 'inbox' | 'detail' | 'compose',
  activeEmail: { from, subject, body, threadId },
  currentFilters: { query, sender, dateRangeDays, isUnread },
  composeState: { isOpen, to, subject, body }
}
```
Gemini Function Calling generates deterministic UI actions:
- `OPEN_COMPOSE`: Dispatches animated field typing in the compose modal.
- `FILTER_EMAILS`: Mutates active search filters and re-renders the inbox.
- `NAVIGATE_TO_EMAIL`: Resolves target email and opens the reading pane.
- `REQUEST_CONFIRMATION`: Renders interactive confirmation cards in the chat.

### 2. Dual-Engine Resilience
- **Google Cloud OAuth 2.0**: Connect your personal or corporate Gmail account with one click.
- **Instant Zero-Config Demo Mode**: Pre-seeded with real-world technical and organizational emails. Evaluators can test 100% of UI controls, filters, thread views, and AI actions immediately without needing GCP keys.
- **Dual-Engine AI**: Connects to Gemini 2.5 Flash via `@google/genai` when `GEMINI_API_KEY` is set; includes a built-in deterministic NLP engine fallback if running without an API key.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher; tested on v22)
- npm (v9 or higher)

### 1. Clone & Install
```bash
# Clone your private repository
git clone <your-repo-url>
cd ai-mail-app

# Install root dependencies
npm install

# Install server & client dependencies
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Configure Environment Variables (Optional for Gmail OAuth & Gemini)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Inside `.env`:
- `GOOGLE_CLIENT_ID`: Your Google OAuth 2.0 Web Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth 2.0 Client Secret
- `GEMINI_API_KEY`: Your Google Gemini API Key from Google AI Studio

*(Note: The app works out-of-the-box in instant demo mode even before setting these keys).*

### 3. Run the Application
From the root directory:
```bash
npm run dev
```
This launches both:
- **Backend API**: `http://localhost:5000`
- **Frontend Web App**: `http://localhost:5173`

Open `http://localhost:5173` in your browser.

### 4. Running Automated Tests
```bash
npm run test
```
Executes the Vitest test suite covering:
- RFC822 MIME message encoding and decoding
- Gmail API payload parsing into typed entities
- Natural language filter query generation
- AI assistant UI action dispatching for all required PDF prompts

---

## 🎯 Testing the AI Assistant UI Control (Evaluation Scenarios)

In the application, click on the **AI Co-pilot panel** on the right (or click any of the **One-Click Evaluation Chips**):

### Scenario 1: Compose & Send
> **Prompt**: `"Send an email to john@example.com with subject 'Meeting Tomorrow' and body 'Let’s meet at 3pm'"`
>
> **What Happens**:
> 1. The floating Compose modal visibly opens on the bottom-right.
> 2. The recipient, subject, and body fields are visibly typed and highlighted.
> 3. An interactive **Human-in-the-Loop Confirmation Card** appears in the assistant panel asking you to confirm before sending.

### Scenario 2: Search & Display
> **Prompt**: `"Show me emails from the last 10 days"`
>
> **What Happens**:
> 1. The main Inbox list refreshes with messages from the last 10 days.
> 2. The **Last 10 days** filter chip in the top filter bar lights up.
>
> **Prompt**: `"Find the email from Sarah about the project update"`
>
> **What Happens**:
> 1. The search input populates with `"project update"`.
> 2. The sender filter sets to `"Sarah"`.
> 3. The main UI displays matching emails.

### Scenario 3: Navigate & Open
> **Prompt**: `"Open the latest email from David"`
>
> **What Happens**:
> 1. The application switches to the **Email Detail view**.
> 2. David Miller's Q3 Roadmap message and conversation thread are displayed.

### Scenario 4: Context Awareness
> **Prompt**: `"Reply to this"` (while reading any email)
>
> **What Happens**:
> 1. The assistant inspects the currently open email in its context snapshot.
> 2. Opens the Compose modal pre-addressed to the sender with `"Re: [Subject]"`, quoted message history, and a suggested reply.

### Scenario 5: Real-time Push Synchronization
> Click the **"Simulate Push Email"** button in the top navigation bar.
>
> **What Happens**:
> 1. The server generates an incoming push event over Server-Sent Events (`/api/sync/stream`).
> 2. The new email appears at the top of your inbox with a blue fade-in glow.
> 3. An in-app toast notification appears in the bottom-left corner.
> 4. **No manual page refresh is needed!**

---

## ⚖️ Architectural Decisions & Trade-Offs

1. **Decoupled Client/Server over Monolithic Full-Stack**:
   - *Decision*: Separate React frontend and Express backend connected via clean REST and SSE APIs.
   - *Trade-off*: Requires managing two packages, but ensures modularity, testability, and a clean separation of concerns between mail transport, AI agent execution, and UI rendering.
2. **Server-Sent Events (SSE) over WebSockets**:
   - *Decision*: Used SSE for real-time synchronization.
   - *Trade-off*: SSE is unidirectional (server-to-client), which is ideal for push email delivery. It reconnects automatically, traverses firewalls without configuration, and avoids WebSocket framing complexity. Client-to-server requests use standard REST.
3. **SQLite Local Cache with WAL Mode**:
   - *Decision*: Cached messages in SQLite (`better-sqlite3`).
   - *Trade-off*: Provides instant search and offline viewing while eliminating rate limit exhaustion on external APIs.
4. **Human-in-the-Loop Confirmation**:
   - *Decision*: For sensitive actions like sending emails or deleting messages, the assistant drafts the action and requests confirmation before final dispatch.

---

## Demo

[▶️ Watch Demo Video](https://drive.google.com/file/d/1_V4LjCDCaXxwWU4-jPX9G54Pfai7HW6K/view?usp=drivesdk)

---

## 🔮 What I Would Improve with More Time

1. **Full Gmail Push via Google Cloud Pub/Sub Topic**: Wire up production Cloud Pub/Sub webhooks with Cloud KMS signature verification for enterprise domains.
2. **Rich Text / WYSIWYG Editor**: Integrate Tiptap or Lexical for rich formatting (bold, italic, attachments, inline images).
3. **Multi-turn Voice Dictation**: Enable Web Speech API voice input so users can speak directly to the AI co-pilot.
4. **Draft Auto-save**: Auto-save drafts every 5 seconds to Gmail `users.drafts.create`.
5. **AI Email Triage / Category Tabs**: Auto-categorize inbox into Primary, Updates, and Promotions using Gemini embeddings.
