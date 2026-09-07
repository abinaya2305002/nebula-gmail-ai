import React, { useEffect, useRef } from 'react';
import { User, Sparkles, Undo2 } from 'lucide-react';
import { AssistantMessage } from '../../types/ai.js';
import { ActionCard } from './ActionCard.js';
import { EmailPreviewCard } from './EmailPreviewCard.js';
import { useAIStore } from '../../store/aiStore.js';

interface MessageListProps {
  messages: AssistantMessage[];
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const triggerUndo = useAIStore((s) => s.triggerUndo);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        return (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isUser
                  ? 'bg-teal-600 text-white'
                  : 'bg-gradient-to-tr from-teal-600 to-cyan-500 text-white'
              }`}
            >
              {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                isUser
                  ? 'bg-teal-600 text-white rounded-tr-xs'
                  : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Reversible Undo Button (Only if action was taken) */}
              {msg.undoAction && (
                <div className="mt-2 pt-1.5 flex justify-end border-t border-slate-200/60 dark:border-slate-700/60">
                  <button
                    onClick={() => triggerUndo(msg.undoAction)}
                    title={msg.undoAction.description || 'Undo this action'}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <Undo2 className="w-3 h-3 text-slate-500 dark:text-slate-300" />
                    <span>Undo</span>
                  </button>
                </div>
              )}

              {/* Compact Interactive Email Preview Cards */}
              {msg.emailPreviews && msg.emailPreviews.length > 0 && (
                <div className="mt-2.5 space-y-1">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Referenced Messages:
                  </div>
                  {msg.emailPreviews.map((preview) => (
                    <EmailPreviewCard key={preview.id} email={preview} />
                  ))}
                </div>
              )}

              {/* Rich Content (Human-in-the-loop Send Confirmation Card) */}
              {msg.richContent && msg.richContent.type === 'confirmation_card' && (
                <ActionCard cardData={msg.richContent.data} />
              )}
            </div>
          </div>
        );
      })}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-500 rounded-tl-xs flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>Processing...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
