'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, RotateCw, Calendar, PhoneCall, AlertCircle, CheckCircle2, FileText, TrendingUp, Users, PhoneOff, BarChart2 } from 'lucide-react';
import { Lead, User } from '../../types';

interface OperationalDashboardViewProps {
  user: any;
  connected: boolean;
  leads: Lead[];
  notificationLogs: any[];
  loadingLogs: boolean;
  onRefreshLogs: () => void;
}

export const OperationalDashboardView: React.FC<OperationalDashboardViewProps> = ({
  user,
  connected,
  leads,
  notificationLogs,
  loadingLogs,
  onRefreshLogs,
}) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Calculate Operational Metrics
  const todaysLeads = leads.filter(l => new Date(l.createdAt) >= startOfToday && new Date(l.createdAt) <= endOfToday).length;

  let todaysFollowUps = 0;
  let overdueCalls = 0;

  leads.forEach(l => {
    if (l.nextFollowUp && l.nextFollowUp.status === 'pending' && l.nextFollowUp.scheduledAt) {
      const scheduled = new Date(l.nextFollowUp.scheduledAt);
      if (scheduled >= startOfToday && scheduled <= endOfToday) {
        todaysFollowUps++;
      } else if (scheduled < startOfToday) {
        overdueCalls++;
      }
    }
  });

  const proposalPending = leads.filter(l => l.stage === 'NEGOTIATION').length;
  const wonToday = leads.filter(l => l.stage === 'WON' && new Date(l.updatedAt) >= startOfToday).length;
  const lostToday = leads.filter(l => l.stage === 'LOST' && new Date(l.updatedAt) >= startOfToday).length;

  // Call Attempt Analytics & Call Not Attended Stats
  let totalAttemptsSum = 0;
  let leadsWithAttemptsCount = 0;
  let todaysCnaCount = 0;

  leads.forEach(l => {
    const attempts = l.callAttempts || 0;
    if (attempts > 0) {
      totalAttemptsSum += attempts;
      leadsWithAttemptsCount++;
    }
    if (l.lastCallResult === 'Call Not Attended' && new Date(l.updatedAt) >= startOfToday) {
      todaysCnaCount++;
    }
  });

  const avgAttemptsPerLead = leadsWithAttemptsCount > 0 
    ? (totalAttemptsSum / leadsWithAttemptsCount).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Operations Control</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight font-display mt-1">
            Sales Daily Dashboard
          </h1>
          <p className="text-slate-400 text-xs mt-1">Operational metrics, call attempt statistics, and dispatch telemetry</p>
        </div>

        <div className="flex items-center gap-2.5">
          {connected && (
            <span className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Connected
            </span>
          )}
          <Link href="/client/leads">
            <Button size="sm">View Pipeline</Button>
          </Link>
        </div>
      </div>

      {/* Operational Metrics Cards (6-Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Today's Leads */}
        <AppCard className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between" hoverEffect={false}>
          <div className="text-indigo-400 flex items-center justify-between mb-2">
            <Users className="h-4 w-4" />
            <span className="text-xs font-mono font-bold">NEW</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Leads</p>
            <h3 className="text-2xl font-black text-white tracking-tight mt-1">{todaysLeads}</h3>
          </div>
        </AppCard>

        {/* Today's Follow-ups */}
        <AppCard className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between" hoverEffect={false}>
          <div className="text-amber-400 flex items-center justify-between mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-mono font-bold">DUE</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Follow-ups</p>
            <h3 className="text-2xl font-black text-amber-400 tracking-tight mt-1">{todaysFollowUps}</h3>
          </div>
        </AppCard>

        {/* Overdue Calls */}
        <AppCard className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between" hoverEffect={false}>
          <div className="text-rose-400 flex items-center justify-between mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-mono font-bold">ALERT</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue Calls</p>
            <h3 className="text-2xl font-black text-rose-400 tracking-tight mt-1">{overdueCalls}</h3>
          </div>
        </AppCard>

        {/* Today's Call Not Attended */}
        <AppCard className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between" hoverEffect={false}>
          <div className="text-yellow-400 flex items-center justify-between mb-2">
            <PhoneOff className="h-4 w-4" />
            <span className="text-xs font-mono font-bold">CNA</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Call Not Attended</p>
            <h3 className="text-2xl font-black text-yellow-400 tracking-tight mt-1">{todaysCnaCount}</h3>
          </div>
        </AppCard>

        {/* Proposal Pending */}
        <AppCard className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between" hoverEffect={false}>
          <div className="text-purple-400 flex items-center justify-between mb-2">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-mono font-bold">DEALS</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proposal Pending</p>
            <h3 className="text-2xl font-black text-purple-400 tracking-tight mt-1">{proposalPending}</h3>
          </div>
        </AppCard>

        {/* Won Today */}
        <AppCard className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between" hoverEffect={false}>
          <div className="text-emerald-400 flex items-center justify-between mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-mono font-bold">WON</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Won Today</p>
            <h3 className="text-2xl font-black text-emerald-400 tracking-tight mt-1">{wonToday}</h3>
          </div>
        </AppCard>
      </div>

      {/* Call Attempt Analytics Panel */}
      <AppCard className="p-5 border-slate-800 space-y-4" hoverEffect={false}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-amber-400" /> Call Attempt Analytics &amp; Performance
            </h3>
            <p className="text-xs text-slate-400">Call activity frequency and touchpoint metrics per lead</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Total Call Attempts</p>
            <h4 className="text-2xl font-black text-amber-400">{totalAttemptsSum}</h4>
            <p className="text-[10px] text-slate-500">Across {leadsWithAttemptsCount} active leads</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Avg Attempts Per Lead</p>
            <h4 className="text-2xl font-black text-indigo-400">{avgAttemptsPerLead}</h4>
            <p className="text-[10px] text-slate-500">Attempts prior to connection</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Today's Unanswered Calls</p>
            <h4 className="text-2xl font-black text-yellow-400">{todaysCnaCount}</h4>
            <p className="text-[10px] text-slate-500">Scheduled for follow-up retry</p>
          </div>
        </div>
      </AppCard>

      {/* Account Info & Telegram Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Details */}
        <AppCard className="p-5 flex flex-col justify-between" hoverEffect={false}>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Account Credentials</span>
            <h3 className="text-base font-bold text-white mt-1">Session Owner Profile</h3>

            <div className="space-y-3 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-[9px] uppercase font-bold text-slate-400">Owner Email</p>
                <p className="font-semibold text-white mt-0.5 truncate">{user?.email || 'client@growphil.in'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-[9px] uppercase font-bold text-slate-400">Access Role</p>
                <p className="font-semibold text-indigo-400 uppercase tracking-wider text-[10px] mt-0.5">
                  {user?.role ? user.role.replace('_', ' ') : 'CLIENT OWNER'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <p className="text-[9px] uppercase font-bold text-slate-400">Tenant Reference</p>
                <p className="font-mono text-slate-300 text-[10px] mt-0.5 truncate">{user?.clientId || 'default-tenant'}</p>
              </div>
            </div>
          </div>
        </AppCard>

        {/* Telegram Notification Logs Table */}
        <AppCard className="p-5 lg:col-span-2 space-y-4" hoverEffect={false}>
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-400" /> Telegram Alert Logs
              </h3>
              <p className="text-xs text-slate-400">Audit log of automated lead dispatch alerts</p>
            </div>
            <button
              onClick={onRefreshLogs}
              disabled={loadingLogs}
              className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <RotateCw size={12} className={loadingLogs ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-300 min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-extrabold bg-slate-900/60">
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Title / Payload</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {notificationLogs.slice(0, 8).map((log) => (
                    <tr key={log.id} className="border-b border-slate-900/80 hover:bg-slate-900/30">
                      <td className="p-3 text-white font-semibold">{log.recipient}</td>
                      <td className="p-3 max-w-xs truncate" title={log.message}>
                        <span className="font-bold text-white block text-[11px]">{log.title || 'Lead Notification'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{log.message}</span>
                      </td>
                      <td className="p-3">
                        {log.status === 'SENT' ? (
                          <Badge variant="success">Dispatched</Badge>
                        ) : (
                          <Badge variant="warning">Failed</Badge>
                        )}
                      </td>
                      <td className="p-3 text-slate-500">{new Date(log.sentAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                  {notificationLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500 italic">
                        {loadingLogs ? 'Loading notification history...' : 'No notifications dispatched yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  );
};
