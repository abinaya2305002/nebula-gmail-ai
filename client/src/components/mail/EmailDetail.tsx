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
  Tag,
  Archive,
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
        <p className="text-sm font-medium">Select an email to read</p>
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
      {/* Top Action Toolbar (Authentic Gmail Detail Toolbar) */}
      <div className="px-6 py-2.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between select-none sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs z-10">
        <div className="flex items-center gap-1">
          <button
            onClick={handleBack}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer mr-2"
            title="Back to Inbox"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              useUIStore.getState().addToast({ title: 'Archived', message: 'Email archived', type: 'info' });
              handleBack();
            }}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            onClick={handleDelete}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              useMailStore.getState().markAsRead(selectedEmail.id, true);
              handleBack();
            }}
            className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Mark as unread"
          >
            <Mail className="w-4 h-4" />
          </button>

          <button
            onClick={() => toggleStar(selectedEmail.id)}
            className="p-2 rounded-full text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={selectedEmail.isStarred ? 'Starred' : 'Not starred'}
          >
            <Star
              className={`w-4 h-4 ${
                selectedEmail.isStarred
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-400 dark:text-slate-600'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReply}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>

          <button
            onClick={handleForward}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Forward className="w-3.5 h-3.5" />
            <span>Forward</span>
          </button>
        </div>
      </div>

      {/* Main Email Reading Content */}
      <div className="p-8 max-w-4xl">
        {/* Email Subject Title & Badge */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
            {selectedEmail.subject}
          </h2>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
            <Tag className="w-3 h-3" />
            <span>Inbox</span>
          </span>
        </div>

        {/* Sender & Recipient Information */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
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
                to me &lt;{selectedEmail.recipientEmail}&gt;
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

        {/* Bottom Gmail Reply / Forward Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <button
            onClick={handleReply}
            className="flex items-center gap-2 px-6 py-2 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <Reply className="w-4 h-4 text-slate-500" />
            <span>Reply</span>
          </button>

          <button
            onClick={handleForward}
            className="flex items-center gap-2 px-6 py-2 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            <Forward className="w-4 h-4 text-slate-500" />
            <span>Forward</span>
          </button>
        </div>

        {/* Conversation Thread / History */}
        {selectedThread && selectedThread.messages.length > 1 && (
          <ThreadView thread={selectedThread} currentEmailId={selectedEmail.id} />
        )}
      </div>
    </div>
  );
};
