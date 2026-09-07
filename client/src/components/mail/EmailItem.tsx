import React from 'react';
import { Star, Mail, MailOpen, Trash2, CheckSquare, Square, Archive, Clock, Bookmark } from 'lucide-react';
import { EmailMessage } from '../../types/mail.js';
import { useMailStore } from '../../store/mailStore.js';
import { useUIStore } from '../../store/uiStore.js';

interface EmailItemProps {
  email: EmailMessage;
  isSelected: boolean;
  isChecked?: boolean;
  onToggleCheck?: () => void;
}

export const EmailItem: React.FC<EmailItemProps> = ({
  email,
  isSelected,
  isChecked = false,
  onToggleCheck,
}) => {
  const selectEmail = useMailStore((s) => s.selectEmail);
  const markAsRead = useMailStore((s) => s.markAsRead);
  const toggleStar = useMailStore((s) => s.toggleStar);
  const deleteEmail = useMailStore((s) => s.deleteEmail);
  const highlightedEmailId = useMailStore((s) => s.highlightedEmailId);
  const setCurrentView = useUIStore((s) => s.setCurrentView);

  const isHighlighted = highlightedEmailId === email.id;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleRowClick = () => {
    selectEmail(email.id);
    setCurrentView('detail');
  };

  return (
    <div
      onClick={handleRowClick}
      className={`group relative flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80 cursor-pointer select-none transition-colors ${
        isHighlighted
          ? 'bg-blue-100/80 dark:bg-blue-950/70 animate-highlight-fade'
          : isChecked
          ? 'bg-[#c2e7ff]/60 dark:bg-blue-950/50'
          : isSelected
          ? 'bg-[#c2e7ff]/40 dark:bg-blue-950/40'
          : email.isUnread
          ? 'bg-white dark:bg-slate-900 font-semibold'
          : 'bg-[#f7f9fc]/60 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 font-normal hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
      }`}
    >
      {/* 1. Checkbox */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onToggleCheck?.();
        }}
        className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        {isChecked ? (
          <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <Square className="w-4 h-4 opacity-40 group-hover:opacity-100" />
        )}
      </div>

      {/* 2. Star Toggle Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleStar(email.id);
        }}
        className="p-0.5 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
        title={email.isStarred ? 'Starred' : 'Not starred'}
      >
        <Star
          className={`w-4 h-4 ${
            email.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
          }`}
        />
      </button>

      {/* 3. Important / Bookmark Tag (Gmail Arrow/Tag) */}
      <div className="hidden sm:block p-0.5 text-slate-300 dark:text-slate-600">
        <Bookmark className={`w-3.5 h-3.5 ${email.isUnread ? 'fill-amber-400/30 text-amber-500' : 'opacity-40'}`} />
      </div>

      {/* 4. Sender Name */}
      <div className={`w-36 sm:w-48 truncate text-xs ${email.isUnread ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-300'}`}>
        {email.senderName}
      </div>

      {/* 5. Subject & Snippet Preview (Gmail row structure with — separator) */}
      <div className="flex-1 min-w-0 flex items-baseline gap-1.5 text-xs">
        <span
          className={`truncate ${
            email.isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-800 dark:text-slate-200'
          }`}
        >
          {email.subject}
        </span>
        <span className="truncate text-slate-500 dark:text-slate-400 font-normal hidden md:inline">
          — {email.snippet}
        </span>
      </div>

      {/* 6. Timestamp (hidden on hover) */}
      <div className="flex items-center gap-1 shrink-0 text-right">
        <span
          className={`text-[11px] group-hover:hidden ${
            email.isUnread ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 font-normal'
          }`}
        >
          {formatDate(email.date)}
        </span>

        {/* 7. Action Icons (revealed on row hover, replacing the date like Gmail) */}
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Archive simulation
              useUIStore.getState().addToast({ title: 'Archived', message: 'Email archived', type: 'info' });
            }}
            title="Archive"
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteEmail(email.id);
            }}
            title="Delete"
            className="p-1.5 rounded-full text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              markAsRead(email.id, !email.isUnread);
            }}
            title={email.isUnread ? 'Mark as read' : 'Mark as unread'}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {email.isUnread ? <MailOpen className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              useUIStore.getState().addToast({ title: 'Snoozed', message: 'Snoozed until tomorrow', type: 'info' });
            }}
            title="Snooze"
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
