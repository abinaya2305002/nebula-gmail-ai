import React from 'react';
import { Filter, Calendar, Mail, X, Search, RotateCcw } from 'lucide-react';
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
    <div className="px-6 py-2.5 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs select-none">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium mr-1">
          <Filter className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Filters:</span>
        </div>

        {/* Read / Unread Status Pill Group */}
        <div className="inline-flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-0.5">
          <button
            onClick={() => setFilters({ isUnread: undefined })}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filters.isUnread === undefined
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilters({ isUnread: true })}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              filters.isUnread === true
                ? 'bg-teal-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            <span>Unread</span>
          </button>
          <button
            onClick={() => setFilters({ isUnread: false })}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filters.isUnread === false
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
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
                className={`px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50 border-teal-300 text-teal-800 dark:bg-teal-900/40 dark:border-teal-700 dark:text-teal-300 font-semibold'
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 font-semibold">
            <Mail className="w-3 h-3" />
            <span>From: {filters.sender}</span>
            <button
              onClick={() => setFilters({ sender: undefined })}
              className="hover:text-teal-950 dark:hover:text-white cursor-pointer ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Active Search Query Tag */}
        {filters.query && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 font-semibold">
            <Search className="w-3 h-3" />
            <span>Query: "{filters.query}"</span>
            <button
              onClick={() => setFilters({ query: undefined })}
              className="hover:text-cyan-950 dark:hover:text-white cursor-pointer ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-slate-500 hover:text-teal-700 dark:hover:text-teal-400 font-medium transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All Filters</span>
        </button>
      )}
    </div>
  );
};
