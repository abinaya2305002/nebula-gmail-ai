import React from 'react';
import { Star, Mail, MailOpen, Trash2 } from 'lucide-react';
import { EmailMessage } from '../../types/mail.js';
import { useMailStore } from '../../store/mailStore.js';
import { useUIStore } from '../../store/uiStore.js';

interface EmailItemProps {
  email: EmailMessage;
  isSelected: boolean;
}

export const EmailItem: React.FC<EmailItemProps> = ({ email, isSelected }) => {
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

  const getInitialColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-rose-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      onClick={handleRowClick}
      className={`group relative flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 cursor-pointer transition-all ${
        isHighlighted
          ? 'bg-blue-50/90 dark:bg-blue-950/60 animate-highlight-fade'
          : isSelected
          ? 'bg-blue-50/70 dark:bg-blue-900/30'
          : email.isUnread
          ? 'bg-white dark:bg-slate-900 font-semibold'
          : 'bg-slate-50/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 font-normal hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
      }`}
    >
      {/* Unread blue dot indicator */}
      <div className="w-2 flex justify-center">
        {email.isUnread && (
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 shadow-sm" />
        )}
      </div>

      {/* Star button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleStar(email.id);
        }}
        className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
      >
        <Star
          className={`w-4 h-4 ${
            email.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
          }`}
        />
      </button>

      {/* Avatar Circle */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getInitialColor(
          email.senderName
        )}`}
      >
        {email.senderName.charAt(0).toUpperCase()}
      </div>

      {/* Sender Name */}
      <div className="w-36 sm:w-44 truncate text-sm text-slate-900 dark:text-slate-100">
        {email.senderName}
      </div>

      {/* Subject & Preview */}
      <div className="flex-1 min-w-0 flex items-baseline gap-2 text-sm">
        <span className={`truncate text-slate-900 dark:text-slate-100 ${email.isUnread ? 'font-semibold' : 'font-medium'}`}>
          {email.subject}
        </span>
        <span className="truncate text-xs text-slate-400 dark:text-slate-500 hidden md:inline">
          — {email.snippet}
        </span>
      </div>

      {/* Date & Hover Quick Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-slate-400 dark:text-slate-500 group-hover:hidden font-medium">
          {formatDate(email.date)}
        </span>

        {/* Action icons shown on hover */}
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              markAsRead(email.id, !email.isUnread);
            }}
            title={email.isUnread ? 'Mark as read' : 'Mark as unread'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            {email.isUnread ? <MailOpen className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteEmail(email.id);
            }}
            title="Delete"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
