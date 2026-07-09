'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { FollowUp } from '../../../types';
import {
  Phone,
  MessageCircle,
  Calendar,
  User,
  FileText,
  Clock,
  ArrowRight,
  AlertCircle,
  Bell,
  CheckCircle2
} from 'lucide-react';

interface FollowUpWithLead extends FollowUp {
  leadName: string;
  leadPhone?: string | null;
}

export default function NotificationsPage() {
  const [tasks, setTasks] = useState<FollowUpWithLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedOutcomes, setSelectedOutcomes] = useState<Record<string, string>>({});
  const [customNotes, setCustomNotes] = useState<Record<string, string>>({});
  const [selectedStages, setSelectedStages] = useState<Record<string, string>>({});
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchPendingFollowUps = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/v1/follow-ups?status=pending');
      if (response.data && Array.isArray(response.data.data)) {
        setTasks(response.data.data);
      } else {
        setTasks([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingFollowUps();
  }, []);

  const handleUpdateStatus = async (taskId: string) => {
    try {
      setUpdatingTaskId(taskId);
      const outcomeVal = selectedOutcomes[taskId];
      const finalOutcome = outcomeVal === 'Custom' ? customNotes[taskId] : outcomeVal;
      const targetStage = selectedStages[taskId] || tasks.find(t => t.id === taskId)?.lead?.stage;

      if (!finalOutcome) return;

      await api.patch(`/v1/follow-ups/${taskId}/complete`, {
        outcome: finalOutcome,
        leadStage: targetStage
      });

      // Filter completed task out of notifications page state
      setTasks(prev => prev.filter(t => t.id !== taskId));
      
      // Clean up states
      setSelectedOutcomes(prev => {
        const copy = { ...prev };
        delete copy[taskId];
        return copy;
      });
      setCustomNotes(prev => {
        const copy = { ...prev };
        delete copy[taskId];
        return copy;
      });
      setSelectedStages(prev => {
        const copy = { ...prev };
        delete copy[taskId];
        return copy;
      });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to complete task.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Bell className="h-7 w-7 text-primary" />
          Notifications Center
        </h1>
        <p className="text-slate-400 mt-1">Pending customer reminders requiring your direct action</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-2">Unresolved Lead Follow-ups</h2>

        {loading && <p className="text-slate-400 text-sm">Loading notifications...</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        {!loading && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border bg-card/25 rounded-2xl text-center space-y-4 max-w-md mx-auto">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">You are all caught up!</h3>
              <p className="text-xs text-text-secondary mt-1 px-4">
                No active notifications or pending reminders. All follow-up tasks have been successfully resolved.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {tasks.map((task) => {
            const isOverdue = new Date(task.scheduledAt) < new Date();
            return (
              <div
                key={task.id}
                className={`group relative overflow-hidden border rounded-xl p-4 sm:p-5 bg-gradient-to-br from-card to-card/40 hover:from-card hover:to-card/65 transition-premium flex flex-col gap-4.5 ${
                  isOverdue 
                    ? 'border-red-500/20 hover:border-red-500/40 shadow-lg shadow-red-950/5' 
                    : 'border-border bg-card shadow-premium-card hover:border-primary/25'
                }`}
              >
                {/* Visual Accent Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  isOverdue ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                }`} />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pl-2.5">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-colors ${
                      isOverdue
                        ? 'bg-red-500/10 border-red-500/15 text-red-400'
                        : 'bg-amber-500/10 border-amber-500/15 text-amber-400'
                    }`}>
                      {isOverdue ? (
                        <AlertCircle size={16} />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm tracking-tight">
                        Follow-up with {task.leadName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-text-secondary flex items-center gap-1">
                          <Calendar size={10} className="shrink-0" />
                          {new Date(task.scheduledAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-text-secondary">•</span>
                        <span className="text-[10px] font-mono text-text-secondary flex items-center gap-1">
                          <Clock size={10} className="shrink-0" />
                          {new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border shrink-0 ${
                    isOverdue
                      ? 'bg-red-500/15 border-red-500/20 text-red-400 animate-pulse'
                      : 'bg-amber-500/15 border-amber-500/20 text-amber-400'
                  }`}>
                    {isOverdue ? 'Overdue' : 'Pending'}
                  </span>
                </div>

                {/* Instructions note details block */}
                <div className="pl-2.5 space-y-3">
                  <div className="bg-card-secondary/40 border border-border/40 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
                    <FileText size={14} className="text-text-secondary/70 shrink-0 mt-0.5" />
                    <p className="italic leading-normal whitespace-pre-wrap flex-1">
                      {task.note || 'No instructions note provided.'}
                    </p>
                  </div>

                  {/* Log outcomes area */}
                  <div className="bg-card-secondary/25 border border-border/25 p-3.5 rounded-xl flex flex-col gap-3 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">Log outcome & complete</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Outcome</label>
                        <select
                          value={selectedOutcomes[task.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedOutcomes(prev => ({ ...prev, [task.id]: val }));
                            if (val === 'Proposal Sent') {
                              setSelectedStages(prev => ({ ...prev, [task.id]: 'NEGOTIATION' }));
                            } else if (val === 'Cancelled') {
                              setSelectedStages(prev => ({ ...prev, [task.id]: 'LOST' }));
                            }
                          }}
                          className="w-full text-xs text-white bg-card border border-border rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-primary font-bold"
                        >
                          <option value="">-- Choose Outcome --</option>
                          <option value="Proposal Sent">Proposal Sent</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Custom">Custom...</option>
                        </select>
                      </div>

                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Pipeline Stage</label>
                        <select
                          value={selectedStages[task.id] || task.lead?.stage || ''}
                          onChange={(e) => setSelectedStages(prev => ({ ...prev, [task.id]: e.target.value }))}
                          className="w-full text-xs text-white bg-card border border-border rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-primary font-bold"
                        >
                          {Object.entries({
                            NEW: 'New',
                            CONTACTED: 'Contacted',
                            FOLLOW_UP: 'Follow Up',
                            QUALIFIED: 'Qualified',
                            NEGOTIATION: 'Negotiation',
                            WON: 'Won Deal',
                            LOST: 'Lost Deal',
                            BOOKED: 'Booked',
                            NO_NEED: 'No Need',
                            WRONG_LEAD: 'Wrong Lead'
                          })
                          .sort((a, b) => a[1].localeCompare(b[1]))
                          .map(([val, label]) => (
                            <option key={val} value={val} className="bg-slate-900 text-white font-normal">{label}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleUpdateStatus(task.id)}
                        disabled={updatingTaskId === task.id || !(selectedOutcomes[task.id]) || (selectedOutcomes[task.id] === 'Custom' && !(customNotes[task.id]?.trim()))}
                        className="px-4 py-2 text-xs font-bold bg-primary hover:brightness-110 text-black rounded-xl disabled:opacity-40 transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-end h-[38px] flex items-center justify-center gap-1.5"
                      >
                        {updatingTaskId === task.id ? 'Saving...' : 'Complete Task'}
                      </button>
                    </div>
                    
                    {selectedOutcomes[task.id] === 'Custom' && (
                      <input
                        type="text"
                        value={customNotes[task.id] || ''}
                        onChange={(e) => setCustomNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                        placeholder="Log custom text..."
                        className="w-full text-xs text-white bg-card border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-primary mt-0.5 animate-in slide-in-from-top-2 duration-200"
                      />
                    )}
                  </div>
                </div>

                {/* Card controls and actions */}
                <div className="border-t border-border/50 pt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pl-2.5">
                  <div className="flex gap-2">
                    {task.leadPhone && (
                      <>
                        <a
                          href={`tel:${task.leadPhone}`}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-650/10 hover:bg-indigo-650/20 text-indigo-400 border border-indigo-500/10 transition-colors text-xs font-bold cursor-pointer"
                          title={`Call ${task.leadName}`}
                        >
                          <Phone size={13} />
                          Call
                        </a>
                        <a
                          href={`https://wa.me/${task.leadPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/10 transition-colors text-xs font-bold cursor-pointer"
                          title={`WhatsApp ${task.leadName}`}
                        >
                          <MessageCircle size={13} />
                          WhatsApp
                        </a>
                      </>
                    )}
                  </div>

                  <Link
                    href={`/client/leads/${task.leadId}`}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-card-secondary hover:bg-hover hover:text-white border border-border text-xs font-bold text-slate-350 transition-colors"
                  >
                    View Lead Profile
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
