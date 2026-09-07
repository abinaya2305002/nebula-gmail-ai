import React, { useState, useRef, useEffect } from 'react';
import {
  Inbox,
  RefreshCw,
  MailCheck,
  Trash2,
  Tag,
  Users,
  Info,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { EmailItem } from './EmailItem.js';
import { useMailStore } from '../../store/mailStore.js';
import { useUIStore } from '../../store/uiStore.js';

export const EmailList: React.FC = () => {
  const emails = useMailStore((s) => s.emails);
  const isLoading = useMailStore((s) => s.isLoading);
  const selectedEmail = useMailStore((s) => s.selectedEmail);
  const activeFolder = useMailStore((s) => s.activeFolder);
  const filters = useMailStore((s) => s.filters);
  const resetFilters = useMailStore((s) => s.resetFilters);
  const fetchEmails = useMailStore((s) => s.fetchEmails);
  const openCompose = useUIStore((s) => s.openCompose);

  const [activeTab, setActiveTab] = useState<'primary' | 'promotions' | 'social' | 'updates'>('primary');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectMenuOpen, setIsSelectMenuOpen] = useState(false);
  const selectMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectMenuRef.current && !selectMenuRef.current.contains(e.target as Node)) {
        setIsSelectMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFolderDisplayName = (folder: string) => {
    switch (folder) {
      case 'inbox':
        return 'Inbox';
      case 'sent':
        return 'Sent';
      case 'starred':
        return 'Starred';
      case 'snoozed':
        return 'Snoozed';
      case 'drafts':
        return 'Drafts';
      case 'trash':
        return 'Trash';
      default:
        return 'All Mail';
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === emails.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(emails.map((e) => e.id));
    }
  };

  const selectNone = () => {
    setSelectedIds([]);
    setIsSelectMenuOpen(false);
  };

  const selectAll = () => {
    setSelectedIds(emails.map((e) => e.id));
    setIsSelectMenuOpen(false);
  };

  const selectRead = () => {
    setSelectedIds(emails.filter((e) => !e.isUnread).map((e) => e.id));
    setIsSelectMenuOpen(false);
  };

  const selectUnread = () => {
    setSelectedIds(emails.filter((e) => e.isUnread).map((e) => e.id));
    setIsSelectMenuOpen(false);
  };

  const selectStarred = () => {
    setSelectedIds(emails.filter((e) => e.isStarred).map((e) => e.id));
    setIsSelectMenuOpen(false);
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Filter emails based on category tabs if on Inbox
  const displayedEmails = activeFolder === 'inbox' && activeTab !== 'primary'
    ? emails.filter((e) => {
        if (activeTab === 'updates') {
          return e.subject.toLowerCase().includes('pr') || e.subject.toLowerCase().includes('github') || e.senderName.toLowerCase().includes('github');
        }
        return false;
      })
    : emails;

  const categoryTabs = [
    { id: 'primary', label: 'Primary', icon: Inbox, badge: emails.filter((e) => e.isUnread).length, activeColor: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' },
    { id: 'promotions', label: 'Promotions', icon: Tag, badge: 0, activeColor: 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400' },
    { id: 'social', label: 'Social', icon: Users, badge: 0, activeColor: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' },
    { id: 'updates', label: 'Updates', icon: Info, badge: 1, activeColor: 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* 1. Master Toolbar Above Emails (Authentic Gmail Toolbar) */}
      <div className="px-4 py-2 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 select-none bg-white dark:bg-slate-900">
        <div className="flex items-center gap-1">
          {/* Master Select All Checkbox + Dropdown Caret */}
          <div className="relative flex items-center" ref={selectMenuRef}>
            <button
              onClick={handleSelectAll}
              className="p-1.5 rounded-l-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Select"
            >
              {selectedIds.length > 0 && selectedIds.length === emails.length ? (
                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setIsSelectMenuOpen(!isSelectMenuOpen)}
              className="p-1 rounded-r-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Select options"
            >
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Select Dropdown Menu */}
            {isSelectMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-40">
                <button onClick={selectAll} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer">
                  All
                </button>
                <button onClick={selectNone} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer">
                  None
                </button>
                <button onClick={selectRead} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer">
                  Read
                </button>
                <button onClick={selectUnread} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer">
                  Unread
                </button>
                <button onClick={selectStarred} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer">
                  Starred
                </button>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchEmails()}
            disabled={isLoading}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer ml-1"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1.5" />

          {/* Folder Title */}
          <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
            {getFolderDisplayName(activeFolder)}
          </span>
        </div>

        {/* Counter and Pagination Range */}
        <div className="flex items-center gap-2">
          {filters.dateRangeDays && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800 text-[11px]">
              Last {filters.dateRangeDays} days
            </span>
          )}

          {filters.limit && (
            <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-medium border border-sky-200 dark:border-sky-800 text-[11px]">
              Limit: {filters.limit}
            </span>
          )}

          <span className="text-slate-500 font-normal">
            {emails.length === 0 ? '0 of 0' : `1–${displayedEmails.length} of ${emails.length}`}
          </span>

          <div className="flex items-center">
            <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer" title="Newer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer" title="Older">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Category Tabs (Gmail Primary, Promotions, Social, Updates) */}
      {activeFolder === 'inbox' && (
        <div className="flex border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
          {categoryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? `${tab.activeColor} font-semibold`
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. List Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Retrieving messages...</p>
          </div>
        ) : displayedEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3 border border-teal-200/60 dark:border-teal-800">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base mb-1">
              No emails found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              {filters.query || filters.sender || filters.dateRangeDays || filters.isUnread !== undefined
                ? 'No messages matched your current filters or AI search parameters.'
                : 'Your mailbox folder is empty.'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={resetFilters}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => openCompose({ mode: 'new' })}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                Compose New Email
              </button>
            </div>
          </div>
        ) : (
          displayedEmails.map((email) => (
            <EmailItem
              key={email.id}
              email={email}
              isSelected={selectedEmail?.id === email.id}
              isChecked={selectedIds.includes(email.id)}
              onToggleCheck={() => handleToggleSelect(email.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
