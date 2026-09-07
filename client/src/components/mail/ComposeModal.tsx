import React, { useEffect, useRef, useState } from 'react';
import { X, Send, Sparkles, Minus, Maximize2, Minimize2, Trash2, Paperclip, Bold, Italic, Smile } from 'lucide-react';
import { useUIStore } from '../../store/uiStore.js';
import { useMailStore } from '../../store/mailStore.js';

export const ComposeModal: React.FC = () => {
  const composeModal = useUIStore((s) => s.composeModal);
  const closeCompose = useUIStore((s) => s.closeCompose);
  const updateComposeFields = useUIStore((s) => s.updateComposeFields);
  const addToast = useUIStore((s) => s.addToast);
  const sendEmail = useMailStore((s) => s.sendEmail);
  const isSending = useMailStore((s) => s.isSending);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');

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
    <div
      className={`fixed transition-all z-50 select-none bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 shadow-2xl ${
        isMaximized
          ? 'inset-6 rounded-2xl flex flex-col'
          : isMinimized
          ? 'bottom-0 right-16 w-72 rounded-t-xl overflow-hidden'
          : 'bottom-0 right-12 w-full max-w-xl rounded-t-2xl flex flex-col max-h-[85vh]'
      }`}
    >
      {/* Gmail Header Bar */}
      <div
        onClick={() => isMinimized && setIsMinimized(false)}
        className="px-4 py-2.5 bg-[#f2f6fc] dark:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 rounded-t-xl cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wide">
            {composeModal.mode === 'reply' ? 'Reply' : composeModal.mode === 'forward' ? 'Forward' : 'New Message'}
          </span>

          {composeModal.isFilling && (
            <span className="flex items-center gap-1 text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 px-2 py-0.5 rounded-full animate-pulse">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>AI drafting...</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            title={isMinimized ? 'Expand' : 'Minimize'}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          {!isMinimized && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMaximized(!isMaximized);
              }}
              title={isMaximized ? 'Exit full screen' : 'Full screen'}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeCompose();
            }}
            title="Save & close"
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <form onSubmit={handleSend} className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Form Fields */}
          <div className="p-3 space-y-2 overflow-y-auto">
            {/* Recipient Field */}
            <div
              className={`flex items-center justify-between pb-1.5 border-b transition-colors ${
                composeModal.highlightedField === 'to'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 px-2 rounded-lg'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium w-8 shrink-0">To</span>
                <input
                  ref={toInputRef}
                  type="text"
                  value={composeModal.to}
                  onChange={(e) => updateComposeFields({ to: e.target.value })}
                  placeholder="Recipients"
                  className="w-full text-xs font-medium text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                {!showCcBcc && (
                  <button
                    type="button"
                    onClick={() => setShowCcBcc(true)}
                    className="hover:underline cursor-pointer"
                  >
                    Cc/Bcc
                  </button>
                )}
              </div>
            </div>

            {/* Optional Cc / Bcc */}
            {showCcBcc && (
              <>
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium w-8 shrink-0">Cc</span>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="Cc recipients"
                    className="w-full text-xs font-medium text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium w-8 shrink-0">Bcc</span>
                  <input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="Bcc recipients"
                    className="w-full text-xs font-medium text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Subject Field */}
            <div
              className={`flex items-center gap-2 pb-1.5 border-b transition-colors ${
                composeModal.highlightedField === 'subject'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 px-2 rounded-lg'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <input
                ref={subjectInputRef}
                type="text"
                value={composeModal.subject}
                onChange={(e) => updateComposeFields({ subject: e.target.value })}
                placeholder="Subject"
                className="w-full text-xs font-medium text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
              />
            </div>

            {/* Body Field */}
            <div
              className={`flex-1 min-h-[160px] transition-colors rounded-lg ${
                composeModal.highlightedField === 'body'
                  ? 'border border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 p-1'
                  : ''
              }`}
            >
              <textarea
                ref={bodyInputRef}
                rows={isMaximized ? 24 : 10}
                value={composeModal.body}
                onChange={(e) => updateComposeFields({ body: e.target.value })}
                placeholder="Write your email here... or ask Nebula Copilot to draft it for you!"
                className="w-full h-full text-xs text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Bottom Gmail Action Toolbar */}
          <div className="px-4 py-2.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              {/* Send Button (Gmail Pill Button) */}
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-2 px-5 py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white rounded-full text-xs font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{isSending ? 'Sending...' : 'Send'}</span>
                <Send className="w-3 h-3" />
              </button>

              {/* Formatting and attachment icons */}
              <div className="hidden sm:flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  title="Formatting options"
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Formatting options"
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Attach files"
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Insert emoji"
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Smile className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeCompose}
                title="Discard draft"
                className="p-2 rounded-full text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

