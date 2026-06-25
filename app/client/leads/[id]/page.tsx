'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Lead, FollowUp, ActivityLog, Sale } from '../../../../types';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  FileText, 
  Activity, 
  Clock, 
  Tag, 
  UserCheck, 
  Briefcase 
} from 'lucide-react';

interface LeadDetailExtended extends Lead {
  followUps: FollowUp[];
  activityLogs: ActivityLog[];
  sales: Sale[];
}

type TabType = 'overview' | 'notes' | 'followups' | 'activities' | 'sales' | 'timeline';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<LeadDetailExtended | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFoundTriggered, setNotFoundTriggered] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (notFoundTriggered) {
    notFound();
  }

  // Forms states
  const [note, setNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const [scheduledAt, setScheduledAt] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  const [followUpSuccess, setFollowUpSuccess] = useState<string | null>(null);

  const [saleAmount, setSaleAmount] = useState('');
  const [saleCurrency, setSaleCurrency] = useState('INR');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState<string | null>(null);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/v1/leads/${leadId}`);
      setLead(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 400) {
        setNotFoundTriggered(true);
      } else {
        setError(err.response?.data?.error?.message || 'Failed to load lead details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails();
    }
  }, [leadId]);

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStage = e.target.value;
    try {
      await api.patch(`/v1/leads/${leadId}/stage`, { stage: nextStage });
      fetchLeadDetails(); // Reload history
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update lead stage');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    try {
      setIsSubmittingNote(true);
      await api.post(`/v1/leads/${leadId}/notes`, { note });
      setNote('');
      fetchLeadDetails();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFollowUpSuccess(null);

    if (!scheduledAt) {
      alert('Please select a date and time.');
      return;
    }

    try {
      setIsSubmittingFollowUp(true);
      await api.post(`/v1/leads/${leadId}/follow-ups`, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        note: followUpNote,
      });

      setScheduledAt('');
      setFollowUpNote('');
      setFollowUpSuccess('Follow-up successfully scheduled!');
      fetchLeadDetails();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to schedule follow-up.');
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaleSuccess(null);

    if (!saleAmount || isNaN(Number(saleAmount)) || Number(saleAmount) <= 0) {
      alert('Please enter a valid sale amount.');
      return;
    }

    try {
      setIsSubmittingSale(true);
      await api.post(`/v1/sales`, {
        leadId,
        amount: Number(saleAmount),
        currency: saleCurrency,
        closedAt: new Date().toISOString(),
      });

      setSaleAmount('');
      setSaleSuccess('Sale recorded successfully!');
      fetchLeadDetails();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to record sale.');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // Compile unified timeline items
  const timelineItems = useMemo(() => {
    if (!lead) return [];

    const items: { id: string; type: string; title: string; details: React.ReactNode; time: Date }[] = [];

    // 1. Creation Entry
    items.push({
      id: 'creation',
      type: 'creation',
      title: 'Lead Created',
      details: `Lead added to pipeline. Assigned Stage: ${lead.stage}`,
      time: new Date(lead.createdAt)
    });

    // 2. Google Sheets sync Entry
    if (lead.leadSource === 'GOOGLE_SHEETS') {
      items.push({
        id: 'google-sheets-import',
        type: 'import',
        title: 'Imported from Google Sheets',
        details: `Synced automatically via CRM connector. Mapped fields recorded.`,
        time: new Date(lead.createdAt)
      });
    }

    // 3. Activity Logs (Stage changes & notes)
    lead.activityLogs.forEach((log) => {
      if (log.action === 'stage_change') {
        items.push({
          id: log.id,
          type: 'stage_change',
          title: 'Stage Changed',
          details: `Pipeline stage shifted from ${log.oldValue || 'None'} to ${log.newValue || 'None'}.`,
          time: new Date(log.createdAt)
        });
      } else if (log.action === 'note') {
        items.push({
          id: log.id,
          type: 'note',
          title: 'Note Added',
          details: log.newValue || 'No note content',
          time: new Date(log.createdAt)
        });
      } else if (log.action === 'imported_from_google_sheets') {
        const info = log.newValue ? JSON.parse(log.newValue) : {};
        items.push({
          id: log.id,
          type: 'import',
          title: 'Imported from Google Sheets',
          details: info.message || `Synced from spreadsheet "${info.spreadsheetName}" tab "${info.sheetName}".`,
          time: new Date(log.createdAt)
        });
      } else if (log.action === 'lead_updated_from_google_sheets') {
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

        let detailsNode: React.ReactNode = `Google Sheets synchronization updated.`;

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
            detailsNode = (
              <div className="mt-1 space-y-1 text-[11px] leading-normal">
                {changes.map((change, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-1.5">
                    <span className="text-text-secondary/70 font-mono capitalize">{change.key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="text-red-400 line-through truncate max-w-[120px] font-medium" title={change.from}>{change.from}</span>
                    <span className="text-text-secondary/40">➔</span>
                    <span className="text-emerald-450 font-bold truncate max-w-[150px]" title={change.to}>{change.to}</span>
                  </div>
                ))}
              </div>
            );
          } else {
            detailsNode = `Google Sheets synchronization completed (no value changes).`;
          }
        }

        items.push({
          id: log.id,
          type: 'import',
          title: 'Google Sheets Updated Lead',
          details: detailsNode,
          time: new Date(log.createdAt)
        });
      }
    });

    // 4. Follow ups Scheduled
    lead.followUps.forEach((task) => {
      items.push({
        id: task.id,
        type: 'follow_up',
        title: 'Follow-up Scheduled',
        details: `Scheduled task for ${new Date(task.scheduledAt).toLocaleString()}. Note: ${task.note || 'None'}`,
        time: new Date(task.createdAt)
      });
    });

    // 5. Sales closed
    lead.sales.forEach((sale) => {
      items.push({
        id: sale.id,
        type: 'sale',
        title: 'Sale Recorded',
        details: `Closed sale deal worth ${sale.amount} ${sale.currency}.`,
        time: new Date(sale.createdAt)
      });
    });

    // Sort descending by time
    return items.sort((a, b) => b.time.getTime() - a.time.getTime());
  }, [lead]);

  if (loading && !lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-6 text-sm text-red-400 text-center">
        {error}
        <button onClick={() => router.push('/client/leads')} className="block mx-auto mt-4 text-xs underline text-indigo-400 hover:text-indigo-300">
          Return to pipeline
        </button>
      </div>
    );
  }

  const STAGE_LABELS: Record<string, string> = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    FOLLOW_UP: 'Follow Up',
    QUALIFIED: 'Qualified',
    NEGOTIATION: 'Negotiation',
    WON: 'Won Deal',
    LOST: 'Lost Deal',
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-[48px] font-bold text-white tracking-tight leading-none font-display">
            {lead?.name}
          </h1>
          <p className="text-text-secondary text-sm mt-2 font-mono">
            Lead ID: {lead?.id} • Source Type: {lead?.leadSource || 'GOOGLE_SHEETS'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-secondary font-bold uppercase tracking-wider">Pipeline Stage</span>
          <select
            value={lead?.stage}
            onChange={handleStageChange}
            className="bg-card text-white text-xs border border-border rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary cursor-pointer font-bold"
          >
            {Object.entries(STAGE_LABELS).map(([val, label]) => (
              <option key={val} value={val} className="bg-zinc-900 text-white">{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main 3-Column Layout: 25% / 50% / 25% */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT COLUMN (25%): Profile Card, Custom Parameters, Meta Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card / Contact Info */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-premium-card space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Contact Info</h2>
            <div className="space-y-3.5 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Email Address</span>
                <p className="font-semibold text-white truncate" title={lead?.email ?? undefined}>{lead?.email || 'N/A'}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Phone Number</span>
                <p className="font-semibold text-white">{lead?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Custom Parameters */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-premium-card space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Custom Fields</h2>
            <div className="space-y-3.5 text-xs text-text-secondary font-semibold">
              <div className="flex justify-between">
                <span>City</span>
                <span className="text-white font-bold">{lead?.city || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Source Label</span>
                <span className="text-white font-bold">{lead?.source || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Created By</span>
                <span className="text-white font-bold capitalize">{lead?.createdBy?.toLowerCase() || 'system'}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className="text-success font-bold">{lead?.status || 'ACTIVE'}</span>
              </div>
            </div>
          </div>

          {/* Meta Details */}
          {lead && (lead.metaLeadId || lead.campaignName || lead.pageName) && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-premium-card space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Meta Ad Details</h2>
              <div className="space-y-3.5 text-xs text-text-secondary">
                {lead.metaLeadId && (
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider font-bold">Meta Lead ID</span>
                    <p className="font-mono text-[10px] text-white select-all">{lead.metaLeadId}</p>
                  </div>
                )}
                {lead.campaignName && (
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider font-bold">Campaign</span>
                    <p className="text-white font-semibold">{lead.campaignName}</p>
                  </div>
                )}
                {lead.pageName && (
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider font-bold">Facebook Page</span>
                    <p className="text-white font-semibold">{lead.pageName}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CENTER COLUMN (50%): Notes, Activity Feed, Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes logger form + history list */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-premium-card space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Notes Log</h2>
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Log a new detail note..."
                disabled={isSubmittingNote}
                className="flex-1 rounded-xl border border-border bg-card-secondary px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={isSubmittingNote || !note.trim()}
                className="rounded-xl bg-primary hover:brightness-110 px-4 py-2.5 text-xs font-bold text-black transition-all cursor-pointer disabled:opacity-50"
              >
                Log
              </button>
            </form>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {lead?.activityLogs
                .filter((log) => log.action === 'note')
                .map((log) => (
                  <div key={log.id} className="p-3 rounded-xl border border-border/60 bg-card-secondary/50 text-xs">
                    <div className="flex justify-between text-[10px] text-text-secondary mb-1 font-bold">
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                      <span>By Teammate</span>
                    </div>
                    <p className="text-slate-200 whitespace-pre-wrap">{log.newValue}</p>
                  </div>
                ))}
              {lead?.activityLogs.filter(log => log.action === 'note').length === 0 && (
                <p className="text-text-secondary text-xs italic">No notes logged yet.</p>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-premium-card space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Chronological Activity</h2>
            <div className="relative border-l border-border ml-2 pl-4 space-y-6 max-h-[400px] overflow-y-auto pr-1">
              {timelineItems.map((item) => (
                <div key={item.id} className="relative">
                  {/* Dot */}
                  <div className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border border-card ${
                    item.type === 'creation' ? 'bg-primary' :
                    item.type === 'import' ? 'bg-secondary animate-pulse' :
                    item.type === 'stage_change' ? 'bg-warning' :
                    item.type === 'note' ? 'bg-text-secondary' :
                    item.type === 'follow_up' ? 'bg-purple-400' :
                    'bg-success'
                  }`} />
                  
                  <span className="text-[10px] font-bold text-text-secondary">{new Date(item.time).toLocaleString()}</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">{item.title}</h4>
                  <div className="text-xs text-text-secondary mt-1 bg-card-secondary/40 p-2.5 rounded-xl border border-border/40">
                    {item.details}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (25%): Tasks & Revenue */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tasks / Follow ups */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-premium-card space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Follow-up Tasks</h2>
            {followUpSuccess && (
              <div className="rounded-xl bg-success/15 border border-success/20 p-2.5 text-[11px] text-success text-center">
                {followUpSuccess}
              </div>
            )}
            <form onSubmit={handleScheduleFollowUp} className="space-y-3 text-xs">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-border bg-card-secondary px-3 py-2 text-white focus:outline-none focus:border-primary cursor-pointer"
              />
              <textarea
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                placeholder="Follow-up instructions..."
                className="w-full rounded-xl border border-border bg-card-secondary px-3 py-2 text-white focus:outline-none h-14 resize-none"
              />
              <button
                type="submit"
                disabled={isSubmittingFollowUp || !scheduledAt}
                className="w-full rounded-xl bg-primary hover:brightness-110 py-2 font-bold text-black cursor-pointer transition-all disabled:opacity-50 text-xs"
              >
                {isSubmittingFollowUp ? 'Scheduling...' : 'Schedule Task'}
              </button>
            </form>

            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 pt-2 border-t border-border/50">
              {lead?.followUps.map((task) => (
                <div key={task.id} className="p-2.5 rounded-xl border border-border bg-card-secondary text-xs">
                  <div className="flex justify-between font-bold text-text-secondary text-[10px] mb-1">
                    <span>{new Date(task.scheduledAt).toLocaleDateString()}</span>
                    <span className="uppercase text-[8px] px-1 bg-card border border-border rounded font-bold">{task.status}</span>
                  </div>
                  <p className="text-slate-300 italic truncate">{task.note || 'No instruction notes.'}</p>
                </div>
              ))}
              {lead?.followUps.length === 0 && (
                <p className="text-text-secondary text-xs italic">No follow-ups scheduled.</p>
              )}
            </div>
          </div>

          {/* Revenue */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-premium-card space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-success">Deal Value / Sales</h2>
            {saleSuccess && (
              <div className="rounded-xl bg-success/15 border border-success/20 p-2.5 text-[11px] text-success text-center">
                {saleSuccess}
              </div>
            )}
            <form onSubmit={handleRecordSale} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full rounded-xl border border-border bg-card-secondary px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
                <select
                  value={saleCurrency}
                  onChange={(e) => setSaleCurrency(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card-secondary px-3 py-2 text-white focus:outline-none focus:border-primary"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isSubmittingSale || !saleAmount}
                className="w-full rounded-xl bg-success hover:brightness-110 py-2 font-bold text-white cursor-pointer transition-all disabled:opacity-50 text-xs"
              >
                Record Won Deal
              </button>
            </form>

            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 pt-2 border-t border-border/50">
              {lead?.sales.map((sale) => (
                <div key={sale.id} className="p-2.5 rounded-xl border border-border bg-card-secondary text-xs flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-text-secondary font-bold">{new Date(sale.closedAt).toLocaleDateString()}</p>
                    <span className="text-[8px] font-mono text-text-secondary">ID: {sale.id.substring(0, 6)}</span>
                  </div>
                  <span className="text-success font-bold text-[13px]">{sale.currency} {Number(sale.amount).toLocaleString()}</span>
                </div>
              ))}
              {lead?.sales.length === 0 && (
                <p className="text-text-secondary text-xs italic">No sales recorded.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
