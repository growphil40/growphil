'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, Phone, PhoneOff, ArrowRightLeft, FileText, Calendar, CalendarCheck, MessageCircle, Mail, Trophy, XCircle, AlertTriangle, Minus, PlusCircle, Edit, Send, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Lead, ActivityLog } from '../../types';

/* ─────────────────────────────────────────── */
/* Activity Type Config: icon, color, label    */
/* ─────────────────────────────────────────── */

interface ActivityTypeConfig {
  icon: React.ReactNode;
  label: string;
  colorDot: string;
  colorIcon: string;
  colorBg: string;
}

const ACTIVITY_CONFIG: Record<string, ActivityTypeConfig> = {
  create: {
    icon: <PlusCircle className="h-4 w-4" />,
    label: 'Lead Created',
    colorDot: 'bg-blue-500',
    colorIcon: 'text-blue-400',
    colorBg: 'bg-blue-500/15 border-blue-500/30',
  },
  update: {
    icon: <Edit className="h-4 w-4" />,
    label: 'Lead Updated',
    colorDot: 'bg-blue-400',
    colorIcon: 'text-blue-300',
    colorBg: 'bg-blue-400/15 border-blue-400/30',
  },
  stage_change: {
    icon: <ArrowRightLeft className="h-4 w-4" />,
    label: 'Stage Changed',
    colorDot: 'bg-purple-500',
    colorIcon: 'text-purple-400',
    colorBg: 'bg-purple-500/15 border-purple-500/30',
  },
  call: {
    icon: <Phone className="h-4 w-4" />,
    label: 'Call Completed',
    colorDot: 'bg-green-500',
    colorIcon: 'text-green-400',
    colorBg: 'bg-green-500/15 border-green-500/30',
  },
  call_not_attended: {
    icon: <PhoneOff className="h-4 w-4" />,
    label: 'Call Not Attended',
    colorDot: 'bg-yellow-500',
    colorIcon: 'text-yellow-400',
    colorBg: 'bg-yellow-500/15 border-yellow-500/30',
  },
  note: {
    icon: <FileText className="h-4 w-4" />,
    label: 'Notes Added',
    colorDot: 'bg-blue-400',
    colorIcon: 'text-blue-300',
    colorBg: 'bg-blue-400/15 border-blue-400/30',
  },
  follow_up: {
    icon: <Calendar className="h-4 w-4" />,
    label: 'Follow-up Scheduled',
    colorDot: 'bg-orange-500',
    colorIcon: 'text-orange-400',
    colorBg: 'bg-orange-500/15 border-orange-500/30',
  },
  follow_up_update: {
    icon: <Calendar className="h-4 w-4" />,
    label: 'Reminder Updated',
    colorDot: 'bg-orange-400',
    colorIcon: 'text-orange-300',
    colorBg: 'bg-orange-400/15 border-orange-400/30',
  },
  follow_up_complete: {
    icon: <CalendarCheck className="h-4 w-4" />,
    label: 'Reminder Completed',
    colorDot: 'bg-emerald-500',
    colorIcon: 'text-emerald-400',
    colorBg: 'bg-emerald-500/15 border-emerald-500/30',
  },
  whatsapp: {
    icon: <MessageCircle className="h-4 w-4" />,
    label: 'WhatsApp Opened',
    colorDot: 'bg-emerald-400',
    colorIcon: 'text-emerald-300',
    colorBg: 'bg-emerald-400/15 border-emerald-400/30',
  },
  email: {
    icon: <Mail className="h-4 w-4" />,
    label: 'Email Sent',
    colorDot: 'bg-sky-500',
    colorIcon: 'text-sky-400',
    colorBg: 'bg-sky-500/15 border-sky-500/30',
  },
  proposal: {
    icon: <Send className="h-4 w-4" />,
    label: 'Proposal Sent',
    colorDot: 'bg-cyan-500',
    colorIcon: 'text-cyan-400',
    colorBg: 'bg-cyan-500/15 border-cyan-500/30',
  },
  won: {
    icon: <Trophy className="h-4 w-4" />,
    label: 'Lead Won',
    colorDot: 'bg-emerald-500',
    colorIcon: 'text-emerald-400',
    colorBg: 'bg-emerald-500/15 border-emerald-500/30',
  },
  lost: {
    icon: <XCircle className="h-4 w-4" />,
    label: 'Lead Lost',
    colorDot: 'bg-red-500',
    colorIcon: 'text-red-400',
    colorBg: 'bg-red-500/15 border-red-500/30',
  },
  wrong_lead: {
    icon: <AlertTriangle className="h-4 w-4" />,
    label: 'Wrong Lead',
    colorDot: 'bg-gray-500',
    colorIcon: 'text-gray-400',
    colorBg: 'bg-gray-500/15 border-gray-500/30',
  },
  no_need: {
    icon: <Minus className="h-4 w-4" />,
    label: 'No Need',
    colorDot: 'bg-slate-500',
    colorIcon: 'text-slate-400',
    colorBg: 'bg-slate-500/15 border-slate-500/30',
  },
  delete: {
    icon: <XCircle className="h-4 w-4" />,
    label: 'Deleted',
    colorDot: 'bg-red-600',
    colorIcon: 'text-red-500',
    colorBg: 'bg-red-600/15 border-red-500/30',
  },
};

const DEFAULT_CONFIG: ActivityTypeConfig = {
  icon: <Clock className="h-4 w-4" />,
  label: 'Activity',
  colorDot: 'bg-slate-500',
  colorIcon: 'text-slate-400',
  colorBg: 'bg-slate-500/15 border-slate-500/30',
};

/* ─────────────────────────────────────────── */
/* Stage Badge Config                         */
/* ─────────────────────────────────────────── */

const STAGE_BADGE: Record<string, { label: string; color: string }> = {
  NEW: { label: 'New', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' },
  CONTACTED: { label: 'F1 (Connected)', color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
  CALL_NOT_ATTENDED: { label: 'Call Not Attended', color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' },
  FOLLOW_UP: { label: 'F2 (Follow Up)', color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
  QUALIFIED: { label: 'F3 (Follow Up)', color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400' },
  NEGOTIATION: { label: 'Proposal', color: 'border-purple-500/40 bg-purple-500/10 text-purple-400' },
  WON: { label: 'Won', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  LOST: { label: 'Lost', color: 'border-red-500/40 bg-red-500/10 text-red-400' },
  BOOKED: { label: 'Booked', color: 'border-rose-500/40 bg-rose-500/10 text-rose-400' },
  NO_NEED: { label: 'No Need', color: 'border-slate-500/40 bg-slate-500/10 text-slate-400' },
  WRONG_LEAD: { label: 'Wrong Lead', color: 'border-orange-500/40 bg-orange-500/10 text-orange-400' },
};

/* ─────────────────────────────────────────── */
/* Helper Functions                            */
/* ─────────────────────────────────────────── */

const cleanText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getActivityConfig = (action: string): ActivityTypeConfig => {
  return ACTIVITY_CONFIG[action] || DEFAULT_CONFIG;
};

const getActivityDescription = (activity: ActivityLog, indexFromBottom?: number): string | null => {
  if (activity.action === 'stage_change' && activity.oldValue && activity.newValue) {
    const oldLabel = STAGE_BADGE[activity.oldValue]?.label || activity.oldValue;
    const newLabel = STAGE_BADGE[activity.newValue]?.label || activity.newValue;
    return `${oldLabel} → ${newLabel}`;
  }
  if (activity.action === 'note' && activity.newValue) {
    return activity.newValue;
  }
  if (activity.newValue && activity.action !== 'stage_change') {
    return activity.newValue;
  }
  return null;
};

/* ─────────────────────────────────────────── */
/* Component                                   */
/* ─────────────────────────────────────────── */

interface ActivityTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export const ActivityTimelineModal: React.FC<ActivityTimelineModalProps> = ({
  isOpen,
  onClose,
  lead,
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!lead) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/v1/leads/${lead.id}/activities`, {
        params: { page: pageNum, limit: 50 },
      });
      const newActivities = res.data.data || [];
      const meta = res.data.meta || {};

      if (append) {
        setActivities((prev) => [...prev, ...newActivities]);
      } else {
        setActivities(newActivities);
      }

      setTotalPages(meta.totalPages || 1);
      setTotal(meta.total || 0);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load activities.');
    } finally {
      setLoading(false);
    }
  }, [lead]);

  // Fetch on open
  useEffect(() => {
    if (isOpen && lead) {
      setActivities([]);
      setPage(1);
      fetchActivities(1, false);
    }
  }, [isOpen, lead, fetchActivities]);

  if (!isOpen || !lead) return null;

  const stageBadge = STAGE_BADGE[lead.stage] || { label: lead.stage, color: 'border-slate-700 bg-slate-800 text-slate-300' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg max-h-[85vh] rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">

        {/* ── Sticky Header ── */}
        <div className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800/80 px-5 py-4 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 mb-1">Lead Activity Timeline</p>
            <h3 className="text-base font-bold text-white leading-tight truncate">{cleanText(lead.name)}</h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {lead.phone && (
                <span className="text-xs text-slate-400 font-mono">{cleanText(lead.phone)}</span>
              )}
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${stageBadge.color}`}>
                {stageBadge.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1.5 rounded-xl hover:bg-slate-900 transition-colors shrink-0 cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Scrollable Timeline Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">

          {/* Loading State */}
          {loading && activities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-7 w-7 text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-500">Loading activity timeline...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 text-center">
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && activities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                <Clock className="h-7 w-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-400">No Activity Yet</h4>
              <p className="text-xs text-slate-500 max-w-[240px]">This lead has no recorded activity.</p>
            </div>
          )}

          {/* Timeline Items */}
          {activities.length > 0 && (
            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-slate-700 via-slate-800 to-transparent" />

              <div className="space-y-0">
                {activities.map((activity, index) => {
                  const config = getActivityConfig(activity.action);
                  const description = getActivityDescription(activity);
                  const userEmail = activity.user?.email || 'System';
                  const isLast = index === activities.length - 1;

                  return (
                    <div key={activity.id} className="relative flex gap-3.5 group">
                      {/* Timeline Dot */}
                      <div className="relative z-[1] flex flex-col items-center shrink-0">
                        <div className={`h-[30px] w-[30px] rounded-full border flex items-center justify-center ${config.colorBg} ${config.colorIcon}`}>
                          {config.icon}
                        </div>
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pb-5 ${isLast ? '' : 'border-b border-slate-800/40'} mb-1`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-200 leading-tight">
                              {config.label}
                            </p>
                            {description && (
                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed whitespace-pre-wrap break-words">
                                {description}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                              {userEmail}
                            </p>
                          </div>

                          {/* Date & Time */}
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-semibold text-slate-400">
                              {formatDate(activity.createdAt)}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {formatTime(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {page < totalPages && (
                <div className="flex justify-center pt-3">
                  <button
                    onClick={() => fetchActivities(page + 1, true)}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>Load More ({total - activities.length} remaining)</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sticky Footer ── */}
        <div className="sticky bottom-0 bg-slate-950 border-t border-slate-800/80 px-5 py-3 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500 font-medium">
            {total > 0 ? `${activities.length} of ${total} activities` : 'Read-only view'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
