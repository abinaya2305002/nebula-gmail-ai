import React from 'react';
import { Sparkles, Send, Calendar, Search, User, Reply, Mail } from 'lucide-react';
import { useAIStore } from '../../store/aiStore.js';
import { useMailStore } from '../../store/mailStore.js';

export const SuggestionChips: React.FC = () => {
  const sendMessage = useAIStore((s) => s.sendMessage);
  const selectedEmail = useMailStore((s) => s.selectedEmail);

  const suggestions = [
    {
      label: 'Compose via AI',
      icon: Send,
      prompt: "Send an email to john@example.com with subject 'Meeting Tomorrow' and body 'Let’s meet at 3pm'",
      color: 'hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/40',
    },
    {
      label: 'Last 10 days',
      icon: Calendar,
      prompt: 'Show me emails from the last 10 days',
      color: 'hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40',
    },
    {
      label: 'Find Sarah’s project email',
      icon: Search,
      prompt: 'Find the email from Sarah about the project update',
      color: 'hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/40',
    },
    {
      label: 'Open David’s latest',
      icon: User,
      prompt: 'Open the latest email from David',
      color: 'hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40',
    },
    {
      label: 'Reply to this email',
      icon: Reply,
      prompt: 'Reply to this',
      disabled: !selectedEmail,
      color: 'hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-950/40',
    },
    {
      label: 'Unread this week',
      icon: Mail,
      prompt: 'Show only unread emails from this week',
      color: 'hover:border-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-950/40',
    },
  ];

  return (
    <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 select-none">
      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>One-Click Evaluation Prompts</span>
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
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-all ${
                item.color
              } ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
            >
              <Icon className="w-3 h-3 text-slate-400" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
