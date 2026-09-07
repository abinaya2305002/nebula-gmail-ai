import React from 'react';
import { Sparkles, Send, Calendar, Search, User, Reply, Mail, ListOrdered, BarChart2 } from 'lucide-react';
import { useAIStore } from '../../store/aiStore.js';
import { useMailStore } from '../../store/mailStore.js';

export const SuggestionChips: React.FC = () => {
  const sendMessage = useAIStore((s) => s.sendMessage);
  const selectedEmail = useMailStore((s) => s.selectedEmail);

  const suggestions = [
    {
      label: 'Recent Emails',
      icon: ListOrdered,
      prompt: 'Show my recent emails',
      color: 'hover:border-teal-400 hover:bg-teal-50/60 dark:hover:bg-teal-950/40',
    },
    {
      label: 'Last 2 Mails',
      icon: ListOrdered,
      prompt: 'Show my last 2 emails',
      color: 'hover:border-teal-400 hover:bg-teal-50/60 dark:hover:bg-teal-950/40',
    },
    {
      label: 'Unread This Week',
      icon: Mail,
      prompt: 'Show only unread emails from this week',
      color: 'hover:border-teal-400 hover:bg-teal-50/60 dark:hover:bg-teal-950/40',
    },
    {
      label: 'Compose via AI',
      icon: Send,
      prompt: "Send an email to john@example.com with subject 'Meeting Tomorrow' and body 'Let’s meet at 3pm'",
      color: 'hover:border-cyan-400 hover:bg-cyan-50/60 dark:hover:bg-cyan-950/40',
    },
    {
      label: 'Last 10 Days',
      icon: Calendar,
      prompt: 'Show me emails from the last 10 days',
      color: 'hover:border-teal-400 hover:bg-teal-50/60 dark:hover:bg-teal-950/40',
    },
    {
      label: 'Find Sarah’s Update',
      icon: Search,
      prompt: 'Find the email from Sarah about the project update',
      color: 'hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40',
    },
    {
      label: 'Open David’s Latest',
      icon: User,
      prompt: 'Open the latest email from David',
      color: 'hover:border-teal-400 hover:bg-teal-50/60 dark:hover:bg-teal-950/40',
    },
    {
      label: 'Reply to Active Email',
      icon: Reply,
      prompt: 'Reply to this saying sounds good, let’s proceed!',
      disabled: !selectedEmail,
      color: 'hover:border-cyan-400 hover:bg-cyan-50/60 dark:hover:bg-cyan-950/40',
    },
    {
      label: 'Mailbox Stats',
      icon: BarChart2,
      prompt: 'How many unread emails do I have?',
      color: 'hover:border-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
    },
  ];

  return (
    <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 select-none">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
        <Sparkles className="w-3 h-3 text-teal-500" />
        <span>Quick Action Directives</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              disabled={item.disabled}
              onClick={() => sendMessage(item.prompt)}
              title={item.prompt}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer ${
                item.color
              } ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
            >
              <Icon className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
