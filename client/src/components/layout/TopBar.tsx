import React, { useState, useEffect } from 'react';
import { Search, Radio, Sparkles, RefreshCw, X, Zap } from 'lucide-react';
import { useMailStore } from '../../store/mailStore.js';
import { useUIStore } from '../../store/uiStore.js';

interface TopBarProps {
  isRealtimeConnected: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ isRealtimeConnected }) => {
  const filters = useMailStore((s) => s.filters);
  const setFilters = useMailStore((s) => s.setFilters);
  const resetFilters = useMailStore((s) => s.resetFilters);
  const fetchEmails = useMailStore((s) => s.fetchEmails);
  const isLoading = useMailStore((s) => s.isLoading);
  const isAssistantOpen = useUIStore((s) => s.isAssistantOpen);
  const toggleAssistant = useUIStore((s) => s.toggleAssistant);

  const [searchInput, setSearchInput] = useState(filters.query || '');
  const [isSimulating, setIsSimulating] = useState(false);

  // Sync external filter changes (from AI commands) to local input
  useEffect(() => {
    setSearchInput(filters.query || '');
  }, [filters.query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ query: searchInput.trim() });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setFilters({ query: undefined });
  };

  // Trigger push simulation for evaluation
  const handleSimulateEmail = async () => {
    try {
      setIsSimulating(true);
      await fetch('http://localhost:5000/api/sync/trigger-simulated', { method: 'POST' });
    } catch (err) {
      console.error('Failed to trigger simulated email:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const hasActiveFilters = Boolean(
    filters.query || filters.sender || filters.dateRangeDays || filters.isUnread !== undefined
  );

  return (
    <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 select-none">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search emails by sender, subject, keywords... or ask the AI co-pilot"
            className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Real-time Sync Status Indicator */}
        <div
          title={isRealtimeConnected ? 'Real-time Push Sync Active' : 'Connecting to Push Stream...'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isRealtimeConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="hidden sm:inline">{isRealtimeConnected ? 'Live Sync' : 'Connecting'}</span>
        </div>

        {/* Demo Button: Trigger Incoming Email (Zero Manual Refresh) */}
        <button
          onClick={handleSimulateEmail}
          disabled={isSimulating}
          title="Simulate an incoming email to test real-time push synchronization without page refresh"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-all active:scale-95"
        >
          <Zap className={`w-3.5 h-3.5 text-indigo-500 ${isSimulating ? 'animate-spin' : ''}`} />
          <span>Simulate Push Email</span>
        </button>

        {/* Manual Refresh */}
        <button
          onClick={() => fetchEmails()}
          disabled={isLoading}
          title="Manual Refresh"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* Assistant Panel Toggle */}
        <button
          onClick={toggleAssistant}
          title="Toggle AI Co-pilot Panel"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all ${
            isAssistantOpen
              ? 'bg-blue-600 text-white shadow-blue-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>AI Co-pilot</span>
        </button>
      </div>
    </header>
  );
};
