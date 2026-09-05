import React from 'react';
import { Filter, Calendar, Mail, CheckCircle, X, Sparkles } from 'lucide-react';
import { useMailStore } from '../../store/mailStore.js';

export const FilterBar: React.FC = () => {
  const filters = useMailStore((s) => s.filters);
  const setFilters = useMailStore((s) => s.setFilters);
  const resetFilters = useMailStore((s) => s.resetFilters);

  const dateOptions = [
    { label: 'Any time', value: undefined },
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 10 days', value: 10 },
    { label: 'Last 30 days', value: 30 },
  ];

  const hasActiveFilters = Boolean(
    filters.query ||
    filters.sender ||
    filters.dateRangeDays ||
    filters.isUnread !== undefined
  );

  return (
    <div className="px-6 py-2.5 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Read / Unread Status Filter */}
        <div className="inline-flex rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5">
          <button
            onClick={() => setFilters({ isUnread: undefined })}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filters.isUnread === undefined
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilters({ isUnread: true })}
            className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
              filters.isUnread === true
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Unread</span>
          </button>
          <button
            onClick={() => setFilters({ isUnread: false })}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filters.isUnread === false
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Read
          </button>
        </div>

        {/* Date Range Chips */}
        <div className="flex items-center gap-1">
          {dateOptions.map((opt) => {
            const isSelected = filters.dateRangeDays === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => setFilters({ dateRangeDays: opt.value })}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Sender Filter Tag */}
        {filters.sender && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium">
            <Mail className="w-3 h-3" />
            <span>From: {filters.sender}</span>
            <button
              onClick={() => setFilters({ sender: undefined })}
              className="hover:text-indigo-900 dark:hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Active Query Filter Tag */}
        {filters.query && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-medium">
            <span>Query: "{filters.query}"</span>
            <button
              onClick={() => setFilters({ query: undefined })}
              className="hover:text-amber-900 dark:hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-medium transition-colors"
        >
          <X className="w-3 h-3" />
          <span>Clear all filters</span>
        </button>
      )}
    </div>
  );
};
