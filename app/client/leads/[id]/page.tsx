'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { Lead, FollowUp, ActivityLog, Sale, LeadStage } from '../../../../types';
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
  ArrowLeft,
  MessageCircle,
  Plus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { FiPhoneCall } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

interface LeadDetailExtended extends Lead {
  followUps: FollowUp[];
  activityLogs: ActivityLog[];
  sales: Sale[];
}

type TabType = 'timeline' | 'customer' | 'reminders' | 'notes' | 'sales';

const STAGE_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'F1 (Connected)',
  CALL_NOT_ATTENDED: 'Call Not Attended',
  FOLLOW_UP: 'F2 (Follow Up)',
  QUALIFIED: 'F3 (Follow Up)',
  NEGOTIATION: 'Proposal',
  WON: 'Won',
  LOST: 'Lost',
  BOOKED: 'Booked',
  NO_NEED: 'No Need',
  WRONG_LEAD: 'Wrong Lead',
};

const cleanText = (text: string | null | undefined): string => {
  if (!text) return '';
  let cleaned = text.replace(/<[^>]*>/g, '');
  return cleaned.replace(/[<>]/g, '');
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<LeadDetailExtended | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFoundTriggered, setNotFoundTriggered] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('timeline');

  if (notFoundTriggered) {
    notFound();
  }

  // Forms states
  const [note, setNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const [scheduledAt, setScheduledAt] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  const [saleAmount, setSaleAmount] = useState('');
  const [saleCurrency, setSaleCurrency] = useState('INR');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

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
      fetchLeadDetails();
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
    if (!scheduledAt) {
      alert('Please select a date and time.');
      return;
    }

    try {
      setIsSubmittingFollowUp(true);
      await api.post(`/v1/leads/${leadId}/follow-ups`, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        note: followUpNote || undefined,
      });
      setScheduledAt('');
      setFollowUpNote('');
      fetchLeadDetails();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to schedule follow-up.');
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleAmount || parseFloat(saleAmount) <= 0) {
      alert('Please enter a valid sale amount.');
      return;
    }

    try {
      setIsSubmittingSale(true);
      await api.post('/v1/sales', {
        leadId,
        amount: parseFloat(saleAmount),
        currency: saleCurrency,
      });
      setSaleAmount('');
      fetchLeadDetails();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to record sale.');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // Construct Chronological Timeline Events
  const chronologicalTimeline = useMemo(() => {
    if (!lead) return [];
    const events: Array<{ id: string; title: string; desc?: string; date: Date; type: 'creation' | 'activity' | 'reminder' | 'sale' }> = [];

    // Lead Creation Event
    events.push({
      id: `created-${lead.id}`,
      title: 'Lead Created',
      desc: `Lead registered via ${lead.source || 'MANUAL'} channel.`,
      date: new Date(lead.createdAt),
      type: 'creation',
    });

    // Activity Logs
    if (Array.isArray(lead.activityLogs)) {
      lead.activityLogs.forEach((log) => {
        events.push({
          id: log.id,
          title: log.action.replace('_', ' ').toUpperCase(),
          desc: log.newValue ? `Updated to: ${log.newValue}` : log.oldValue ? `Previous: ${log.oldValue}` : undefined,
          date: new Date(log.createdAt),
          type: 'activity',
        });
      });
    }

    // Follow-ups
    if (Array.isArray(lead.followUps)) {
      lead.followUps.forEach((fu) => {
        events.push({
          id: fu.id,
          title: `Reminder Scheduled: ${fu.status.toUpperCase()}`,
          desc: fu.note ? `Note: ${fu.note}` : `Scheduled for: ${new Date(fu.scheduledAt).toLocaleString()}`,
          date: new Date(fu.createdAt),
          type: 'reminder',
        });
      });
    }

    // Sales
    if (Array.isArray(lead.sales)) {
      lead.sales.forEach((s) => {
        events.push({
          id: s.id,
          title: `Sale Recorded: ${s.currency} ${s.amount}`,
          desc: `Closed on ${new Date(s.closedAt).toLocaleDateString()}`,
          date: new Date(s.createdAt),
          type: 'sale',
        });
      });
    }

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [lead]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-rose-400 text-sm">{error || 'Lead not found.'}</p>
        <button onClick={() => router.back()} className="text-xs text-indigo-400 underline">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-24 text-slate-100 font-sans">
      {/* Top Nav Bar */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </button>
        <span className="text-[10px] font-mono text-slate-500">ID: {lead.id}</span>
      </div>

      {/* Hero Customer Header Card */}
      <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Lead Profile</span>
            <h1 className="text-2xl font-black text-white tracking-tight">{cleanText(lead.name)}</h1>
            <p className="text-xs text-slate-400 mt-0.5">Created {new Date(lead.createdAt).toLocaleDateString()}</p>
          </div>

          {/* Stage Dropdown Selector */}
          <div className="w-full sm:w-auto">
            <select
              value={lead.stage}
              onChange={handleStageChange}
              className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider rounded-2xl border border-indigo-500/40 bg-indigo-950/40 text-indigo-300 px-4 py-2.5 focus:outline-none cursor-pointer"
            >
              {Object.entries(STAGE_LABELS).map(([value, label]) => (
                <option key={value} value={value} className="bg-slate-950 text-white">
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Contact & Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
          {lead.phone && (
            <>
              <a
                href={`tel:${lead.phone}`}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-indigo-500/30 bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 text-xs font-bold transition-all"
              >
                <FiPhoneCall className="h-4 w-4" />
                Call Customer
              </a>
              <a
                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 text-xs font-bold transition-all"
              >
                <FaWhatsapp className="h-4 w-4 text-emerald-400" />
                WhatsApp Direct
              </a>
            </>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800/80 overflow-x-auto no-scrollbar gap-1">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Activity Timeline ({chronologicalTimeline.length})
        </button>

        <button
          onClick={() => setActiveTab('customer')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'customer'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Customer Details
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'reminders'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Reminders ({lead.followUps?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'notes'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Notes
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'sales'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Sales Logs ({lead.sales?.length || 0})
        </button>
      </div>

      {/* Tab Content 1: Chronological Activity Timeline */}
      {activeTab === 'timeline' && (
        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Chronological Event Timeline</h3>

          <div className="relative pl-6 space-y-5 border-l border-slate-800">
            {chronologicalTimeline.map((item) => (
              <div key={item.id} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white">{item.title}</p>
                    <span className="text-[10px] text-slate-500">{item.date.toLocaleString()}</span>
                  </div>
                  {item.desc && (
                    <p className="text-xs text-slate-400 mt-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      {item.desc}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {chronologicalTimeline.length === 0 && (
              <p className="text-xs text-slate-500 italic">No timeline events recorded.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Customer Details */}
      {activeTab === 'customer' && (
        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-4 text-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Customer Meta Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-500">Phone Contact</span>
              <p className="font-semibold text-white mt-1">{lead.phone ? cleanText(lead.phone) : '—'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-500">Email Address</span>
              <p className="font-semibold text-white mt-1">{lead.email || '—'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-500">City / Location</span>
              <p className="font-semibold text-white mt-1">{lead.city ? cleanText(lead.city) : '—'}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-500">Lead Acquisition Channel</span>
              <p className="font-semibold text-white mt-1">{lead.source ? lead.source.replace('_', ' ') : 'MANUAL'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Reminders Form & List */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          <form onSubmit={handleScheduleFollowUp} className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-3 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Schedule Next Follow-up</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Instructions / Note</label>
                <input
                  type="text"
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="e.g. Call regarding quotation update"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmittingFollowUp}
                className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg text-xs"
              >
                Set Reminder
              </button>
            </div>
          </form>

          {/* Active Reminders List */}
          <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-3 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Follow-up History</h3>

            <div className="space-y-2">
              {lead.followUps?.map((fu) => (
                <div key={fu.id} className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{new Date(fu.scheduledAt).toLocaleString()}</p>
                    {fu.note && <p className="text-slate-400 text-xs mt-0.5">{fu.note}</p>}
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                    fu.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {fu.status}
                  </span>
                </div>
              ))}
              {(!lead.followUps || lead.followUps.length === 0) && (
                <p className="text-slate-500 italic">No reminders scheduled yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <form onSubmit={handleAddNote} className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-3 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Add Sales Note</h3>
            <textarea
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Type call outcome or customer requirements..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white focus:outline-none focus:border-indigo-500 h-24 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingNote}
                className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all text-xs"
              >
                Add Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Content 5: Sales Logs */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <form onSubmit={handleRecordSale} className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-3 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Record Deal Sale</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Amount</label>
                <input
                  type="number"
                  required
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Currency</label>
                <select
                  value={saleCurrency}
                  onChange={(e) => setSaleCurrency(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmittingSale}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-xs"
              >
                Record Closed Sale
              </button>
            </div>
          </form>

          <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-3 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Closed Sales Records</h3>

            <div className="space-y-2">
              {lead.sales?.map((s) => (
                <div key={s.id} className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-emerald-400 text-sm">{s.currency} {s.amount.toLocaleString()}</p>
                    <p className="text-slate-400 text-xs mt-0.5">Closed on {new Date(s.closedAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                    WON DEAL
                  </span>
                </div>
              ))}
              {(!lead.sales || lead.sales.length === 0) && (
                <p className="text-slate-500 italic">No sales recorded for this lead yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
