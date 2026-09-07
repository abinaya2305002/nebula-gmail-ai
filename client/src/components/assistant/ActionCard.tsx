import React, { useState } from 'react';
import { Send, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useMailStore } from '../../store/mailStore.js';
import { useUIStore } from '../../store/uiStore.js';

interface ActionCardProps {
  cardData: {
    title: string;
    to: string;
    subject: string;
    preview: string;
    action: string;
  };
}

export const ActionCard: React.FC<ActionCardProps> = ({ cardData }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const sendEmail = useMailStore((s) => s.sendEmail);
  const closeCompose = useUIStore((s) => s.closeCompose);
  const addToast = useUIStore((s) => s.addToast);

  const handleConfirmSend = async () => {
    setIsSending(true);
    const success = await sendEmail({
      to: cardData.to,
      subject: cardData.subject,
      body: cardData.preview,
    });
    setIsSending(false);

    if (success) {
      setIsConfirmed(true);
      closeCompose();
      addToast({
        title: 'Email Sent via AI Action',
        message: `Successfully dispatched to ${cardData.to}`,
        type: 'success',
      });
    } else {
      alert('Failed to send email.');
    }
  };

  const handleDiscard = () => {
    closeCompose();
    addToast({
      title: 'Draft Discarded',
      message: 'Compose modal closed',
      type: 'info',
    });
  };

  return (
    <div className="my-2.5 p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-gradient-to-b from-teal-50/50 to-white dark:from-teal-950/30 dark:to-slate-900 shadow-xs select-none">
      <div className="flex items-center gap-2 mb-2 text-teal-800 dark:text-teal-200 font-semibold text-xs">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        <span>{cardData.title}</span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 ml-auto">
          Human-in-the-loop
        </span>
      </div>

      <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
        <p>
          <span className="font-semibold text-slate-500 dark:text-slate-400">To:</span> {cardData.to}
        </p>
        <p>
          <span className="font-semibold text-slate-500 dark:text-slate-400">Subject:</span> {cardData.subject}
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] italic pt-1 border-t border-slate-100 dark:border-slate-700 mt-1">
          "{cardData.preview}"
        </p>
      </div>

      {isConfirmed ? (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Email confirmed and dispatched!</span>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={handleDiscard}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Discard</span>
          </button>
          <button
            onClick={handleConfirmSend}
            disabled={isSending}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>{isSending ? 'Sending...' : 'Confirm & Send'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
