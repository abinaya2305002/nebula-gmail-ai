import React from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { CompactEmailPreview } from '../../types/ai.js';
import { useMailStore } from '../../store/mailStore.js';
import { useUIStore } from '../../store/uiStore.js';

interface EmailPreviewCardProps {
  email: CompactEmailPreview;
}

export const EmailPreviewCard: React.FC<EmailPreviewCardProps> = ({ email }) => {
  const selectEmail = useMailStore((s) => s.selectEmail);
  const setCurrentView = useUIStore((s) => s.setCurrentView);

  const handleClick = async () => {
    await selectEmail(email.id);
    setCurrentView('detail');
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={handleClick}
      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-400 dark:hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all cursor-pointer group select-none my-1.5 text-xs"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <Mail className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            {email.senderName}
          </span>
          {email.isUnread && (
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
          )}
        </div>
        <span className="text-[10px] text-slate-400 font-medium shrink-0">
          {formatDate(email.date)}
        </span>
      </div>

      <p className="font-medium text-slate-900 dark:text-slate-100 truncate mb-0.5">
        {email.subject}
      </p>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
        {email.snippet}
      </p>

      <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end text-[10px] text-teal-600 dark:text-teal-400 font-semibold group-hover:underline">
        <span>Open email</span>
        <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
};
