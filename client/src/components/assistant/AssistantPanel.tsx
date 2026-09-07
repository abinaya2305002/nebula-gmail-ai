import React, { useState } from 'react';
import { Sparkles, X, Send, Trash2, Terminal } from 'lucide-react';
import { useAIStore } from '../../store/aiStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { MessageList } from './MessageList.js';
import { SuggestionChips } from './SuggestionChips.js';

export const AssistantPanel: React.FC = () => {
  const isAssistantOpen = useUIStore((s) => s.isAssistantOpen);
  const toggleAssistant = useUIStore((s) => s.toggleAssistant);
  const messages = useAIStore((s) => s.messages);
  const isLoading = useAIStore((s) => s.isLoading);
  const isExecuting = useAIStore((s) => s.isExecuting);
  const sendMessage = useAIStore((s) => s.sendMessage);
  const clearHistory = useAIStore((s) => s.clearHistory);

  const [inputPrompt, setInputPrompt] = useState('');

  if (!isAssistantOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;
    sendMessage(inputPrompt.trim());
    setInputPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <aside className="w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen select-none shadow-xl z-20 shrink-0">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Nebula AI Copilot
              </h3>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wide uppercase ${
                isExecuting
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 animate-pulse'
                  : 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isExecuting ? 'bg-amber-500' : 'bg-teal-500'}`} />
                {isExecuting ? 'Executing' : 'Ready'}
              </span>
            </div>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
              Gmail UI Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearHistory}
            title="Clear Chat History"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleAssistant}
            title="Close Copilot Panel"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Suggestion Chips */}
      <SuggestionChips />

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Nebula Copilot (e.g. 'Show my recent emails')..."
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="absolute right-2 p-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-40 transition-all shadow-xs cursor-pointer"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </aside>
  );
};
