import React from 'react';
import { Mail, Inbox, Search, Sparkles } from 'lucide-react';
import { EmailItem } from './EmailItem.js';
import { useMailStore } from '../../store/mailStore.js';
import { useUIStore } from '../../store/uiStore.js';

export const EmailList: React.FC = () => {
  const emails = useMailStore((s) => s.emails);
  const isLoading = useMailStore((s) => s.isLoading);
  const selectedEmail = useMailStore((s) => s.selectedEmail);
  const activeFolder = useMailStore((s) => s.activeFolder);
  const filters = useMailStore((s) => s.filters);
  const resetFilters = useMailStore((s) => s.resetFilters);
  const openCompose = useUIStore((s) => s.openCompose);

  const getFolderDisplayName = (folder: string) => {
    switch (folder) {
      case 'inbox':
        return 'Inbox';
      case 'sent':
        return 'Sent Messages';
      case 'starred':
        return 'Starred';
      case 'trash':
        return 'Trash';
      default:
        return 'Emails';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Folder Header */}
      <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm capitalize">
            {getFolderDisplayName(activeFolder)}
          </span>
          <span>•</span>
          <span>{emails.length} {emails.length === 1 ? 'message' : 'messages'}</span>
        </div>

        {filters.dateRangeDays && (
          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
            Showing last {filters.dateRangeDays} days
          </span>
        )}
      </div>

      {/* List Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading emails...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-base mb-1">
              No emails found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              {filters.query || filters.sender || filters.dateRangeDays || filters.isUnread !== undefined
                ? 'No messages matched your current filters or AI search criteria.'
                : 'Your mailbox is empty in this folder.'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={() => openCompose({ mode: 'new' })}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                Compose New Email
              </button>
            </div>
          </div>
        ) : (
          emails.map((email) => (
            <EmailItem
              key={email.id}
              email={email}
              isSelected={selectedEmail?.id === email.id}
            />
          ))
        )}
      </div>
    </div>
  );
};
