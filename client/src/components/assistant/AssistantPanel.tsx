import React, { useState } from 'react';
import { Sparkles, X, Send, Trash2, Zap } from 'lucide-react';
import { useAIStore } from '../../store/aiStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { MessageList } from './MessageList.js';
import { SuggestionChips } from './SuggestionChips.js';

export const AssistantPanel: React.FC = () => {
  const isAssistantOpen = useUIStore((s) => s.isAssistantOpen);
  const toggleAssistant = useUIStore((s) => s.toggleAssistant);
  const messages = useAIStore((s) => s.messages);
  const isLoading = useAIStore((s) => s.isLoading);
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
    <div className="w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen select-none shadow-lg z-20">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              AI Co-pilot
            </h3>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              Controls Application UI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearHistory}
            title="Clear Chat History"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleAssistant}
            title="Close Assistant Panel"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
            placeholder="Instruct the AI (e.g. 'Reply to this')..."
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="absolute right-2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-all shadow-xs"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
};
