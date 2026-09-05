import React from 'react';
import {
  Inbox,
  Send,
  Star,
  Trash2,
  PenSquare,
  Sparkles,
  Mail,
  Moon,
  Sun,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useMailStore } from '../../store/mailStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { useAuthStore } from '../../store/authStore.js';

export const Sidebar: React.FC = () => {
  const activeFolder = useMailStore((s) => s.activeFolder);
  const setActiveFolder = useMailStore((s) => s.setActiveFolder);
  const stats = useMailStore((s) => s.stats);
  const openCompose = useUIStore((s) => s.openCompose);
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const toggleAssistant = useUIStore((s) => s.toggleAssistant);
  const isAssistantOpen = useUIStore((s) => s.isAssistantOpen);
  const user = useAuthStore((s) => s.user);
  const connectGoogle = useAuthStore((s) => s.connectGoogle);
  const logout = useAuthStore((s) => s.logout);

  const navItems = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: stats.unreadCount },
    { id: 'starred', label: 'Starred', icon: Star, count: stats.starredCount },
    { id: 'sent', label: 'Sent', icon: Send, count: stats.sentCount },
    { id: 'trash', label: 'Trash', icon: Trash2, count: 0 },
  ];

  return (
    <aside className="w-64 flex flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen select-none">
      {/* Top Header */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-white text-base tracking-tight leading-tight">
                Nebula Mail
              </h1>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                AI UI Co-pilot
              </p>
            </div>
          </div>
        </div>

        {/* Compose Button */}
        <div className="p-3">
          <button
            onClick={() => openCompose({ mode: 'new' })}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md shadow-blue-600/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <PenSquare className="w-4 h-4" />
            <span>Compose Email</span>
          </button>
        </div>

        {/* Navigation Folders */}
        <nav className="px-2 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeFolder === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveFolder(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      isActive
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Actions */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {/* Assistant Toggle Button */}
        <button
          onClick={toggleAssistant}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            isAssistantOpen
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span>AI Assistant Panel</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
            {isAssistantOpen ? 'Active' : 'Closed'}
          </span>
        </button>

        {/* User Account Info */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2.5">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.displayName || 'Active Account'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.email || 'alex.developer@example.com'}
              </p>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
            {user?.isDemoUser ? (
              <button
                onClick={connectGoogle}
                className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Connect Gmail</span>
              </button>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Gmail Connected
              </span>
            )}

            <div className="flex items-center gap-1">
              <button
                onClick={toggleDarkMode}
                title="Toggle Theme"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={logout}
                title="Reset Session"
                className="p-1 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
