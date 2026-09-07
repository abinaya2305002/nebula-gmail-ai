import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { TimelineStep } from '../../types/ai.js';

interface ActionTimelineProps {
  timeline: TimelineStep[];
}

export const ActionTimeline: React.FC<ActionTimelineProps> = ({ timeline }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="my-2 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 overflow-hidden text-xs">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between bg-teal-100/50 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 font-semibold transition-colors hover:bg-teal-100/80 dark:hover:bg-teal-900/60 cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Execution Steps ({timeline.length})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-teal-700 dark:text-teal-300" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-teal-700 dark:text-teal-300" />
        )}
      </button>

      {isExpanded && (
        <div className="p-2.5 space-y-1.5">
          {timeline.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <span className="mt-0.5 shrink-0">
                {step.status === 'completed' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                )}
              </span>
              <span className="font-mono text-[11px] leading-tight">{step.step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
