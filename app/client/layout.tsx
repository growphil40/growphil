'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../ThemeProvider';
import {
  TrendingUp,
  LogOut,
  Database,
  Menu,
  X,
  Shield,
  Gauge,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Layers,
  Bell,
  LayoutDashboard,
  BarChart3,
  Settings
} from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  const navItems = isSuperAdmin
    ? [
        { name: 'System Leads', path: '/client/leads', icon: Layers },
        { name: 'Agencies', path: '/client/agencies', icon: Shield },
      ]
    : [
        { name: 'User Dashboard', path: '/client/leads?tab=dashboard', icon: LayoutDashboard },
        { name: 'Leads', path: '/client/leads', icon: Layers },
        { name: 'Reports', path: '/client/revenue', icon: BarChart3 },
        { name: 'Settings', path: '/client/integrations/google-sheets', icon: Settings },
      ];

  // Helper mapping in case LayoutDashboard / BarChart3 / Settings are used by navItems:
  const LayoutDashboardIcon = LayoutDashboard;
  const BarChart3Icon = BarChart3;
  const SettingsIcon = Settings;

  const getPageTitle = () => {
    if (pathname.startsWith('/client/leads')) return isSuperAdmin ? 'System Leads' : 'Leads';
    if (pathname.startsWith('/client/agencies')) return 'Agencies';
    if (pathname.startsWith('/client/follow-ups')) return 'Follow-ups';
    if (pathname.startsWith('/client/sales')) return 'Sales log';
    if (pathname.startsWith('/client/revenue')) return 'Revenue Analytics';
    if (pathname.startsWith('/client/meta/dashboard')) return 'Meta Ads';
    if (pathname.startsWith('/client/integrations')) return 'Integrations Hub';
    return 'Client Dashboard';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-premium font-sans">
      
      {/* ── DESKTOP SIDEBAR ── */}
      <aside 
        className={`hidden md:flex flex-col justify-between h-full bg-sidebar border-r border-border text-slate-300 shrink-0 select-none transition-all duration-300 relative ${
          isSidebarCollapsed ? 'w-20' : 'w-[280px]'
        }`}
      >
        {/* Collapse Toggle Trigger button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute top-8 -right-3 h-6 w-6 rounded-full bg-primary border border-border text-black flex items-center justify-center cursor-pointer shadow hover:scale-105 active:scale-95 transition-all z-20"
        >
          {isSidebarCollapsed ? <ChevronRight size={12} strokeWidth={3} /> : <ChevronLeft size={12} strokeWidth={3} />}
        </button>

        <div className="flex flex-col flex-1 overflow-y-auto p-5 scrollbar-none">
          {/* Logo Brand Header */}
          <div className={`mb-6 flex items-center gap-3 transition-all ${isSidebarCollapsed ? 'justify-center px-0' : 'px-2'}`}>
            <div className="h-8.5 w-8.5 shrink-0 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center font-black text-black text-md shadow-lg shadow-primary/25">
              GP
            </div>
            {!isSidebarCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="text-sm font-black tracking-tight text-white block">GrowPhil</span>
                <span className="text-[9px] text-primary font-bold tracking-wider uppercase block -mt-1">
                  {isSuperAdmin ? 'Super Admin' : 'Partner Portal'}
                </span>
              </div>
            )}
          </div>

          {/* Workspace Switcher */}
          {!isSidebarCollapsed && (
            <div className="mb-4 px-2">
              <button className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-card border border-border hover:bg-hover hover:border-border/20 transition-premium text-left cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-6 w-6 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center font-bold text-[10px] text-secondary shrink-0">
                    PP
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">Partner Portal</p>
                    <p className="text-[9px] text-text-secondary font-medium block -mt-0.5">Connected Workspace</p>
                  </div>
                </div>
                <ChevronDown size={13} className="text-text-secondary shrink-0" />
              </button>
            </div>
          )}

          {/* Sidebar Search */}
          {!isSidebarCollapsed && (
            <div className="mb-5 px-2">
              <button className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-card/50 border border-border hover:border-border/20 transition-premium text-left text-text-secondary/80 hover:text-text-secondary cursor-pointer text-xs">
                <div className="flex items-center gap-2">
                  <Search size={13} />
                  <span className="text-[11px]">Search workspace...</span>
                </div>
                <span className="text-[9px] font-mono font-bold bg-card-secondary border border-border px-1.5 py-0.5 rounded-lg">/</span>
              </button>
            </div>
          )}

          {/* Links navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const [itemPath, itemQuery] = item.path.split('?');
              const itemTab = itemQuery ? new URLSearchParams(itemQuery).get('tab') : null;
              const isActive = pathname.startsWith(itemPath) && (
                itemQuery ? (tab === itemTab) : (tab === null)
              );
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.name}-${item.path}`}
                  href={item.path}
                  className={`flex items-center rounded-xl text-xs font-bold uppercase tracking-wider transition-premium border ${
                    isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-2.5 gap-3.5'
                  } ${
                    isActive
                      ? 'bg-primary/10 text-primary border-primary/20 shadow-md shadow-primary/5'
                      : 'text-text-secondary border-transparent hover:bg-hover hover:text-white'
                  }`}
                  title={isSidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                  {!isSidebarCollapsed && (
                    <span className="animate-in fade-in duration-200">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={`border-t border-border p-5 space-y-4 bg-card transition-all ${isSidebarCollapsed ? 'items-center text-center' : ''}`}>
          {user && !isSidebarCollapsed && (
            <div className="px-2 space-y-0.5 animate-in fade-in duration-200">
              <p className="text-[9px] text-primary font-bold tracking-wider uppercase">User Profile</p>
              <p className="text-xs font-bold text-white truncate max-w-[200px]" title={user.email}>{user.email}</p>
              <p className="text-[8px] text-text-secondary font-semibold tracking-wider uppercase">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          )}
          <button
            onClick={logout}
            className={`flex items-center rounded-xl text-xs font-bold uppercase tracking-wider text-danger border border-transparent hover:bg-danger/10 transition-premium cursor-pointer w-full ${
              isSidebarCollapsed ? 'justify-center p-3' : 'px-4 py-2.5 gap-3.5'
            }`}
            title={isSidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="h-4 w-4 text-danger shrink-0" />
            {!isSidebarCollapsed && <span className="animate-in fade-in duration-200">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── MOBILE DRAWER NAVIGATION ── */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-xs transition-opacity duration-200">
          <div className="w-64 bg-[#0B0F19] border-r border-border flex flex-col justify-between h-full p-5 animate-in slide-in-from-left duration-250">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center font-black text-black text-lg">
                    G
                  </div>
                  <div>
                    <span className="text-base font-black tracking-tight text-white block">GrowPhil</span>
                    <span className="text-[10px] text-primary font-bold tracking-wider uppercase block -mt-1">
                      {isSuperAdmin ? 'Super Admin' : 'Partner Portal'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileOpen(false)} 
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-hover cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
 
              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const [itemPath, itemQuery] = item.path.split('?');
                  const itemTab = itemQuery ? new URLSearchParams(itemQuery).get('tab') : null;
                  const isActive = pathname.startsWith(itemPath) && (
                    itemQuery ? (tab === itemTab) : (tab === null)
                  );
                  const Icon = item.icon;
                  return (
                    <Link
                      key={`${item.name}-${item.path}`}
                      href={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-premium border ${
                        isActive
                          ? 'bg-primary/10 text-primary border-primary/20 shadow-md shadow-primary/5'
                          : 'text-slate-450 border-transparent hover:bg-hover hover:text-white'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 text-slate-500" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
 
            <div className="border-t border-border pt-5 space-y-4 bg-card -mx-5 px-5">
              {user && (
                <div className="px-2 space-y-0.5">
                  <p className="text-[10px] text-primary font-bold tracking-wider uppercase">User Profile</p>
                  <p className="text-xs font-bold text-white truncate">{user.email}</p>
                  <p className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  logout();
                }}
                className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-450 border border-transparent hover:bg-rose-500/10 transition-premium cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5 text-rose-500" />
                Sign Out
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileOpen(false)} />
        </div>
      )}

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        
        {/* Sticky Glassmorphic Header */}
        <header className="h-20 sticky top-0 z-30 glass-header flex items-center px-5 md:px-8 shrink-0 select-none">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="block md:hidden text-text-secondary hover:text-white p-2 rounded-xl hover:bg-hover transition-premium cursor-pointer"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-text-secondary/70 uppercase tracking-widest">Portal</span>
                <span className="text-border/60">/</span>
                <span className="text-white uppercase tracking-widest">{getPageTitle()}</span>
              </div>
            </div>

            {/* Header Right Tools */}
            <div className="flex items-center gap-4">
              
              {/* Active Connection Pulse */}
              <div className="flex items-center gap-2 p-1.5 px-3 rounded-full bg-success/10 text-success border border-success/20 text-[9px] font-bold tracking-widest uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Connected Node
              </div>

              {/* Notification Bell */}
              <button className="p-2.5 rounded-xl border border-border bg-card text-text-secondary hover:text-white hover:bg-hover active:scale-95 transition-premium cursor-pointer relative">
                <Bell size={14} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary border-2 border-card" />
              </button>

              {/* Theme Selector */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl border border-border bg-card text-text-secondary hover:text-white hover:bg-hover active:scale-95 transition-premium cursor-pointer"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic page viewport content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto min-h-full space-y-6">
            {children}
          </div>
        </div>
      </main>
      
    </div>
  );
}
