1. Architecture
   ## Architecture

Nebula Gmail follows a client-server architecture where the React frontend
provides the email interface and the backend handles Gmail integration,
authentication, AI processing, and email operations.

### System Flow

User
  ↓
Nebula Gmail UI
  ↓
AI Assistant / Natural Language Command
  ↓
Intent & Action Processing
  ↓
Structured UI Actions
  ↓
Backend API
  ↓
Gmail API
  ↓
Inbox / Sent / Compose / Email Details

### Main Components

1. Frontend
   - React and TypeScript
   - Gmail-style email interface
   - Inbox, Sent, Compose and Email Detail views
   - AI assistant panel
   - Displays the results of AI actions directly in the main UI

2. AI Assistant
   - Understands natural-language email commands
   - Identifies the user's intent
   - Converts commands into structured actions
   - Supports operations such as searching, filtering, opening,
     composing and replying to emails

3. Backend
   - Node.js and Express
   - Provides APIs for email operations
   - Handles authentication and communication with Gmail
   - Executes the actions requested by the AI assistant

4. Gmail Integration
   - Gmail API is used to access real email data
   - OAuth 2.0 is used for user authentication
   - Email operations are performed through the connected Gmail account

5. Real-Time Synchronization
   - The application synchronizes mailbox changes so that new email
     information can be reflected without requiring a manual refresh.

### AI-Controlled UI

The AI assistant does not work only as a chatbot. It converts natural-language
commands into application actions.

For example:

"Show my last 2 emails"
        ↓
GET_RECENT_EMAILS
        ↓
Inbox displays the latest 2 emails

"Open my latest email"
        ↓
OPEN_EMAIL
        ↓
Main email-detail view opens

"Compose an email to John"
        ↓
OPEN_COMPOSE + FILL_COMPOSE
        ↓
Compose window opens and fields are populated

2. Architecture Decisions & Trade-offs
   ## Architecture Decisions & Trade-offs

### React for the Frontend

React was selected to build a responsive email interface and to make it easier
to update the UI dynamically when the AI performs an action.

### Gmail API

The Gmail API was selected instead of using mock email data so that the
application can work with real mailbox data.

### Structured AI Actions

The AI assistant converts natural-language commands into predefined actions
such as OPEN_EMAIL, SEARCH_EMAILS, FILTER_EMAILS, OPEN_COMPOSE and
FILL_COMPOSE.

This provides better control and prevents the AI from directly manipulating
the application in an uncontrolled way.

The trade-off is that additional email capabilities require additional
action types and corresponding frontend/backend handling.

### Backend Separation

Email and AI-related operations are handled through the backend instead of
placing sensitive operations entirely in the frontend.

This provides better separation of responsibilities and makes the system
easier to maintain.

### Gmail-Style UI

The interface follows a familiar Gmail-inspired layout so users can
understand the email workflow easily while using the AI assistant as the
primary interaction layer.
3. Installation / Setup
  ## Setup and Installation

### Prerequisites

- Node.js
- npm
- Google account
- Gmail API credentials
- Gemini API key

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd nebula-gmail-ai

4.Install dependencies
  npm install

5.Configure environment variables
Create a .env file and add the required credentials:

GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

6.Start the application
npm run dev

7.ScreenShots
Main Interface
<img src="C:\Users\abina\.gemini\antigravity\scratch\ai-mail-app\client\public\screenshot\Interface.png" alt="AI Mail App Interface" width="800"/>
Inbox
<img src="C:\Users\abina\.gemini\antigravity\scratch\ai-mail-app\client\public\screenshot\screenshotsinbox.png.png" alt="Inbox" width="800"/>
Recent Mails
<img src="C:\Users\abina\.gemini\antigravity\scratch\ai-mail-app\client\public\screenshot\Recent_mails.png" alt="Recent Mails" width="800"/>
AI Email / Copilot
<img src="C:\Users\abina\.gemini\antigravity\scratch\ai-mail-app\client\public\screenshot\copilot.png.png" alt="AI Email Copilot" width="800"/>
Show Email
<img src="C:\Users\abina\.gemini\antigravity\scratch\ai-mail-app\client\public\screenshot\Show_mail.png.png" alt="Email Details" width="800"/>
Last Email
<img src="C:\Users\abina\.gemini\antigravity\scratch\ai-mail-app\client\public\screenshot\Show_last_email.png" alt="Last Email" width="800"/>
Automated Task
<img src="C:\Users\abina\.gemini\antigravity\scratch\ai-mail-app\client\public\screenshot\Automate_task.png.png" alt="Automated Task" width="800"/>

Author
Abinaya
