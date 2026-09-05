import React from 'react';
import {
  ArrowLeft,
  Reply,
  Forward,
  Star,
  Trash2,
  Mail,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useMailStore } from '../../store/mailStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { ThreadView } from './ThreadView.js';

export const EmailDetail: React.FC = () => {
  const selectedEmail = useMailStore((s) => s.selectedEmail);
  const selectedThread = useMailStore((s) => s.selectedThread);
  const selectEmail = useMailStore((s) => s.selectEmail);
  const toggleStar = useMailStore((s) => s.toggleStar);
  const deleteEmail = useMailStore((s) => s.deleteEmail);
  const setCurrentView = useUIStore((s) => s.setCurrentView);
  const openCompose = useUIStore((s) => s.openCompose);

  if (!selectedEmail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-slate-400">
        <Mail className="w-12 h-12 mb-2 text-slate-300 dark:text-slate-700" />
        <p className="text-sm">Select an email to read</p>
      </div>
    );
  }

  const handleBack = () => {
    selectEmail(null);
    setCurrentView('inbox');
  };

  const handleReply = () => {
    const subject = selectedEmail.subject.startsWith('Re:')
      ? selectedEmail.subject
      : `Re: ${selectedEmail.subject}`;
    openCompose({
      to: selectedEmail.senderEmail,
      subject,
      mode: 'reply',
      replyToId: selectedEmail.id,
      threadId: selectedEmail.threadId,
      body: `\n\nOn ${new Date(selectedEmail.date).toLocaleDateString()}, ${selectedEmail.senderName} wrote:\n> ${selectedEmail.bodyText.replace(/\n/g, '\n> ')}`,
    });
  };

  const handleForward = () => {
    const subject = selectedEmail.subject.startsWith('Fwd:')
      ? selectedEmail.subject
      : `Fwd: ${selectedEmail.subject}`;
    openCompose({
      to: '',
      subject,
      mode: 'forward',
      threadId: selectedEmail.threadId,
      body: `\n\n---------- Forwarded message ---------\nFrom: ${selectedEmail.senderName} <${selectedEmail.senderEmail}>\nSubject: ${selectedEmail.subject}\nDate: ${new Date(selectedEmail.date).toLocaleString()}\n\n${selectedEmail.bodyText}`,
    });
  };

  const handleDelete = async () => {
    await deleteEmail(selectedEmail.id);
    handleBack();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto">
      {/* Top Action Toolbar */}
      <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between select-none sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to list</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReply}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>

          <button
            onClick={handleForward}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Forward className="w-3.5 h-3.5" />
            <span>Forward</span>
          </button>

          <button
            onClick={() => toggleStar(selectedEmail.id)}
            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Star
              className={`w-4 h-4 ${
                selectedEmail.isStarred
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-400 dark:text-slate-600'
              }`}
            />
          </button>

          <button
            onClick={handleDelete}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Email Reading Content */}
      <div className="p-8 max-w-4xl">
        {/* Email Subject Title */}
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 leading-snug">
          {selectedEmail.subject}
        </h2>

        {/* Sender & Recipient Information */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {selectedEmail.senderName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  {selectedEmail.senderName}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                  &lt;{selectedEmail.senderEmail}&gt;
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                to {selectedEmail.recipientEmail}
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400 dark:text-slate-500 shrink-0">
            <p>{new Date(selectedEmail.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <p className="mt-0.5">{new Date(selectedEmail.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* Body Content */}
        <div className="py-6 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
          {selectedEmail.bodyHtml ? (
            <div
              className="prose dark:prose-invert max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
            />
          ) : (
            <div className="whitespace-pre-wrap">{selectedEmail.bodyText}</div>
          )}
        </div>

        {/* Bottom Quick Reply Prompt Bar */}
        <div className="mt-8 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Tip: You can ask the AI co-pilot: <span className="font-medium text-slate-800 dark:text-slate-200">"Reply to this"</span> or <span className="font-medium text-slate-800 dark:text-slate-200">"Forward this to..."</span></span>
          </div>
          <button
            onClick={handleReply}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            Reply to Email
          </button>
        </div>

        {/* Conversation Thread / History (Bonus +3) */}
        {selectedThread && selectedThread.messages.length > 1 && (
          <ThreadView thread={selectedThread} currentEmailId={selectedEmail.id} />
        )}
      </div>
    </div>
  );
};
