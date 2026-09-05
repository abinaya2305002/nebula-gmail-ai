import React, { useEffect, useRef } from 'react';
import { X, Minus, Send, Sparkles, AlertCircle, Paperclip } from 'lucide-react';
import { useUIStore } from '../../store/uiStore.js';
import { useMailStore } from '../../store/mailStore.js';

export const ComposeModal: React.FC = () => {
  const composeModal = useUIStore((s) => s.composeModal);
  const closeCompose = useUIStore((s) => s.closeCompose);
  const updateComposeFields = useUIStore((s) => s.updateComposeFields);
  const addToast = useUIStore((s) => s.addToast);
  const sendEmail = useMailStore((s) => s.sendEmail);
  const isSending = useMailStore((s) => s.isSending);

  const toInputRef = useRef<HTMLInputElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus effect when fields are updated or highlighted by AI
  useEffect(() => {
    if (composeModal.highlightedField === 'to') {
      toInputRef.current?.focus();
    } else if (composeModal.highlightedField === 'subject') {
      subjectInputRef.current?.focus();
    } else if (composeModal.highlightedField === 'body') {
      bodyInputRef.current?.focus();
    }
  }, [composeModal.highlightedField]);

  if (!composeModal.isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!composeModal.to.trim()) {
      alert('Please specify a recipient');
      return;
    }
    if (!composeModal.subject.trim()) {
      alert('Please specify a subject');
      return;
    }

    const success = await sendEmail({
      to: composeModal.to,
      subject: composeModal.subject,
      body: composeModal.body,
      replyToId: composeModal.replyToId,
      threadId: composeModal.threadId,
    });

    if (success) {
      addToast({
        title: 'Email Sent',
        message: `Your message to ${composeModal.to} has been sent successfully.`,
        type: 'success',
      });
      closeCompose();
    } else {
      alert('Failed to send email. Please check your connection.');
    }
  };

  return (
    <div className="fixed bottom-0 right-6 w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden flex flex-col transition-all">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-slate-800 dark:bg-slate-950 text-white flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">
            {composeModal.mode === 'reply' ? 'Reply Message' : composeModal.mode === 'forward' ? 'Forward Message' : 'New Message'}
          </span>

          {composeModal.isFilling && (
            <span className="flex items-center gap-1 text-[11px] font-medium bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full animate-pulse">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>AI is populating fields...</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={closeCompose}
            className="p-1 rounded hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSend} className="flex-1 flex flex-col p-4 gap-3">
        {/* Recipient Field */}
        <div
          className={`flex items-center gap-2 pb-2 border-b transition-colors ${
            composeModal.highlightedField === 'to'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 px-2 rounded-lg'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-xs text-slate-400 font-medium w-14 shrink-0">To:</span>
          <input
            ref={toInputRef}
            type="text"
            value={composeModal.to}
            onChange={(e) => updateComposeFields({ to: e.target.value })}
            placeholder="recipient@example.com"
            className="w-full text-xs font-medium text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
          />
        </div>

        {/* Subject Field */}
        <div
          className={`flex items-center gap-2 pb-2 border-b transition-colors ${
            composeModal.highlightedField === 'subject'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 px-2 rounded-lg'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-xs text-slate-400 font-medium w-14 shrink-0">Subject:</span>
          <input
            ref={subjectInputRef}
            type="text"
            value={composeModal.subject}
            onChange={(e) => updateComposeFields({ subject: e.target.value })}
            placeholder="Subject line"
            className="w-full text-xs font-medium text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
          />
        </div>

        {/* Body Field */}
        <div
          className={`flex-1 min-h-48 transition-colors rounded-lg p-1 ${
            composeModal.highlightedField === 'body'
              ? 'border border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
              : ''
          }`}
        >
          <textarea
            ref={bodyInputRef}
            rows={10}
            value={composeModal.body}
            onChange={(e) => updateComposeFields({ body: e.target.value })}
            placeholder="Write your email here... or ask the AI co-pilot to draft it!"
            className="w-full h-full text-xs text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI UI-controlled form</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeCompose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Discard
            </button>

            <button
              type="submit"
              disabled={isSending}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
