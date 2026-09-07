import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, RefreshCw, X, Zap, Menu, SlidersHorizontal, Settings, HelpCircle, LogOut, ExternalLink, Moon, Sun } from 'lucide-react';
import { useMailStore } from '../../store/mailStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { useAuthStore } from '../../store/authStore.js';

interface TopBarProps {
  isRealtimeConnected: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ isRealtimeConnected }) => {
  const filters = useMailStore((s) => s.filters);
  const setFilters = useMailStore((s) => s.setFilters);
  const fetchEmails = useMailStore((s) => s.fetchEmails);
  const isLoading = useMailStore((s) => s.isLoading);
  const isAssistantOpen = useUIStore((s) => s.isAssistantOpen);
  const toggleAssistant = useUIStore((s) => s.toggleAssistant);
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const user = useAuthStore((s) => s.user);
  const connectGoogle = useAuthStore((s) => s.connectGoogle);
  const logout = useAuthStore((s) => s.logout);

  const [searchInput, setSearchInput] = useState(filters.query || '');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Sync external filter changes (from AI commands) to local input
  useEffect(() => {
    setSearchInput(filters.query || '');
  }, [filters.query]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <header className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 select-none shrink-0 z-30">
      {/* Left: Hamburger & Gmail Brand */}
      <div className="flex items-center gap-3 w-60 shrink-0">
        <button
          type="button"
          title="Main menu"
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {/* Stylized Gmail Envelope Logo */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 via-blue-600 to-amber-500 flex items-center justify-center text-white shadow-xs">
            <span className="font-bold text-base tracking-tighter">M</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-800 dark:text-white">
            Nebula <span className="text-rose-500 font-bold">Gmail</span>
          </span>
        </div>
      </div>

      {/* Center: Google Gmail Pill Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl relative">
        <div className="relative flex items-center bg-[#eaf1fb] dark:bg-slate-800/90 hover:bg-[#e1eaf7] dark:hover:bg-slate-800 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-md rounded-full px-3.5 py-2 border border-transparent focus-within:border-slate-300 dark:focus-within:border-slate-700 transition-all">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mr-2.5" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search mail"
            className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              title="Search options"
              onClick={() => setFilters({ isUnread: filters.isUnread ? undefined : true })}
              className={`p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer ${
                filters.isUnread ? 'text-blue-600 dark:text-blue-400' : ''
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Real-time Push Sync Indicator */}
        <div
          title={isRealtimeConnected ? 'Push Channel Connected' : 'Push Connecting...'}
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            isRealtimeConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span>{isRealtimeConnected ? 'Live' : 'Connecting'}</span>
        </div>

        {/* Simulate Push Email Button */}
        <button
          onClick={handleSimulateEmail}
          disabled={isSimulating}
          title="Simulate incoming push email (SSE)"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Zap className={`w-3.5 h-3.5 text-amber-500 ${isSimulating ? 'animate-spin' : ''}`} />
          <span className="hidden xl:inline">Simulate Push</span>
        </button>

        {/* Manual Refresh */}
        <button
          onClick={() => fetchEmails()}
          disabled={isLoading}
          title="Refresh Mailbox"
          className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* AI Copilot Toggle Button */}
        <button
          onClick={toggleAssistant}
          title="Toggle Nebula AI Copilot"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all cursor-pointer ${
            isAssistantOpen
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* User Account Profile Avatar with Dropdown (Abinaya) */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            title="Google Account: Abinaya"
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500 transition-all cursor-pointer"
          >
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50">
              <div className="flex flex-col items-center text-center pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-600 to-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md mb-2">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                </div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                  {user?.displayName || 'Abinaya'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {user?.email || 'abinaya@example.com'}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {user?.isDemoUser ? 'Demo Workspace' : 'Gmail Connected'}
                </span>
              </div>

              <div className="py-2 space-y-1">
                {user?.isDemoUser && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      connectGoogle();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Connect Google Account</span>
                  </button>
                )}

                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
                    <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

