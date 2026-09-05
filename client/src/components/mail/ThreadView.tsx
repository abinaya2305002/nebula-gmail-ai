import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Reply, Clock } from 'lucide-react';
import { EmailThread, EmailMessage } from '../../types/mail.js';
import { useUIStore } from '../../store/uiStore.js';

interface ThreadViewProps {
  thread: EmailThread;
  currentEmailId: string;
}

export const ThreadView: React.FC<ThreadViewProps> = ({ thread, currentEmailId }) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    [currentEmailId]: true,
  });
  const openCompose = useUIStore((s) => s.openCompose);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReplyToMessage = (msg: EmailMessage) => {
    const subject = msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`;
    openCompose({
      to: msg.senderEmail,
      subject,
      mode: 'reply',
      replyToId: msg.id,
      threadId: thread.id,
      body: `\n\nOn ${new Date(msg.date).toLocaleDateString()}, ${msg.senderName} wrote:\n> ${msg.bodyText.replace(/\n/g, '\n> ')}`,
    });
  };

  return (
    <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span>Conversation Thread</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
            {thread.messages.length} messages
          </span>
        </h4>
      </div>

      <div className="space-y-3">
        {thread.messages.map((msg, index) => {
          const isCurrent = msg.id === currentEmailId;
          const isExpanded = expandedIds[msg.id] ?? isCurrent;

          return (
            <div
              key={msg.id}
              className={`rounded-2xl border transition-all ${
                isCurrent
                  ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              {/* Message Header Bar */}
              <div
                onClick={() => toggleExpand(msg.id)}
                className="p-3.5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {msg.senderName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mr-2">
                      {msg.senderName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(msg.date).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReplyToMessage(msg);
                    }}
                    title="Reply to this message"
                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Message Body (when expanded) */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 text-sm text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                  {msg.bodyHtml ? (
                    <div
                      className="prose dark:prose-invert max-w-none text-xs leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: msg.bodyHtml }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-xs leading-relaxed">{msg.bodyText}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
