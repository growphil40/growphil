'use client';

import React, { useState } from 'react';
import { Search, Bell, X, SlidersHorizontal } from 'lucide-react';

interface MobileHeaderProps {
  title?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  connected?: boolean;
  onToggleFilters?: () => void;
  hasActiveFilters?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title = 'Leads Pipeline',
  searchValue,
  onSearchChange,
  connected = true,
  onToggleFilters,
  hasActiveFilters = false,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="md:hidden sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-900/80 px-4 py-3 transition-all">
      <div className="flex items-center justify-between gap-3">
        {!isSearchOpen ? (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl font-bold text-white tracking-tight font-display truncate">
                {title}
              </h1>
              {connected && (
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Search leads"
              >
                <Search className="h-4 w-4" />
              </button>

              {onToggleFilters && (
                <button
                  onClick={onToggleFilters}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer relative ${
                    hasActiveFilters
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                  aria-label="Filter leads"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {hasActiveFilters && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-indigo-500" />
                  )}
                </button>
              )}

              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-400 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 w-full animate-in fade-in duration-200">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                autoFocus
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by name, phone, email..."
                className="w-full rounded-xl border border-indigo-500/50 bg-slate-900 pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setIsSearchOpen(false);
                onSearchChange('');
              }}
              className="text-xs text-slate-400 hover:text-white font-medium px-1 cursor-pointer shrink-0"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
