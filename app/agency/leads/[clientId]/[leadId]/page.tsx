'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../../lib/api';
import { Lead, FollowUp, ActivityLog, LeadStage } from '../../../../../types';
import { Button } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  Activity,
  MapPin,
  Clock,
  Plus,
  CheckCircle2,
  Trash2,
  Users,
  Sliders,
  Globe,
  Sparkles,
  BookOpen,
  Bell,
  Info,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES: { value: LeadStage; label: string; color: string; dotColor: string }[] = [
  { value: 'NEW', label: 'New', color: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400', dotColor: 'bg-cyan-400' },
  { value: 'CONTACTED', label: 'Contacted', color: 'border-amber-500/20 bg-amber-500/5 text-amber-400', dotColor: 'bg-amber-400' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400', dotColor: 'bg-indigo-400' },
  { value: 'NEGOTIATION', label: 'Proposal', color: 'border-purple-500/20 bg-purple-500/5 text-purple-400', dotColor: 'bg-purple-400' },
  { value: 'WON', label: 'Won', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400', dotColor: 'bg-emerald-400' },
  { value: 'LOST', label: 'Lost', color: 'border-red-500/20 bg-red-500/5 text-red-400', dotColor: 'bg-red-400' }
];

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  const leadId = params.leadId as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notes state
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Follow-up state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [taskNote, setTaskNote] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  // Right-side sub-navigation tab
  const [activeSubTab, setActiveSubTab] = useState<'notes' | 'tasks' | 'activity'>('notes');

  // Success toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadLeadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/v1/leads/${leadId}`);
      setLead(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to retrieve lead profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      loadLeadDetails();
    }
  }, [leadId]);

  const handleStageChange = async (nextStage: LeadStage) => {
    if (!lead) return;
    try {
      await api.patch(`/v1/leads/${lead.id}/stage`, { stage: nextStage });
      setLead(prev => prev ? { ...prev, stage: nextStage } : null);
      showToast(`Pipeline stage updated to ${nextStage}!`, 'success');
      // Re-load details to fetch new stage log in activity list
      loadLeadDetails();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to update stage.', 'info');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !newNote.trim()) return;
    try {
      setSubmittingNote(true);
      await api.post(`/v1/leads/${lead.id}/notes`, { note: newNote });
      setNewNote('');
      showToast('Note added successfully!', 'success');
      loadLeadDetails();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to add note.', 'info');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleScheduleTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !scheduledAt) return;
    try {
      setSubmittingTask(true);
      await api.post(`/v1/leads/${lead.id}/follow-ups`, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        note: taskNote,
      });
      setScheduledAt('');
      setTaskNote('');
      setShowTaskForm(false);
      showToast('Follow-up task scheduled successfully!', 'success');
      loadLeadDetails();
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to schedule task.', 'info');
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await api.patch(`/v1/follow-ups/${taskId}/complete`);
      showToast('Task marked complete!', 'success');
      loadLeadDetails();
    } catch (err: any) {
      showToast('Failed to complete task.', 'info');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-xs font-semibold">Loading Customer Lead Profile...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6 animate-in fade-in duration-200">
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-sm text-red-500 font-bold">
          {error || 'Lead details profile not found.'}
        </div>
        <Button onClick={() => router.push(`/agency/leads/${clientId}`)} variant="secondary" icon={<ArrowLeft size={14} />}>
          Back to Leads Board
        </Button>
      </div>
    );
  }

  // Helper to parse and render activity log oldValue/newValue beautifully instead of raw JSON
  const renderActivityLogDetails = (log: any) => {
    if (log.action === 'note') {
      return <span className="text-white/90 whitespace-pre-wrap">{log.newValue}</span>;
    }

    let isOldJson = false;
    let isNewJson = false;
    let oldObj: any = null;
    let newObj: any = null;

    try {
      if (log.oldValue && (log.oldValue.trim().startsWith('{') || log.oldValue.trim().startsWith('['))) {
        oldObj = JSON.parse(log.oldValue);
        isOldJson = true;
      }
    } catch (e) {}

    try {
      if (log.newValue && (log.newValue.trim().startsWith('{') || log.newValue.trim().startsWith('['))) {
        newObj = JSON.parse(log.newValue);
        isNewJson = true;
      }
    } catch (e) {}

    if (log.action === 'imported_from_google_sheets' && isNewJson && newObj) {
      return (
        <span className="text-text-secondary">
          Synced automatically via CRM connector. Spreadsheet: <strong className="text-white">"{newObj.spreadsheetName || 'Spreadsheet'}"</strong> tab <strong className="text-white">"{newObj.sheetName || 'Sheet1'}"</strong>.
        </span>
      );
    }

    if (isOldJson && isNewJson && oldObj && newObj && typeof oldObj === 'object' && typeof newObj === 'object') {
      const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));
      const changes: { key: string; from: any; to: any }[] = [];

      allKeys.forEach((key) => {
        if (['id', 'clientId', 'agencyId', 'createdAt', 'updatedAt', 'customFields', 'leadSource', 'status', 'createdBy'].includes(key)) return;

        const fromVal = oldObj[key];
        const toVal = newObj[key];

        if (JSON.stringify(fromVal) !== JSON.stringify(toVal)) {
          changes.push({
            key,
            from: fromVal !== undefined && fromVal !== null ? String(fromVal) : '(empty)',
            to: toVal !== undefined && toVal !== null ? String(toVal) : '(empty)',
          });
        }
      });

      const oldCustom = oldObj.customFields || {};
      const newCustom = newObj.customFields || {};
      const allCustomKeys = Array.from(new Set([...Object.keys(oldCustom), ...Object.keys(newCustom)]));

      allCustomKeys.forEach((key) => {
        const fromVal = oldCustom[key];
        const toVal = newCustom[key];

        if (JSON.stringify(fromVal) !== JSON.stringify(toVal)) {
          changes.push({
            key: `Custom Field (${key})`,
            from: fromVal !== undefined && fromVal !== null ? String(fromVal) : '(empty)',
            to: toVal !== undefined && toVal !== null ? String(toVal) : '(empty)',
          });
        }
      });

      if (changes.length > 0) {
        return (
          <div className="mt-2 space-y-1 bg-card-secondary/10 p-2.5 rounded-xl border border-border/30 text-[11px] max-w-xl">
            {changes.map((change, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-1.5 leading-normal">
                <span className="text-text-secondary/70 font-mono capitalize">{change.key.replace(/([A-Z])/g, ' $1')}:</span>
                <span className="text-red-400 line-through truncate max-w-[150px] font-medium" title={change.from}>{change.from}</span>
                <span className="text-text-secondary/40">➔</span>
                <span className="text-emerald-450 font-bold truncate max-w-[180px]" title={change.to}>{change.to}</span>
              </div>
            ))}
          </div>
        );
      }

      return <span className="text-text-secondary italic font-medium">Google Sheets synchronization completed (no value changes).</span>;
    }

    if (log.oldValue && log.newValue) {
      return (
        <span className="text-text-secondary">
          {" "}from <strong className="text-white/85">{log.oldValue}</strong> to <strong className="text-white">{log.newValue}</strong>
        </span>
      );
    }

    if (log.newValue) {
      return <span className="text-text-secondary">{log.newValue}</span>;
    }

    return null;
  };

  // Filter notes out of activity log list
  const notesLogList = (lead as any).activityLogs?.filter((log: any) => log.action === 'note') || [];
  const activityLogList = (lead as any).activityLogs?.filter((log: any) => log.action !== 'note') || [];
  const followUpTaskList = (lead as any).followUps || [];

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300 relative">
      
      {/* Back button and page Title */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4.5">
        <Button onClick={() => router.push(`/agency/leads/${clientId}`)} variant="secondary" size="sm" icon={<ArrowLeft size={13} />}>
          Back to Leads Workspace
        </Button>
        <span className="text-[10px] text-text-secondary font-black uppercase tracking-wider">
          Lead Telemetry detail
        </span>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Profile details & Metadata */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Main profile identity card */}
          <AppCard className="p-6 overflow-hidden relative" hoverEffect={false}>
            <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl" />
            
            <div className="space-y-4 relative">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 border border-primary/15">
                  <Activity size={18} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-white truncate leading-snug">{lead.name}</h2>
                  <p className="text-[10px] font-mono text-text-secondary mt-0.5">ID: {lead.id}</p>
                </div>
              </div>

              {/* Status Badge and stage selector */}
              <div className="flex flex-col gap-2 pt-3.5 border-t border-border/60 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold text-text-secondary">Pipeline Stage</span>
                  {STAGES.map((s) => s.value === lead.stage && (
                    <Badge key={s.value} variant={s.value === 'WON' ? 'success' : s.value === 'LOST' ? 'danger' : 'warning'} dot>
                      {s.label}
                    </Badge>
                  ))}
                </div>
                
                <select
                  value={lead.stage}
                  onChange={(e) => handleStageChange(e.target.value as LeadStage)}
                  className="w-full text-xs text-white bg-card border border-border rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-primary font-bold mt-1"
                >
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value} className="bg-slate-900 text-white font-normal">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact info logs */}
              <div className="space-y-3.5 pt-4.5 border-t border-border/60">
                
                {/* Email */}
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-text-secondary/60 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] uppercase font-bold text-text-secondary">Email Address</p>
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="font-semibold text-white hover:underline truncate block mt-0.5">
                        {lead.email}
                      </a>
                    ) : (
                      <p className="font-semibold text-text-secondary/50 mt-0.5">Not Provided</p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-text-secondary/60 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] uppercase font-bold text-text-secondary">Phone Contact</p>
                      <p className="font-semibold text-white mt-0.5">{lead.phone || 'Not Provided'}</p>
                    </div>
                  </div>

                  {lead.phone && (
                    <div className="flex gap-2 mt-1.5">
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/15 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <Phone className="h-3 w-3" />
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <MessageCircle className="h-3 w-3" />
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </AppCard>

          {/* Geographical & Ingestion Metadata */}
          <AppCard className="p-6 space-y-4" hoverEffect={false}>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Milestones & Origin</h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-secondary">Acquisition Source</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    <span className="text-white font-bold uppercase text-[10px]">
                      {(lead.source || 'MANUAL').replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-text-secondary">City / Location</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span className="text-white font-bold text-[10px]">
                      {lead.city || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/40 pt-3">
                <span className="text-[9px] uppercase font-bold text-text-secondary">Assigned Sales Agent</span>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4 text-text-secondary/65" />
                  <span className="text-white font-semibold">
                    {lead.assignedUser?.email || 'Unassigned / Not Routed'}
                  </span>
                </div>
              </div>

              <div className="border-t border-border/40 pt-3">
                <span className="text-[9px] uppercase font-bold text-text-secondary">Lead Creation Timestamp</span>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-text-secondary/65" />
                  <span className="text-white font-semibold">
                    {new Date(lead.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </AppCard>

          {/* Meta Ads Webhook Telemetry diagnostics (only if metaLeadId exists) */}
          {lead.metaLeadId && (
            <AppCard className="p-6 border border-blue-500/20 bg-blue-500/5 space-y-4" hoverEffect={false}>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Meta Ads Webhook Telemetry</h3>
              </div>
              
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-blue-400">Marketing Campaign Name</span>
                  <p className="text-white font-semibold mt-0.5 truncate">{lead.campaignName || 'Unknown Campaign'}</p>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-blue-400">Source Page Name</span>
                  <p className="text-white font-semibold mt-0.5 truncate">{lead.pageName || 'Unknown Page'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-blue-500/15 pt-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-blue-400">Meta Lead ID</span>
                    <p className="text-white font-mono text-[10px] mt-0.5 truncate">{lead.metaLeadId}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-blue-400">Ad Account Name</span>
                    <p className="text-white font-semibold mt-0.5 truncate">{lead.adAccountName || 'Unknown Account'}</p>
                  </div>
                </div>
              </div>
            </AppCard>
          )}

        </div>

        {/* Right Column: Tabbed Logs (Notes, Followups, Activities) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main workspace log tabs card */}
          <AppCard className="p-6">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-3">
              <div className="flex gap-4">
                
                {/* Notes tab */}
                <button
                  onClick={() => setActiveSubTab('notes')}
                  className={`text-xs uppercase font-extrabold pb-2 border-b-2 transition-colors cursor-pointer tracking-wider flex items-center gap-1.5 ${
                    activeSubTab === 'notes' 
                      ? 'text-primary border-primary' 
                      : 'text-text-secondary border-transparent hover:text-white'
                  }`}
                >
                  <BookOpen size={13} />
                  Notes Log
                </button>

                {/* Tasks tab */}
                <button
                  onClick={() => setActiveSubTab('tasks')}
                  className={`text-xs uppercase font-extrabold pb-2 border-b-2 transition-colors cursor-pointer tracking-wider flex items-center gap-1.5 ${
                    activeSubTab === 'tasks' 
                      ? 'text-primary border-primary' 
                      : 'text-text-secondary border-transparent hover:text-white'
                  }`}
                >
                  <ClipboardList size={13} />
                  Follow-up Tasks
                </button>

                {/* Activity tab */}
                <button
                  onClick={() => setActiveSubTab('activity')}
                  className={`text-xs uppercase font-extrabold pb-2 border-b-2 transition-colors cursor-pointer tracking-wider flex items-center gap-1.5 ${
                    activeSubTab === 'activity' 
                      ? 'text-primary border-primary' 
                      : 'text-text-secondary border-transparent hover:text-white'
                  }`}
                >
                  <Activity size={13} />
                  Chronological Activity
                </button>

              </div>

              <span className="text-[10px] text-text-secondary font-black uppercase hidden sm:inline">
                Lead History Details
              </span>
            </div>

            {/* TAB CONTENTS CONTAINER */}
            <div className="min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSubTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  
                  {/* ───────────────── NOTES TAB CONTENT ───────────────── */}
                  {activeSubTab === 'notes' && (
                    <div className="space-y-6">
                      
                      {/* Add new note Form */}
                      <form onSubmit={handleAddNote} className="space-y-3.5 bg-card-secondary/20 p-4.5 rounded-2xl border border-border/80">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Plus size={12} className="text-primary" /> Append New Note Entry
                        </h4>
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Type notes detail regarding recent conversations or meeting call outlines..."
                          rows={3}
                          className="w-full text-xs text-white bg-card border border-border rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none resize-none font-medium placeholder-text-secondary/70"
                        />
                        <div className="flex justify-end">
                          <Button type="submit" size="sm" loading={submittingNote}>
                            Save Note to Log
                          </Button>
                        </div>
                      </form>

                      {/* Notes list */}
                      <div className="space-y-3">
                        {notesLogList.length === 0 ? (
                          <div className="text-center py-12 border border-dashed border-border rounded-2xl text-text-secondary italic text-xs">
                            No notes logged for this customer lead yet.
                          </div>
                        ) : (
                          notesLogList.map((log: any) => (
                            <div key={log.id} className="p-4 rounded-2xl border border-border bg-card-secondary/10 space-y-3">
                              <div className="flex justify-between items-center text-[10px] text-text-secondary font-bold">
                                <span className="flex items-center gap-1.5">
                                  <Users size={11} className="text-primary" /> Logged by: {log.user?.email || 'System / Client Owner'}
                                </span>
                                <span className="flex items-center gap-1"><Clock size={11} /> {new Date(log.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="text-xs text-white bg-card-secondary/40 p-3 rounded-xl border border-border/40 font-medium whitespace-pre-wrap leading-relaxed">
                                {log.newValue}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                    </div>
                  )}

                  {/* ───────────────── FOLLOW-UP TASKS TAB CONTENT ───────────────── */}
                  {activeSubTab === 'tasks' && (
                    <div className="space-y-6">
                      
                      {/* Headline / Add button */}
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Scheduled Callbacks</h4>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => setShowTaskForm(!showTaskForm)}
                          icon={showTaskForm ? <ChevronRight size={13} /> : <Plus size={13} />}
                        >
                          {showTaskForm ? 'Close Scheduler' : 'Schedule Task'}
                        </Button>
                      </div>

                      {/* Add Task Form */}
                      {showTaskForm && (
                        <motion.form 
                          onSubmit={handleScheduleTask}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="bg-card-secondary/20 border border-border rounded-2xl p-4.5 space-y-4 overflow-hidden"
                        >
                          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar size={12} className="text-primary" /> Schedule Callback Reminder
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">Date &amp; Time</label>
                              <input 
                                type="datetime-local"
                                required
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                className="w-full text-xs text-white bg-card border border-border rounded-xl px-3 py-2 focus:border-primary focus:outline-none font-medium"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">Notes Note Description</label>
                              <input 
                                type="text"
                                value={taskNote}
                                onChange={(e) => setTaskNote(e.target.value)}
                                placeholder="Call customer regarding pricing proposal..."
                                className="w-full text-xs text-white bg-card border border-border rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end pt-1">
                            <Button type="submit" size="sm" loading={submittingTask}>Schedule Call</Button>
                          </div>
                        </motion.form>
                      )}

                      {/* Tasks List */}
                      <div className="space-y-3">
                        {followUpTaskList.length === 0 ? (
                          <div className="text-center py-12 border border-dashed border-border rounded-2xl text-text-secondary italic text-xs">
                            No follow-up callback tasks scheduled for this lead.
                          </div>
                        ) : (
                          followUpTaskList.map((task: FollowUp) => {
                            const isOverdue = new Date(task.scheduledAt) < new Date() && task.status === 'pending';
                            return (
                              <div 
                                key={task.id} 
                                className={`p-4 rounded-2xl border bg-card-secondary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-premium ${
                                  isOverdue ? 'border-red-500/20' : 'border-border'
                                }`}
                              >
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-bold text-xs flex items-center gap-1.5">
                                      <Calendar size={11} className="text-primary" /> {new Date(task.scheduledAt).toLocaleString()}
                                    </span>
                                    <Badge variant={task.status === 'done' ? 'success' : isOverdue ? 'danger' : 'warning'}>
                                      {task.status === 'done' ? 'Complete' : isOverdue ? 'Overdue' : 'Pending'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-text-secondary italic mt-1 bg-card-secondary/40 p-2.5 rounded-xl border border-border/40 max-w-xl truncate">
                                    {task.note || 'No notes description provided.'}
                                  </p>
                                </div>

                                <div className="shrink-0 flex items-center gap-2 self-end sm:self-auto">
                                  {task.status === 'pending' && (
                                    <Button 
                                      onClick={() => handleCompleteTask(task.id)}
                                      size="sm"
                                    >
                                      Mark Completed
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                    </div>
                  )}

                  {/* ───────────────── CHRONOLOGICAL ACTIVITY TAB CONTENT ───────────────── */}
                  {activeSubTab === 'activity' && (
                    <div className="space-y-6">
                      
                      {/* Timeline component */}
                      <div className="relative pl-6 border-l border-border/70 space-y-6 ml-2">
                        {activityLogList.length === 0 ? (
                          <div className="text-center py-12 border border-dashed border-border rounded-2xl text-text-secondary italic text-xs -ml-8">
                            No history activity logs tracked for this lead.
                          </div>
                        ) : (
                          activityLogList.map((log: any) => {
                            return (
                              <div key={log.id} className="relative">
                                {/* Dot indicator */}
                                <div className="absolute -left-8.5 top-1 h-5 w-5 rounded-full bg-card border-2 border-primary flex items-center justify-center shrink-0 z-10">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                </div>

                                {/* Content */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[10px] text-text-secondary font-bold">
                                    <span className="text-white text-xs font-black uppercase tracking-wider">
                                      {log.action.replace('_', ' ')}
                                    </span>
                                    <span className="flex items-center gap-1"><Clock size={11} /> {new Date(log.createdAt).toLocaleString()}</span>
                                  </div>
                                  
                                  <div className="text-xs text-text-secondary leading-relaxed mt-1">
                                    <span>Updated by <strong className="text-white">{log.user?.email || 'System Engine'}</strong></span>
                                    {renderActivityLogDetails(log)}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </AppCard>

        </div>

      </div>

      {/* Toast popup */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl border shadow-xl flex items-center gap-3 backdrop-blur-md max-w-sm ${
              toast.type === 'success' 
                ? 'bg-emerald-950/80 border-emerald-500/25 text-emerald-350' 
                : 'bg-slate-900/80 border-border/80 text-white'
            }`}
          >
            <CheckCircle2 size={16} className={toast.type === 'success' ? 'text-emerald-400' : 'text-primary'} />
            <p className="text-xs font-bold">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
