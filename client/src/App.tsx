import React, { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar.js';
import { TopBar } from './components/layout/TopBar.js';
import { FilterBar } from './components/layout/FilterBar.js';
import { EmailList } from './components/mail/EmailList.js';
import { EmailDetail } from './components/mail/EmailDetail.js';
import { ComposeModal } from './components/mail/ComposeModal.js';
import { AssistantPanel } from './components/assistant/AssistantPanel.js';
import { ToastContainer } from './components/common/Toast.js';
import { useMailStore } from './store/mailStore.js';
import { useAuthStore } from './store/authStore.js';
import { useUIStore } from './store/uiStore.js';
import { useRealtimeSync } from './hooks/useRealtimeSync.js';

export const App: React.FC = () => {
  const fetchEmails = useMailStore((s) => s.fetchEmails);
  const fetchStats = useMailStore((s) => s.fetchStats);
  const currentView = useUIStore((s) => s.currentView);
  const selectedEmail = useMailStore((s) => s.selectedEmail);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  // Connect real-time Server-Sent Events (SSE) push channel
  const { isConnected } = useRealtimeSync();

  useEffect(() => {
    fetchUser();
    fetchEmails();
    fetchStats();
  }, [fetchUser, fetchEmails, fetchStats]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
      {/* 1. Left Navigation Sidebar */}
      <Sidebar />

      {/* 2. Main Center Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopBar isRealtimeConnected={isConnected} />
        <FilterBar />

        <div className="flex-1 flex overflow-hidden relative">
          {currentView === 'detail' && selectedEmail ? (
            <EmailDetail />
          ) : (
            <EmailList />
          )}
        </div>
      </main>

      {/* 3. Right AI Co-pilot Assistant Panel */}
      <AssistantPanel />

      {/* 4. Floating Compose Modal (supports automated AI field typing) */}
      <ComposeModal />

      {/* 5. Real-time Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default App;
