'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLeads } from '../../../hooks/useLeads';
import { useSocket } from '../../../hooks/useSocket';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';
import { LeadStage, Lead } from '../../../types';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

import { 
  Search, 
  Filter, 
  ChevronDown,
  LayoutGrid,
  List,
  Plus,
  Upload,
  Download,
  Trash2,
  X
} from 'lucide-react';

// Import Modular Components
import { MobileHeader } from '@/components/leads/MobileHeader';
import { QuickFilterChips } from '@/components/leads/QuickFilterChips';
import { TodaysFollowUpsSection } from '@/components/leads/TodaysFollowUpsSection';
import { CompactLeadCard } from '@/components/leads/CompactLeadCard';
import { CallResultBottomSheet } from '@/components/leads/CallResultBottomSheet';
import { ReminderSchedulerDrawer } from '@/components/leads/ReminderSchedulerDrawer';
import { MobileFAB } from '@/components/leads/MobileFAB';
import { OperationalDashboardView } from '@/components/leads/OperationalDashboardView';
import { ManagerKanbanView } from '@/components/leads/ManagerKanbanView';
import { ActivityTimelineModal } from '@/components/leads/ActivityTimelineModal';

const STAGES: { value: LeadStage; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Connected' },
  { value: 'NEGOTIATION', label: 'Proposal' },
  { value: 'FOLLOW_UP', label: 'Follow Up (F1)' },
  { value: 'QUALIFIED', label: 'Follow Up (F2)' },
  { value: 'LOST', label: 'Follow Up (F3)' },
  { value: 'BOOKED', label: 'Booked' },
  { value: 'WON', label: 'Won' },
  { value: 'NO_NEED', label: 'No Need' },
  { value: 'WRONG_LEAD', label: 'Wrong Lead' }
];

const SOURCE_TYPES = [
  { value: 'META_ADS', label: 'Meta Ads' },
  { value: 'GOOGLE_SHEETS', label: 'Google Sheets' },
  { value: 'CSV', label: 'CSV Import' },
  { value: 'WEBHOOK', label: 'Webhook' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'WHATSAPP', label: 'WhatsApp' }
];

const cleanText = (text: string | null | undefined): string => {
  if (!text) return '';
  let cleaned = text.replace(/<[^>]*>/g, '');
  return cleaned.replace(/[<>]/g, '');
};

export default function LeadsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  const {
    leads,
    setLeads,
    loading,
    error,
    filters,
    setFilters,
    prependLead,
    attachFollowUpToLead,
    updateLeadStage,
    deleteLead,
    deleteLeads,
  } = useLeads({ page: 1, limit: 100 });

  const { socket, connected } = useSocket();

  // Dashboard logs state
  const [notificationLogs, setNotificationLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchNotificationLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.get('/v1/client/telegram/logs');
      setNotificationLogs(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch notification logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (tab === 'dashboard') {
      fetchNotificationLogs();
    }
  }, [tab]);

  // View state: 'list' default on mobile, 'board' option for desktop
  const [viewMode, setViewMode] = useState<'board' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; businessName: string; agency: { name: string } }>>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(new Set());

  // Call Workflow & Bottom Sheet State
  const [callingLead, setCallingLead] = useState<Lead | null>(null);
  const [isCallResultOpen, setIsCallResultOpen] = useState(false);

  // Activity Timeline Modal State
  const [activityLead, setActivityLead] = useState<Lead | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  // Follow-up Reminder Drawer State
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderLead, setReminderLead] = useState<Lead | null>(null);
  const [reminderTargetStage, setReminderTargetStage] = useState<LeadStage | null>(null);

  // Manual Add Lead Drawer State
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [newLeadData, setNewLeadData] = useState({ name: '', email: '', phone: '', city: '', source: 'MANUAL', stage: 'NEW' as LeadStage });
  const [isSubmittingNewLead, setIsSubmittingNewLead] = useState(false);

  // Toasts
  type ToastEntry =
    | { id: string; message: string; type: 'success' | 'warning' | 'error' }
    | { id: string; type: 'lead_new'; title: string; name: string; phone: string };

  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const addLeadToast = useCallback((lead: Record<string, any>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, {
      id,
      type: 'lead_new' as const,
      title: 'New Lead Received',
      name: lead?.name || 'Unknown',
      phone: lead?.phone || '',
    }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const trackNewLead = useCallback((leadId: string) => {
    setNewLeadIds((prev) => new Set([...prev, leadId]));
    setTimeout(() => {
      setNewLeadIds((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }, 3000);
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
        } catch {}
      });
    } catch {}
  }, []);

  const triggerDesktopNotification = useCallback((lead: Record<string, any>) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      new Notification('🎉 New Lead Received', {
        body: `${lead?.name || 'Unknown'}${lead?.phone ? `\n${lead.phone}` : ''}`,
        icon: '/favicon.ico',
        tag: lead?.id || 'lead-new',
      });
    } catch {}
  }, []);

  // Request Notification permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Auto-set desktop default to board view on large screens
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setViewMode('board');
    }
  }, []);

  // Real-time Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleLeadNew = (payload: any) => {
      console.log('[Socket] Received lead:new', payload);
      const lead = payload.lead;
      if (lead) {
        prependLead(lead);
        trackNewLead(lead.id);
      }
      addLeadToast(lead || { name: payload.name, phone: payload.phone });
      playNotificationSound();
      triggerDesktopNotification(lead || { name: payload.name, phone: payload.phone });
    };

    const handleLeadStageChanged = (payload: any) => {
      console.log('[Socket] Received lead:stage_changed', payload);
      addToast(`🔄 Lead stage changed to ${payload.newStage}`, 'success');
      setLeads((prev: Lead[]) =>
        prev.map((l: Lead) =>
          l.id === payload.leadId
            ? {
                ...l,
                stage: payload.newStage,
                lastActivityAt: new Date().toISOString(),
                lastActivityType: 'Auto-Move to ' + payload.newStage,
              }
            : l
        )
      );
    };

    socket.on('lead:new', handleLeadNew);
    socket.on('lead:stage_changed', handleLeadStageChanged);

    return () => {
      socket.off('lead:new', handleLeadNew);
      socket.off('lead:stage_changed', handleLeadStageChanged);
    };
  }, [socket, prependLead, trackNewLead, addLeadToast, playNotificationSound, triggerDesktopNotification, addToast]);

  // Fetch clients for super admin
  useEffect(() => {
    if (isSuperAdmin) {
      api.get('/v1/agencies/clients')
        .then((res) => setClients(res.data.data))
        .catch((err) => console.error('Failed to load clients list', err));
    }
  }, [isSuperAdmin]);

  // Call Workflow Handler: Triggers dialer & sets up automatic bottom sheet popup on app focus
  const handleInitiateCall = (lead: Lead) => {
    if (!lead.phone) return;
    setCallingLead(lead);

    // Trigger phone call via tel: link
    window.location.href = `tel:${lead.phone}`;

    // Setup focus listener to pop bottom sheet when returning to app
    const handleFocusReturn = async () => {
      let activeLead = lead;
      if (lead.stage === 'NEW') {
        try {
          await updateLeadStage(lead.id, 'CONTACTED');
          activeLead = { ...lead, stage: 'CONTACTED' };
          setCallingLead(activeLead);
        } catch (err) {
          console.error('Failed to auto-transition new lead to connected', err);
        }
      }
      setIsCallResultOpen(true);
      window.removeEventListener('focus', handleFocusReturn);
    };

    // Add event listener with slight delay to avoid instant triggering
    setTimeout(() => {
      window.addEventListener('focus', handleFocusReturn, { once: true });
    }, 500);
  };

  // Call Result Workflow Completion Handler
  const handleCompleteCallWorkflow = (
    leadId: string,
    newStage: LeadStage,
    newFollowUp?: any,
    noteText?: string,
    isCna?: boolean
  ) => {
    // Update local state optimistically
    setLeads((prev: Lead[]) =>
      prev.map((l: Lead) => {
        if (l.id !== leadId) return l;
        const currentAttempts = l.callAttempts || 0;
        const updatedAttempts = isCna ? currentAttempts + 1 : currentAttempts;
        const lastResult = isCna ? 'Call Not Attended' : 'Connected';

        return {
          ...l,
          stage: newStage,
          nextFollowUp: newFollowUp || l.nextFollowUp,
          callAttempts: updatedAttempts,
          lastCallResult: lastResult,
        };
      })
    );

    const toastMsg = isCna
      ? 'Call Not Attended logged. Follow-up reminder scheduled!'
      : `Call workflow completed for lead. Stage: ${newStage.replace('_', ' ')}`;

    addToast(toastMsg, 'success');
  };

  // Create Lead Handler
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadData.name.trim()) {
      addToast('Customer Name is required', 'error');
      return;
    }
    try {
      setIsSubmittingNewLead(true);
      const res = await api.post('/v1/leads', newLeadData);
      const createdLead = res.data.data;
      prependLead(createdLead);
      addToast(`Lead "${createdLead.name}" added successfully.`, 'success');
      setIsAddLeadOpen(false);
      setNewLeadData({ name: '', email: '', phone: '', city: '', source: 'MANUAL', stage: 'NEW' });
    } catch (err: any) {
      addToast(err.response?.data?.error?.message || 'Failed to add lead.', 'error');
    } finally {
      setIsSubmittingNewLead(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (leads.length === 0) {
      addToast('No leads available to export.', 'warning');
      return;
    }
    const headers = ['Lead ID', 'Name', 'Phone', 'Email', 'City', 'Source', 'Stage Status', 'Created Date'];
    const rows = leads.map((lead) => [
      lead.id,
      cleanText(lead.name),
      lead.phone ? cleanText(lead.phone) : '',
      lead.email || '',
      lead.city || '',
      lead.source || '',
      lead.stage || '',
      new Date(lead.createdAt).toLocaleString(),
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((val) => {
            const escaped = String(val).replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')
              ? `"${escaped}"`
              : escaped;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('CSV export downloaded successfully!', 'success');
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedLeadIds.length} selected leads?`)) return;
    try {
      await deleteLeads(selectedLeadIds);
      addToast(`${selectedLeadIds.length} leads deleted successfully.`, 'success');
      setSelectedLeadIds([]);
    } catch (err: any) {
      addToast(err.message || 'Failed to delete leads', 'error');
    }
  };

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!window.confirm(`Are you sure you want to delete lead "${cleanText(leadName)}"?`)) return;
    try {
      await deleteLead(leadId);
      addToast(`Lead "${cleanText(leadName)}" deleted successfully.`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete lead', 'error');
    }
  };

  // Stage Count map for Filter Chips
  const countsByStage: Record<string, number> = {};
  leads.forEach((l) => {
    countsByStage[l.stage] = (countsByStage[l.stage] || 0) + 1;
  });

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    if (!filters.stage) return true;
    if (filters.stage === 'TODAY_DUE') {
      if (!l.nextFollowUp?.scheduledAt) return false;
      const scheduled = new Date(l.nextFollowUp.scheduledAt);
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return scheduled >= startOfToday && scheduled <= endOfToday;
    }
    if (filters.stage === 'OVERDUE') {
      if (!l.nextFollowUp?.scheduledAt) return false;
      return new Date(l.nextFollowUp.scheduledAt) < new Date();
    }
    if (filters.stage === 'UPCOMING') {
      if (!l.nextFollowUp?.scheduledAt) return false;
      return new Date(l.nextFollowUp.scheduledAt) > new Date();
    }
    return l.stage === filters.stage;
  });

  // RENDER: Dashboard View
  if (tab === 'dashboard') {
    return (
      <OperationalDashboardView
        user={user}
        connected={connected}
        leads={leads}
        notificationLogs={notificationLogs}
        loadingLogs={loadingLogs}
        onRefreshLogs={fetchNotificationLogs}
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 font-sans text-slate-100">
      
      {/* 1. Header & Title (Desktop Header & Toolbar) */}
      <div className="hidden md:flex flex-row justify-between items-center gap-4 border-b border-slate-900 pb-4 pt-1">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-display">
            Leads Pipeline
          </h1>
          <p className="text-slate-400 text-xs mt-1">Mobile-first CRM workflow & deal pipeline management</p>
        </div>

        {/* 2. Action Buttons */}
        <div className="flex items-center gap-2.5">
          {connected && (
            <span className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Real-time
            </span>
          )}

          <Link href="/client/integrations/google-sheets">
            <Button variant="secondary" size="sm" icon={<Upload size={13} />}>
              Import
            </Button>
          </Link>

          <Button onClick={handleExportCSV} variant="secondary" size="sm" icon={<Download size={13} />}>
            Export
          </Button>

          <Button onClick={() => setIsAddLeadOpen(true)} size="sm" icon={<Plus size={13} />}>
            Add Lead
          </Button>

          {/* Desktop View Mode Toggle */}
          <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'board' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Board View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header (< md) */}
      <MobileHeader
        title="Leads Pipeline"
        searchValue={filters.search || ''}
        onSearchChange={(val) => setFilters((prev) => ({ ...prev, search: val, page: 1 }))}
        connected={connected}
        onToggleFilters={() => setShowFilters(!showFilters)}
        hasActiveFilters={Boolean(filters.source || filters.city || filters.stage || filters.startDate || filters.endDate)}
      />

      {/* 3. Search Bar Section (Desktop & Mobile inline) */}
      <div className="my-3 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
            placeholder="Search leads by customer name, phone, email, city..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors shadow-inner"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '', page: 1 }))}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3.5 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            showFilters || Boolean(filters.source || filters.city || filters.startDate || filters.endDate)
              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Advanced Filters</span>
        </button>
      </div>

      {/* Advanced Filters Drawer (Collapsible) */}
      {showFilters && (
        <div className="mb-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/90 space-y-3 text-xs animate-in slide-in-from-top-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold uppercase tracking-wider text-slate-300 text-[10px]">Advanced Filters</h4>
            <button
              onClick={() => setFilters({ page: 1, limit: 100, search: '', stage: '', source: '', city: '', startDate: '', endDate: '' })}
              className="text-[10px] text-rose-400 hover:underline cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Source</label>
              <select
                value={filters.source || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, source: e.target.value, page: 1 }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white text-xs"
              >
                <option value="">-- All --</option>
                {SOURCE_TYPES.map((src) => (
                  <option key={src.value} value={src.value}>{src.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">City</label>
              <input
                type="text"
                value={filters.city || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value, page: 1 }))}
                placeholder="e.g. Chennai"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value, page: 1 }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white text-xs [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value, page: 1 }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white text-xs [color-scheme:dark]"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. STICKY FILTER CHIPS CONTAINER */}
      {/* 100% Solid Opaque Background, Edge-to-Edge, Crisp Border, Soft Shadow */}
      <div className="sticky -top-6 md:-top-8 z-30 bg-slate-950 border-b border-slate-800/80 shadow-md shadow-black/40 py-2.5 px-6 md:px-8 -mx-6 md:-mx-8 backdrop-blur-md transition-all">
        <QuickFilterChips
          activeStage={filters.stage || ''}
          onSelectStage={(stage) => setFilters((prev) => ({ ...prev, stage: stage as LeadStage, page: 1 }))}
          countsByStage={countsByStage}
        />
      </div>

      {/* 5. 16px Vertical Spacing & Lead Content Area */}
      <div className="pt-4 space-y-4">

        {/* Priority Today's Follow-up Banner */}
        <TodaysFollowUpsSection
          leads={leads}
          activeFilter={filters.stage}
          onSelectFilter={(filterType) => setFilters((prev) => ({ ...prev, stage: filterType as any, page: 1 }))}
        />

        {/* Main Lead Cards Area */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {viewMode === 'board' ? (
              /* Manager Desktop Kanban View */
              <ManagerKanbanView
                leads={filteredLeads}
                onUpdateStage={updateLeadStage}
                onCallClick={handleInitiateCall}
                onOpenReminder={(id, name) => {
                  const target = leads.find(l => l.id === id);
                  if (target) {
                    setReminderLead(target);
                    setIsReminderOpen(true);
                  }
                }}
                onDeleteLead={handleDeleteLead}
                isSuperAdmin={isSuperAdmin}
                selectedLeadIds={selectedLeadIds}
                onSelectLead={(id) =>
                  setSelectedLeadIds((prev) =>
                    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                  )
                }
                newLeadIds={newLeadIds}
              />
            ) : (
              /* Mobile-First Compact Card View */
              <div className="space-y-2.5">
                {filteredLeads.map((lead) => (
                  <CompactLeadCard
                    key={lead.id}
                    lead={lead}
                    isNew={newLeadIds.has(lead.id)}
                    isSelected={selectedLeadIds.includes(lead.id)}
                    onCallClick={handleInitiateCall}
                    onOpenReminder={(targetLead) => {
                      setReminderLead(targetLead);
                      setIsReminderOpen(true);
                    }}
                    onOpenCallResult={(targetLead) => {
                      setCallingLead(targetLead);
                      setIsCallResultOpen(true);
                    }}
                    onViewActivity={(targetLead) => {
                      setActivityLead(targetLead);
                      setIsActivityModalOpen(true);
                    }}
                    onStageChange={updateLeadStage}
                    onSelect={(id) =>
                      setSelectedLeadIds((prev) =>
                        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                      )
                    }
                  />
                ))}

                {filteredLeads.length === 0 && (
                  <div className="p-12 text-center text-slate-500 text-xs italic border border-dashed border-slate-800 rounded-2xl">
                    No leads found matching active criteria.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Call Result Bottom Sheet */}
      <CallResultBottomSheet
        isOpen={isCallResultOpen}
        onClose={() => setIsCallResultOpen(false)}
        lead={callingLead}
        onCompleteWorkflow={handleCompleteCallWorkflow}
      />

      {/* Activity Timeline Modal */}
      <ActivityTimelineModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setActivityLead(null);
        }}
        lead={activityLead}
      />

      {/* Reminder Scheduler Drawer */}
      <ReminderSchedulerDrawer
        isOpen={isReminderOpen}
        onClose={() => {
          setIsReminderOpen(false);
          setReminderLead(null);
          setReminderTargetStage(null);
        }}
        lead={reminderLead}
        targetStage={reminderTargetStage}
        onReminderSaved={(leadId, followUp) => {
          attachFollowUpToLead(leadId, followUp);
          addToast('Follow-up reminder scheduled successfully!', 'success');
        }}
      />

      {/* Mobile Floating Action Button (FAB) */}
      <MobileFAB
        onAddLeadClick={() => setIsAddLeadOpen(true)}
      />

      {/* Bulk Action Bar (Super Admin) */}
      {isSuperAdmin && selectedLeadIds.length > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-slate-950/90 backdrop-blur-xl border border-rose-500/30 px-5 py-3 rounded-2xl flex items-center gap-4 shadow-2xl shadow-rose-500/10">
          <span className="text-xs font-semibold text-slate-300">
            Selected <strong className="text-white font-extrabold">{selectedLeadIds.length}</strong>
          </span>
          <button
            onClick={handleBulkDelete}
            className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all shadow-lg cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}

      {/* Manual Add Lead Drawer */}
      <Drawer
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        title="Add Customer Lead"
        size="md"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block font-bold uppercase tracking-wider text-slate-400 text-[10px]">Customer Name</label>
            <input
              type="text"
              required
              value={newLeadData.name}
              onChange={(e) => setNewLeadData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. John Doe"
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold uppercase tracking-wider text-slate-400 text-[10px]">Phone Number</label>
            <input
              type="tel"
              value={newLeadData.phone}
              onChange={(e) => setNewLeadData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="e.g. +91 98765 43210"
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-bold uppercase tracking-wider text-slate-400 text-[10px]">City / Location</label>
            <input
              type="text"
              value={newLeadData.city}
              onChange={(e) => setNewLeadData((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="e.g. Chennai"
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold uppercase tracking-wider text-slate-400 text-[10px]">Source</label>
              <select
                value={newLeadData.source}
                onChange={(e) => setNewLeadData((prev) => ({ ...prev, source: e.target.value }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-white focus:outline-none"
              >
                <option value="MANUAL">Manual</option>
                <option value="CSV">CSV</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="WEBHOOK">Webhook</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold uppercase tracking-wider text-slate-400 text-[10px]">Stage</label>
              <select
                value={newLeadData.stage}
                onChange={(e) => setNewLeadData((prev) => ({ ...prev, stage: e.target.value as LeadStage }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-white focus:outline-none"
              >
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsAddLeadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmittingNewLead}>
              Add Lead
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Floating Toast Notification Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-toast-in p-3.5 rounded-xl border bg-slate-950/95 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 pointer-events-auto border-indigo-500/30 text-indigo-300 text-xs font-semibold"
          >
            <span>{'message' in toast ? toast.message : `🎉 New Lead: ${toast.name}`}</span>
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-white">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
