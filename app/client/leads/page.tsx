'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FunnelBarChart } from '@/components/ui/chart';
import { useLeads } from '../../../hooks/useLeads';
import { useSocket } from '../../../hooks/useSocket';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';
import { LeadStage, Lead } from '../../../types';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  ArrowLeftRight, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  RotateCw, 
  Search, 
  Filter, 
  Users, 
  MapPin, 
  Tag, 
  Layers,
  ChevronDown,
  LayoutGrid,
  List,
  Phone,
  MessageCircle,
  Trash2,
  Plus,
  Upload,
  Download,
  Bell,
  Send
} from 'lucide-react';
import { FiPhone, FiPhoneCall, FiArrowRight } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const STAGES: { value: LeadStage; label: string; color: string; dotColor: string }[] = [
  { value: 'NEW', label: 'New', color: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400', dotColor: 'bg-cyan-400' },
  { value: 'CONTACTED', label: 'Contacted', color: 'border-amber-500/20 bg-amber-500/5 text-amber-400', dotColor: 'bg-amber-400' },
  { value: 'CALL_NOT_ATTENDED', label: 'Call Not Attended', color: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400', dotColor: 'bg-yellow-400' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400', dotColor: 'bg-indigo-400' },
  { value: 'NEGOTIATION', label: 'Proposal', color: 'border-purple-500/20 bg-purple-500/5 text-purple-400', dotColor: 'bg-purple-400' },
  { value: 'WON', label: 'Won', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400', dotColor: 'bg-emerald-400' },
  { value: 'LOST', label: 'Lost', color: 'border-red-500/20 bg-red-500/5 text-red-400', dotColor: 'bg-red-400' },
  { value: 'BOOKED', label: 'Booked', color: 'border-rose-500/20 bg-rose-500/5 text-rose-400', dotColor: 'bg-rose-400' },
  { value: 'NO_NEED', label: 'No Need', color: 'border-slate-500/20 bg-slate-500/5 text-slate-400', dotColor: 'bg-slate-400' },
  { value: 'WRONG_LEAD', label: 'Wrong Lead', color: 'border-orange-500/20 bg-orange-500/5 text-orange-400', dotColor: 'bg-orange-400' }
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
  // Strip HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');
  // Strip starting/ending brackets/angle brackets if any remain
  cleaned = cleaned.replace(/[<>]/g, '');
  return cleaned;
};

export default function LeadsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  const {
    leads,
    loading,
    error,
    filters,
    setFilters,
    prependLead,
    updateLeadStage,
    deleteLead,
    deleteLeads,
  } = useLeads({ page: 1, limit: 100 }); // Increase limit for Kanban overview

  const { socket, connected } = useSocket();
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);

  const [notificationLogs, setNotificationLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchNotificationLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.get('/v1/client/telegram/logs');
      setNotificationLogs(res.data.data);
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
  // Default to 'list' on mobile, 'board' on desktop
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [newLeadData, setNewLeadData] = useState({ name: '', email: '', phone: '', city: '', source: 'MANUAL', stage: 'NEW' as LeadStage });
  const [isSubmittingNewLead, setIsSubmittingNewLead] = useState(false);

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

  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderLead, setReminderLead] = useState<{ id: string; name: string } | null>(null);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderNote, setReminderNote] = useState('');
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);

  const handleOpenReminder = (leadId: string, leadName: string) => {
    setReminderLead({ id: leadId, name: leadName });
    setReminderDate('');
    setReminderNote('');
    setIsReminderOpen(true);
  };

  const handleScheduleReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderLead || !reminderDate) return;

    try {
      setIsSubmittingReminder(true);
      await api.post('/v1/follow-ups', {
        leadId: reminderLead.id,
        scheduledAt: new Date(reminderDate).toISOString(),
        note: reminderNote || null,
      });

      addToast(`Reminder set successfully for "${reminderLead.name}"!`, 'success');
      setIsReminderOpen(false);
      setReminderLead(null);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to set reminder.');
    } finally {
      setIsSubmittingReminder(false);
    }
  };

  // Detect mobile on mount and lock to list view
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) setViewMode('list');
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [showFilters, setShowFilters] = useState(false);
  const [draggedOverStage, setDraggedOverStage] = useState<LeadStage | null>(null);
  const [clients, setClients] = useState<Array<{ id: string; businessName: string; agency: { name: string } }>>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  // Tracks IDs of leads that just arrived via socket (for animation + highlight)
  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(new Set());

  // Clear selections when filter or leads changes
  useEffect(() => {
    setSelectedLeadIds([]);
  }, [leads]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds(leads.map((l) => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedLeadIds.length} selected leads?`)) {
      return;
    }
    try {
      await deleteLeads(selectedLeadIds);
      addToast(`${selectedLeadIds.length} leads deleted successfully.`, 'success');
      setSelectedLeadIds([]);
    } catch (err: any) {
      addToast(err.message || 'Failed to delete leads', 'error');
    }
  };

  // Toast notifications state — supports both simple and rich 'lead_new' cards
  type ToastEntry =
    | { id: string; message: string; type: 'success' | 'warning' | 'error' }
    | { id: string; type: 'lead_new'; title: string; name: string; phone: string };

  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const handleExportCSV = () => {
    if (leads.length === 0) {
      addToast('No leads available to export.', 'warning');
      return;
    }

    // Define CSV Headers including lead metadata and stage status
    const headers = ['Lead ID', 'Name', 'Phone', 'Email', 'City', 'Source', 'Stage Status', 'Created Date'];

    // Map leads rows
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

    // Construct CSV content string
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((val) => {
            const escaped = String(val).replace(/"/g, '""');
            if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
              return `"${escaped}"`;
            }
            return escaped;
          })
          .join(',')
      ),
    ].join('\n');

    // Create download trigger
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

  /** Shows a rich 2-line toast card for new lead arrivals. */
  const addLeadToast = React.useCallback((lead: Record<string, any>) => {
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

  /** Marks a lead ID as newly arrived, then clears after 3s (for Kanban animation). */
  const trackNewLead = React.useCallback((leadId: string) => {
    setNewLeadIds((prev) => new Set([...prev, leadId]));
    setTimeout(() => {
      setNewLeadIds((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
    }, 3000);
  }, []);

  /** Plays a notification sound. Uses Web Audio API beep as fallback. */
  const playNotificationSound = React.useCallback(() => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {
        // Fallback: generated 880Hz beep via Web Audio API
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
        } catch { /* silently ignore */ }
      });
    } catch { /* silently ignore */ }
  }, []);

  /** Fires a Chrome desktop notification (only if permission granted). */
  const triggerDesktopNotification = React.useCallback((lead: Record<string, any>) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      new Notification('🎉 New Lead Received', {
        body: `${lead?.name || 'Unknown'}${lead?.phone ? `\n${lead.phone}` : ''}`,
        icon: '/favicon.ico',
        tag: lead?.id || 'lead-new',
      });
    } catch { /* silently ignore */ }
  }, []);

  // Request Chrome notification permission once on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch clients for super admin dropdown
  useEffect(() => {
    if (isSuperAdmin) {
      api.get('/v1/agencies/clients')
        .then((res) => setClients(res.data.data))
        .catch((err) => console.error('Failed to load clients list', err));
    }
  }, [isSuperAdmin]);

  const handleDeleteLead = async (leadId: string, leadName: string) => {
    if (!window.confirm(`Are you sure you want to delete lead "${cleanText(leadName)}"?`)) {
      return;
    }
    try {
      await deleteLead(leadId);
      addToast(`Lead "${cleanText(leadName)}" deleted successfully.`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete lead', 'error');
    }
  };

  // ─── Real-time Socket Listeners ───────────────────────────────────────────────
  // Pattern: register on the live socket object with proper cleanup.
  // socket.on() / socket.off() guarantees no stale-ref / null-ref issues.
  useEffect(() => {
    if (!socket) return;

    const handleLeadNew = (payload: { lead?: Record<string, any> | null; leadId: string; name: string; phone?: string | null; source: string | null; stage: string }) => {
      console.log('[Socket] Received lead:new', payload);

      const lead = payload.lead;

      // 1. Optimistically prepend lead — NO re-fetch, NO page reload
      if (lead) {
        prependLead(lead as any);
        trackNewLead(lead.id);
      }

      // 2. Rich 2-line toast popup
      addLeadToast(lead || { name: payload.name, phone: payload.phone });

      // 3. Audio notification
      playNotificationSound();

      // 4. Chrome desktop notification
      triggerDesktopNotification(lead || { name: payload.name, phone: payload.phone });
    };

    const handleLeadStageChanged = (payload: { leadId: string; oldStage: string; newStage: string }) => {
      console.log('[Socket] Received lead:stage_changed', payload);
      addToast(`🔄 Lead stage changed to ${payload.newStage}`, 'success');
    };

    socket.on('lead:new', handleLeadNew);
    socket.on('lead:stage_changed', handleLeadStageChanged);

    return () => {
      socket.off('lead:new', handleLeadNew);
      socket.off('lead:stage_changed', handleLeadStageChanged);
    };
  }, [socket]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const clearAllFilters = () => {
    setFilters({
      page: 1,
      limit: 100,
      search: '',
      stage: '',
      source: '',
      city: '',
      assignedTo: '',
      startDate: '',
      endDate: ''
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    setDraggedOverStage(stage);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: LeadStage) => {
    e.preventDefault();
    setDraggedOverStage(null);
    const leadId = e.dataTransfer.getData('text/plain');
    if (!leadId) return;

    try {
      await updateLeadStage(leadId, targetStage);
    } catch (err: any) {
      alert(err.message || 'Failed to update stage');
    }
  };

  const handleSelectStageChange = async (leadId: string, targetStage: LeadStage) => {
    try {
      await updateLeadStage(leadId, targetStage);
    } catch (err: any) {
      alert(err.message || 'Failed to update stage');
    }
  };

  // Group leads by stage for Board view
  const leadsByStage: Record<LeadStage, Lead[]> = STAGES.reduce((acc, stage) => {
    if (stage.value === 'CONTACTED') {
      acc[stage.value] = leads.filter(l => l.stage === 'CONTACTED' || l.stage === 'FOLLOW_UP');
    } else {
      acc[stage.value] = leads.filter(l => l.stage === stage.value);
    }
    return acc;
  }, {} as Record<LeadStage, Lead[]>);

  if (tab === 'dashboard') {
    // Compute stats
    const totalLeadsCount = leads.length;
    const wonLeadsCount = leads.filter(l => l.stage === 'WON').length;
    const lostLeadsCount = leads.filter(l => l.stage === 'LOST').length;
    const activeLeadsCount = totalLeadsCount - wonLeadsCount - lostLeadsCount;
    
    // Group sources for stats
    const sourcesData = SOURCE_TYPES.map(src => {
      const count = leads.filter(l => l.source === src.value).length;
      return { name: src.label, count, color: src.value === 'META_ADS' ? '#3B82F6' : src.value === 'GOOGLE_SHEETS' ? '#10B981' : '#64748B' };
    }).filter(d => d.count > 0);

    // Group stage counts
    const stagesData = STAGES.map(st => {
      const count = leads.filter(l => l.stage === st.value).length;
      return { name: st.label, count, color: st.value === 'WON' ? '#10B981' : st.value === 'LOST' ? '#EF4444' : '#3B82F6' };
    });

    return (
      <div className="space-y-8 pb-12 animate-in fade-in duration-300">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/80 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Connected Portal</span>
            </div>
            <h1 className="text-[44px] font-black text-white tracking-tight leading-none font-display mt-2">
              User Dashboard
            </h1>
            <p className="text-text-secondary text-sm mt-2">Monitor integration telemetry, client account details, and lead activities</p>
          </div>
          
          <div className="flex items-center gap-2.5">
            {connected && (
              <span className="flex items-center gap-2 text-xs bg-success/10 text-success border border-success/20 px-3 py-1.5 rounded-full font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></span>
                Connected
              </span>
            )}
            <Link href="/client/leads">
              <Button size="sm">View Leads Board</Button>
            </Link>
          </div>
        </div>

        {/* Top Section: User and Account details + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* User Related Details Card */}
          <AppCard className="p-6 lg:col-span-1 flex flex-col justify-between relative overflow-hidden" hoverEffect={false}>
            <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl" />
            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">Account Owner Profile</span>
                <h3 className="text-lg font-bold text-white mt-1">Portal Session Credentials</h3>
              </div>
              
              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-card-secondary border border-border/60">
                  <p className="text-[9px] uppercase font-bold text-text-secondary">Owner User Email</p>
                  <p className="font-semibold text-white mt-0.5 truncate">{user?.email || 'client@growphil.in'}</p>
                </div>
                
                <div className="p-3.5 rounded-2xl bg-card-secondary border border-border/60">
                  <p className="text-[9px] uppercase font-bold text-text-secondary">System Access Role</p>
                  <p className="font-semibold text-white mt-0.5 uppercase tracking-wider text-[10px] text-primary">
                    {user?.role ? user.role.replace('_', ' ') : 'CLIENT OWNER'}
                  </p>
                </div>
                
                <div className="p-3.5 rounded-2xl bg-card-secondary border border-border/60">
                  <p className="text-[9px] uppercase font-bold text-text-secondary">Tenant Reference ID</p>
                  <p className="font-mono text-white/70 text-[10px] mt-0.5 truncate">{user?.tenantId || '7ba9045-8123-4bb1-a67b-1cb09f984a'}</p>
                </div>
              </div>
            </div>
          </AppCard>

          {/* Quick Stats Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AppCard className="p-6 flex flex-col justify-between bg-card text-card-foreground border-border shadow-premium-card relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-28 w-28 rounded-full blur-3xl -translate-y-8 translate-x-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300 bg-primary" />
              <div>
                <p className="text-[10px] font-semibold text-muted/80 uppercase tracking-widest">Total Transaction Leads</p>
                <h3 className="text-4xl font-black tracking-tight mt-2 text-white">{totalLeadsCount}</h3>
              </div>
              <p className="text-[11px] text-muted mt-4 font-semibold uppercase tracking-wider">Accumulated in database</p>
            </AppCard>

            <AppCard className="p-6 flex flex-col justify-between bg-card text-card-foreground border-border shadow-premium-card relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-28 w-28 rounded-full blur-3xl -translate-y-8 translate-x-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300 bg-success" />
              <div>
                <p className="text-[10px] font-semibold text-muted/80 uppercase tracking-widest">Converted Deals (Won)</p>
                <h3 className="text-4xl font-black tracking-tight mt-2 text-success">{wonLeadsCount}</h3>
              </div>
              <p className="text-[11px] text-muted mt-4 font-semibold uppercase tracking-wider">
                Conversion Rate: {totalLeadsCount > 0 ? Math.round((wonLeadsCount / totalLeadsCount) * 100) : 0}%
              </p>
            </AppCard>

            <AppCard className="p-6 flex flex-col justify-between bg-card text-card-foreground border-border shadow-premium-card relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-28 w-28 rounded-full blur-3xl -translate-y-8 translate-x-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300 bg-warning" />
              <div>
                <p className="text-[10px] font-semibold text-muted/80 uppercase tracking-widest">Active Pipeline Leads</p>
                <h3 className="text-4xl font-black tracking-tight mt-2 text-warning">{activeLeadsCount}</h3>
              </div>
              <p className="text-[11px] text-muted mt-4 font-semibold uppercase tracking-wider">In transition stages</p>
            </AppCard>

            <AppCard className="p-6 flex flex-col justify-between bg-card text-card-foreground border-border shadow-premium-card relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-28 w-28 rounded-full blur-3xl -translate-y-8 translate-x-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300 bg-red-500" />
              <div>
                <p className="text-[10px] font-semibold text-muted/80 uppercase tracking-widest">Lost Prospects</p>
                <h3 className="text-4xl font-black tracking-tight mt-2 text-rose-450">{lostLeadsCount}</h3>
              </div>
              <p className="text-[11px] text-muted mt-4 font-semibold uppercase tracking-wider">No conversion</p>
            </AppCard>
          </div>

        </div>

        {/* Charts & Funnels Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AppCard className="p-6 space-y-4" hoverEffect={false}>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Lead Acquisition Channels</h3>
              <p className="text-[11px] text-text-secondary">Channels distribution of incoming customer leads</p>
            </div>
            {sourcesData.length > 0 ? (
              <FunnelBarChart data={sourcesData} />
            ) : (
              <div className="h-56 flex items-center justify-center text-xs text-text-secondary italic border border-dashed border-border rounded-2xl">
                No active source leads channel logged.
              </div>
            )}
          </AppCard>

          <AppCard className="p-6 space-y-4" hoverEffect={false}>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Pipeline Stage Distribution</h3>
              <p className="text-[11px] text-text-secondary">Volume metrics showing current sales milestones</p>
            </div>
            {leads.length > 0 ? (
              <FunnelBarChart data={stagesData} />
            ) : (
              <div className="h-56 flex items-center justify-center text-xs text-text-secondary italic border border-dashed border-border rounded-2xl">
                No pipeline leads records logged.
              </div>
            )}
          </AppCard>
        </div>

        {/* Recent Lead Roster Table */}
        <AppCard className="p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Recent Lead Activity</h3>
              <p className="text-xs text-text-secondary mt-1">Live callback log of recently imported client prospects</p>
            </div>
            <Link href="/client/leads">
              <Button size="sm" variant="secondary">View Full Pipeline</Button>
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card-secondary/15 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-text-secondary min-w-[500px]">
                <thead>
                  <tr className="border-b border-border/80 text-[10px] text-text-secondary/70 uppercase font-extrabold bg-card-secondary/20">
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Phone Contact</th>
                    <th className="p-4">Acquisition Channel</th>
                    <th className="p-4">Pipeline Stage</th>
                    <th className="p-4">Created Time</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 5).map((lead) => {
                    const stageObj = STAGES.find(s => s.value === lead.stage);
                    return (
                      <tr key={lead.id} className="border-b border-border/40 hover:bg-hover/10 transition-colors">
                        <td className="p-4 text-white font-bold">{cleanText(lead.name)}</td>
                        <td className="p-4">
                          {lead.phone ? (
                            <div className="flex items-center gap-3">
                              <span>{cleanText(lead.phone)}</span>
                              <div className="flex gap-1.5">
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="p-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/15 transition-colors cursor-pointer"
                                >
                                  <Phone className="h-3 w-3" />
                                </a>
                                <a
                                  href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 transition-colors cursor-pointer"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-650">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-slate-800 border border-slate-700/60 rounded-md text-white/95">
                            {lead.source ? lead.source.replace('_', ' ') : 'MANUAL'}
                          </span>
                        </td>
                        <td className="p-4">
                          {stageObj && (
                            <span className={`text-[9px] font-black uppercase tracking-wider border rounded-full px-2.5 py-0.5 ${stageObj.color}`}>
                              {stageObj.label}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500">{new Date(lead.createdAt).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-secondary italic">
                        No customer leads currently configured in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </AppCard>

        {/* Notification History Card */}
        <AppCard className="p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Send className="h-4.5 w-4.5 text-blue-400" /> Lead Notification Logs
              </h3>
              <p className="text-xs text-text-secondary mt-1">Audit log of system alerts sent to connected Telegram recipients</p>
            </div>
            <button
              onClick={fetchNotificationLogs}
              disabled={loadingLogs}
              className="px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <RotateCw size={12} className={loadingLogs ? 'animate-spin' : ''} />
              Refresh Logs
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card-secondary/15 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-text-secondary min-w-[500px]">
                <thead>
                  <tr className="border-b border-border/80 text-[10px] text-text-secondary/70 uppercase font-extrabold bg-card-secondary/20">
                    <th className="p-4">Channel</th>
                    <th className="p-4">Recipient Chat</th>
                    <th className="p-4">Title / Payload</th>
                    <th className="p-4">Delivery Status</th>
                    <th className="p-4">Dispatched Time</th>
                  </tr>
                </thead>
                <tbody>
                  {notificationLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/40 hover:bg-hover/10 transition-colors">
                      <td className="p-4">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400">
                          {log.channel}
                        </span>
                      </td>
                      <td className="p-4 text-white font-semibold">{log.recipient}</td>
                      <td className="p-4">
                        <div className="max-w-md truncate" title={log.message}>
                          <span className="font-bold text-white block text-[11px] mb-0.5">{log.title || 'Notification'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{log.message}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {log.status === 'SENT' ? (
                          <Badge variant="success">Dispatched</Badge>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <Badge variant="warning">Failed</Badge>
                            {log.error && (
                              <span className="text-[9px] text-red-400 font-mono max-w-xs truncate" title={log.error}>
                                {log.error}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-slate-500">{new Date(log.sentAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {notificationLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-secondary italic">
                        {loadingLogs ? 'Loading notification history...' : 'No notifications have been dispatched yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </AppCard>
        
        {/* Floating Toast Notification Wrapper */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            toast.type === 'lead_new' ? (
              <div
                key={toast.id}
                className="animate-toast-in p-4 rounded-xl border border-emerald-500/30 bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-emerald-500/10 flex items-start gap-3 pointer-events-auto"
              >
                <div className="shrink-0 h-9 w-9 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-lg">
                  🎉
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-0.5">New Lead Received</p>
                  <p className="text-sm font-bold text-white truncate">{toast.name}</p>
                  {toast.phone && (
                    <p className="text-xs text-slate-400 mt-0.5">{toast.phone}</p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-500 hover:text-white shrink-0 mt-0.5 cursor-pointer"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                key={toast.id}
                className={`animate-toast-in p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 pointer-events-auto transition-all duration-300 bg-emerald-500/10 border-emerald-500/20 text-emerald-400`}
              >
                <span className="text-sm font-semibold flex-1 leading-snug">{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
                >
                  ×
                </button>
              </div>
            )
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-3xl md:text-[48px] font-bold text-white tracking-tight leading-none font-display">
            Leads Pipeline
          </h1>
          <p className="text-text-secondary text-sm mt-2">Track conversions and customer milestones in real-time</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {connected && (
            <span className="hidden sm:flex items-center gap-2 text-xs bg-success/10 text-success border border-success/20 px-3 py-1.5 rounded-full font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></span>
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

          {/* View Toggle — board hidden on mobile */}
          <div className="hidden md:flex bg-card rounded-xl p-1 border border-border">
            <button
              onClick={() => setViewMode('board')}
              className={`hidden md:flex p-1.5 rounded-lg transition-colors ${viewMode === 'board' ? 'bg-primary text-black font-bold' : 'text-text-secondary hover:text-white'}`}
              title="Board View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-black font-bold' : 'text-text-secondary hover:text-white'}`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {realtimeNotification && (
        <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-4 text-sm text-indigo-400 flex items-center justify-between animate-bounce">
          <span>🔔 {realtimeNotification}</span>
          <button onClick={() => setRealtimeNotification(null)} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between w-full">
          {/* Row 1: Search + Filters inline on mobile */}
          <div className="flex flex-1 flex-row gap-2 items-center w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={filters.search || ''}
                onChange={handleSearchChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                placeholder="Search leads..."
              />
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs border font-medium transition-colors ${
                  showFilters
                    ? 'bg-indigo-650/10 text-indigo-400 border-indigo-500/20'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Advanced Filters</span>
                <span className="sm:hidden">Filters</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {(filters.source || filters.city || filters.stage || filters.startDate || filters.endDate || filters.assignedTo) && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-red-400 hover:underline px-2 border border-red-500/20 rounded-lg hover:bg-red-500/5 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Super Admin Client Dropdown (Full width on mobile, w-64 inline on desktop) */}
          {isSuperAdmin && (
            <div className="w-full md:w-64">
              <select
                value={filters.clientId || ''}
                onChange={(e) => handleFilterChange('clientId', e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="">-- All Clients --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName} ({c.agency?.name})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Collapsible filters fields */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-900/60 text-xs text-slate-300">
            {/* Stage */}
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Pipeline Stage</label>
              <select
                value={filters.stage || ''}
                onChange={(e) => handleFilterChange('stage', e.target.value)}
                className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none"
              >
                <option value="">-- All Stages --</option>
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Lead Source</label>
              <select
                value={filters.source || ''}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none"
              >
                <option value="">-- All Sources --</option>
                {SOURCE_TYPES.map((src) => (
                  <option key={src.value} value={src.value}>{src.label}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">City / Location</label>
              <input
                type="text"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                placeholder="e.g. Chennai"
              />
            </div>

            {/* Owner/Teammate */}
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Owner User ID</label>
              <input
                type="text"
                value={filters.assignedTo || ''}
                onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none"
                placeholder="UUID of assigned user"
              />
            </div>

            {/* Date Start */}
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none"
              />
            </div>

            {/* Date End */}
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full rounded border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Board/List Content */}
      <div>
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {viewMode === 'board' ? (
              /* Kanban board view */
              <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {STAGES.map((col) => {
                  const stageLeads = leadsByStage[col.value] || [];
                  const isDraggingOver = draggedOverStage === col.value;

                  return (
                    <div
                      key={col.value}
                      onDragOver={(e) => handleDragOver(e, col.value)}
                      onDrop={(e) => handleDrop(e, col.value)}
                      className={`flex-1 min-w-[280px] max-w-[320px] rounded-xl border p-4 flex flex-col h-[700px] transition-all ${
                        isDraggingOver 
                          ? 'border-indigo-500/60 bg-indigo-500/5 shadow-lg shadow-indigo-500/5' 
                          : 'border-slate-900 bg-slate-950/20'
                      }`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-900/60">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${col.dotColor}`}></span>
                          <span className="font-semibold text-slate-200 text-sm">{col.label}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                          {stageLeads.length}
                        </span>
                      </div>

                      {/* Lead Cards List */}
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent">
                        {stageLeads.map((lead) => (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            className={`p-4 rounded-lg border transition-all cursor-grab active:cursor-grabbing space-y-3 hover:shadow-lg hover:shadow-black/20 ${
                              newLeadIds.has(lead.id)
                                ? 'animate-lead-arrive border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/10'
                                : selectedLeadIds.includes(lead.id)
                                ? 'border-indigo-500/50 bg-indigo-950/20 shadow-md shadow-indigo-500/5'
                                : 'border-slate-900 bg-slate-950 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-semibold text-slate-200 text-xs hover:underline truncate flex-1">
                                <Link href={`/client/leads/${lead.id}`}>
                                  {cleanText(lead.name)}
                                </Link>
                              </h4>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleOpenReminder(lead.id, lead.name)}
                                  className="text-slate-500 hover:text-amber-400 p-0.5 rounded hover:bg-amber-500/10 transition-colors cursor-pointer shrink-0"
                                  title="Set Reminder"
                                >
                                  <Bell className="h-3.5 w-3.5" />
                                </button>
                                {isSuperAdmin && (
                                  <>
                                    <input
                                      type="checkbox"
                                      checked={selectedLeadIds.includes(lead.id)}
                                      onChange={() => handleSelectLead(lead.id)}
                                      className="rounded border-slate-800 bg-slate-950 text-indigo-650 h-3.5 w-3.5 cursor-pointer"
                                    />
                                    <button
                                      onClick={() => handleDeleteLead(lead.id, lead.name)}
                                      className="text-slate-500 hover:text-red-400 p-0.5 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                                      title="Delete Lead"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-500 space-y-1.5">
                              {lead.phone && (
                                <div className="space-y-1.5">
                                  <p><span className="text-slate-400 mr-1.5 font-medium">Phone:</span>{cleanText(lead.phone)}</p>
                                  <div className="flex gap-2">
                                    <a
                                      href={`tel:${lead.phone}`}
                                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/10 transition-colors cursor-pointer"
                                      title="Call Lead"
                                    >
                                      <Phone className="h-3 w-3" />
                                      Call
                                    </a>
                                    <a
                                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/10 transition-colors cursor-pointer"
                                      title="Message on WhatsApp"
                                    >
                                      <MessageCircle className="h-3 w-3" />
                                      WhatsApp
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-900/60 text-[9px] text-slate-600">
                              <span>Created: {new Date(lead.createdAt).toLocaleDateString()}</span>
                              <Link href={`/client/leads/${lead.id}`} className="text-emerald-400 hover:text-emerald-300 font-semibold">
                                View
                              </Link>
                            </div>
                          </div>
                        ))}

                        {stageLeads.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-32 border border-dashed border-slate-900/60 rounded-lg text-slate-600 text-[10px]">
                            <Layers className="h-5 w-5 mb-1.5 opacity-40" />
                            Drag leads here
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View — mobile cards + desktop table */
              <div className="md:rounded-xl md:border md:border-slate-900 md:bg-slate-900/10 md:overflow-hidden">

                {/* ── Mobile card list (< md) ── */}
                <div className="md:hidden flex flex-col gap-3 p-1">
                  {leads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-600 text-sm">
                      <Users className="h-8 w-8 mb-2 opacity-30" />
                      No leads found
                    </div>
                  )}
                  {leads.map((lead) => {
                    const stageObj = STAGES.find(s => s.value === lead.stage);
                    const isNew = newLeadIds.has(lead.id);
                    return (
                      <div
                        key={lead.id}
                        className={`p-3.5 rounded-[16px] border flex flex-col gap-2.5 transition-all relative ${
                          isNew
                            ? 'animate-lead-arrive border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/10'
                            : 'border-slate-900 bg-slate-950/40 hover:bg-slate-950/70 shadow-sm'
                        }`}
                      >
                        {/* Row 1 — name + NEW badge + reminder bell */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Link
                              href={`/client/leads/${lead.id}`}
                              className="text-base font-bold text-white leading-snug hover:text-indigo-400 transition-colors truncate"
                            >
                              {cleanText(lead.name)}
                            </Link>
                            <button
                              onClick={() => handleOpenReminder(lead.id, lead.name)}
                              className="text-slate-500 hover:text-amber-400 p-1 rounded hover:bg-amber-500/10 transition-colors cursor-pointer shrink-0"
                              title="Set Reminder"
                            >
                              <Bell className="h-4 w-4" />
                            </button>
                          </div>
                          {lead.stage === 'NEW' && (
                            <span className="shrink-0 text-[9px] font-extrabold bg-blue-500/15 border border-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              NEW
                            </span>
                          )}
                        </div>

                        {/* Row 2 — phone number with React icon (FiPhone) */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <FiPhone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">
                            {lead.phone ? cleanText(lead.phone) : 'No phone number'}
                          </span>
                        </div>

                        {/* Row 3 — Call & WhatsApp buttons in a single row */}
                        <div className="flex gap-2 w-full">
                          <a
                            href={`tel:${lead.phone || ''}`}
                            onClick={(e) => !lead.phone && e.preventDefault()}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                              lead.phone
                                ? 'bg-indigo-650/20 hover:bg-indigo-650/35 text-indigo-400 border-indigo-500/20 active:scale-[0.98]'
                                : 'bg-slate-900/40 text-slate-650 border-slate-900/60 cursor-not-allowed opacity-50'
                            }`}
                            title="Call Lead"
                          >
                            <FiPhoneCall className="h-3.5 w-3.5" />
                            Call
                          </a>
                          <a
                            href={lead.phone ? `https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}` : '#'}
                            target={lead.phone ? "_blank" : undefined}
                            rel={lead.phone ? "noopener noreferrer" : undefined}
                            onClick={(e) => !lead.phone && e.preventDefault()}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                              lead.phone
                                ? 'bg-emerald-650/20 hover:bg-emerald-650/35 text-emerald-400 border-emerald-500/20 active:scale-[0.98]'
                                : 'bg-slate-900/40 text-slate-650 border-slate-900/60 cursor-not-allowed opacity-50'
                            }`}
                            title="WhatsApp Lead"
                          >
                            <FaWhatsapp className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        </div>

                        {/* Subtle divider below action buttons */}
                        <div className="border-t border-slate-900/60 my-0.5" />

                        {/* Bottom Row — Left side: Status badge dropdown; Right side: View link with FiArrowRight */}
                        <div className="flex items-center justify-between gap-2">
                          {stageObj && (
                            <div className="relative">
                              <select
                                value={lead.stage}
                                onChange={(e) => handleSelectStageChange(lead.id, e.target.value as LeadStage)}
                                className={`appearance-none text-[9px] font-bold uppercase tracking-wider border rounded-full pl-2.5 pr-6 py-0.5 focus:outline-none cursor-pointer ${stageObj.color}`}
                              >
                                {[...STAGES].sort((a, b) => a.label.localeCompare(b.label)).map((s) => (
                                  <option key={s.value} value={s.value} className="bg-slate-950 text-white font-normal capitalize">
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-slate-400">
                                <ChevronDown className="h-3 w-3" />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Link
                              href={`/client/leads/${lead.id}`}
                              className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              View
                              <FiArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            {isSuperAdmin && (
                              <button
                                onClick={() => handleDeleteLead(lead.id, lead.name)}
                                className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Delete Lead"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>


                {/* ── Desktop table (≥ md) ── */}
                <div className="hidden md:block p-6 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        {isSuperAdmin && (
                          <th className="pb-3 pr-4 w-10">
                            <input
                              type="checkbox"
                              checked={leads.length > 0 && selectedLeadIds.length === leads.length}
                              onChange={handleSelectAll}
                              className="rounded border-slate-800 bg-slate-950 text-indigo-650 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                            />
                          </th>
                        )}
                        <th className="pb-3 pr-4">Lead Name</th>
                        <th className="pb-3 pr-4">Phone &amp; Actions</th>
                        <th className="pb-3 pr-4">Pipeline Stage</th>
                        <th className="pb-3 pr-4">Created Time</th>
                        <th className="pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => {
                        const stageObj = STAGES.find(s => s.value === lead.stage);
                        return (
                          <tr
                            key={lead.id}
                            className={`border-b border-slate-900 hover:bg-slate-950/40 text-slate-300 transition-colors ${
                              newLeadIds.has(lead.id)
                                ? 'animate-lead-arrive'
                                : selectedLeadIds.includes(lead.id)
                                ? 'bg-indigo-500/5 hover:bg-indigo-500/5'
                                : ''
                            }`}
                          >
                            {isSuperAdmin && (
                              <td className="py-3.5 pr-4">
                                <input
                                  type="checkbox"
                                  checked={selectedLeadIds.includes(lead.id)}
                                  onChange={() => handleSelectLead(lead.id)}
                                  className="rounded border-slate-800 bg-slate-950 text-indigo-650 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                                />
                              </td>
                            )}
                            <td className="py-3.5 pr-4 font-semibold text-white">
                              <div className="flex items-center gap-2">
                                <Link href={`/client/leads/${lead.id}`} className="hover:underline">
                                  {cleanText(lead.name)}
                                </Link>
                                <button
                                  onClick={() => handleOpenReminder(lead.id, lead.name)}
                                  className="text-slate-500 hover:text-amber-400 p-0.5 rounded hover:bg-amber-500/10 transition-colors cursor-pointer"
                                  title="Set Reminder"
                                >
                                  <Bell className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 pr-4">
                              {lead.phone ? (
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-slate-200">{cleanText(lead.phone)}</span>
                                  <div className="flex gap-1.5 shrink-0">
                                    <a
                                      href={`tel:${lead.phone}`}
                                      className="p-1 rounded bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/10 transition-colors cursor-pointer"
                                      title="Call Lead"
                                    >
                                      <Phone className="h-3.5 w-3.5" />
                                    </a>
                                    <a
                                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 rounded bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/10 transition-colors cursor-pointer"
                                      title="Message on WhatsApp"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" />
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="py-3.5 pr-4">
                              <select
                                value={lead.stage}
                                onChange={(e) => handleSelectStageChange(lead.id, e.target.value as LeadStage)}
                                className="bg-slate-950 text-[10px] font-bold border border-slate-800 rounded px-2 py-1 focus:outline-none"
                              >
                                {[...STAGES].sort((a, b) => a.label.localeCompare(b.label)).map((s) => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3.5 pr-4 text-slate-500">
                              {new Date(lead.createdAt).toLocaleString()}
                            </td>
                            <td className="py-3.5 font-semibold">
                              <div className="flex items-center gap-3">
                                <Link href={`/client/leads/${lead.id}`} className="text-emerald-400 hover:text-emerald-300 hover:underline">
                                  Open Profile
                                </Link>
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => handleDeleteLead(lead.id, lead.name)}
                                    className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                                    title="Delete Lead"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bulk Action Bar */}
      {isSuperAdmin && selectedLeadIds.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/80 backdrop-blur-xl border border-red-500/20 px-6 py-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-[calc(100%-2rem)] max-w-sm sm:max-w-md shadow-2xl shadow-red-500/10 animate-in slide-in-from-bottom-5 duration-250 pointer-events-auto">
          <span className="text-sm font-semibold text-zinc-300">
            Selected <strong className="text-white font-extrabold">{selectedLeadIds.length}</strong> {selectedLeadIds.length === 1 ? 'lead' : 'leads'}
          </span>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setSelectedLeadIds([])}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold bg-red-655 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg shadow-red-600/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          toast.type === 'lead_new' ? (
            /* Rich new-lead card */
            <div
              key={toast.id}
              className="animate-toast-in p-4 rounded-xl border border-emerald-500/30 bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-emerald-500/10 flex items-start gap-3 pointer-events-auto"
            >
              {/* Icon */}
              <div className="shrink-0 h-9 w-9 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-lg">
                🎉
              </div>
              {/* Body */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-0.5">New Lead Received</p>
                <p className="text-sm font-bold text-white truncate">{toast.name}</p>
                {toast.phone && (
                  <p className="text-xs text-slate-400 mt-0.5">{toast.phone}</p>
                )}
              </div>
              {/* Dismiss */}
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-500 hover:text-white shrink-0 mt-0.5 cursor-pointer"
              >
                ×
              </button>
            </div>
          ) : (
            /* Standard toast */
            <div
              key={toast.id}
              className={`animate-toast-in p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 pointer-events-auto transition-all duration-300 ${
                toast.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : toast.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              <span className="text-sm font-semibold flex-1 leading-snug">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
              >
                ×
              </button>
            </div>
          )
        ))}
      </div>

      {/* Manual Add Lead Drawer */}
      <Drawer
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        title="Add Customer Lead"
        size="md"
      >
        <form onSubmit={handleCreateLead} className="space-y-5 text-sm">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">Customer Name</label>
            <input
              type="text"
              required
              value={newLeadData.name}
              onChange={(e) => setNewLeadData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. John Doe"
              className="w-full rounded-2xl border border-border bg-card-secondary px-4 py-3 text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">Email Address</label>
            <input
              type="email"
              value={newLeadData.email}
              onChange={(e) => setNewLeadData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="e.g. john@example.com"
              className="w-full rounded-2xl border border-border bg-card-secondary px-4 py-3 text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">Phone Number</label>
            <input
              type="tel"
              value={newLeadData.phone}
              onChange={(e) => setNewLeadData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="e.g. +91 98765 43210"
              className="w-full rounded-2xl border border-border bg-card-secondary px-4 py-3 text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">City / Location</label>
            <input
              type="text"
              value={newLeadData.city}
              onChange={(e) => setNewLeadData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="e.g. Chennai"
              className="w-full rounded-2xl border border-border bg-card-secondary px-4 py-3 text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">Lead Source</label>
              <select
                value={newLeadData.source}
                onChange={(e) => setNewLeadData(prev => ({ ...prev, source: e.target.value }))}
                className="w-full rounded-2xl border border-border bg-card-secondary px-4 py-3 text-white focus:outline-none focus:border-primary"
              >
                <option value="MANUAL">Manual</option>
                <option value="CSV">CSV Import</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="WEBHOOK">Webhook</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">Initial Stage</label>
              <select
                value={newLeadData.stage}
                onChange={(e) => setNewLeadData(prev => ({ ...prev, stage: e.target.value as LeadStage }))}
                className="w-full rounded-2xl border border-border bg-card-secondary px-4 py-3 text-white focus:outline-none focus:border-primary"
              >
                {[...STAGES].sort((a, b) => a.label.localeCompare(b.label)).map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddLeadOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmittingNewLead}
            >
              Add Lead
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Set Follow-up Reminder Drawer */}
      <Drawer
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        title={reminderLead ? `Schedule Reminder: ${reminderLead.name}` : 'Schedule Reminder'}
        size="md"
      >
        <form onSubmit={handleScheduleReminder} className="space-y-5 text-sm">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">Reminder Date & Time</label>
            <input
              type="datetime-local"
              required
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card-secondary px-4 py-3 text-white focus:outline-none focus:border-primary cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">Instructions / Notes</label>
            <textarea
              value={reminderNote}
              onChange={(e) => setReminderNote(e.target.value)}
              placeholder="e.g. Call client to discuss proposal details..."
              className="w-full rounded-2xl border border-border bg-card-secondary px-4 py-3 text-white focus:outline-none focus:border-primary h-28 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsReminderOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmittingReminder}
            >
              Set Reminder
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
