import React, { useEffect, useRef } from 'react';
import { Bot, User, Sparkles, Zap, ArrowUpRight } from 'lucide-react';
import { AssistantMessage } from '../../types/ai.js';
import { ActionCard } from './ActionCard.js';

interface MessageListProps {
  messages: AssistantMessage[];
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

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
                  ? 'bg-blue-600 text-white'
                  : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
              }`}
            >
              {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                isUser
                  ? 'bg-blue-600 text-white rounded-tr-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Action Badges showing UI control operations */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 flex flex-wrap gap-1">
                  {msg.actions.map((act, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-semibold"
                    >
                      <Zap className="w-2.5 h-2.5 text-amber-500" />
                      <span>{act.type}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Rich Content (e.g. Confirmation Card) */}
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
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-500 rounded-tl-xs flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>Driving UI actions...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
