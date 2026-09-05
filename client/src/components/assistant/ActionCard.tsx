import React, { useState } from 'react';
import { Send, Edit3, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
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

  return (
    <div className="my-2.5 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/30 dark:to-slate-900 shadow-xs">
      <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        <span>{cardData.title}</span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 ml-auto">
          Human-in-the-loop
        </span>
      </div>

      <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
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
          <CheckCircle className="w-4 h-4" />
          <span>Email successfully confirmed and sent!</span>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={handleConfirmSend}
            disabled={isSending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>{isSending ? 'Sending...' : 'Confirm & Send'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
