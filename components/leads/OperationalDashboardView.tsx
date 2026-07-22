'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, RotateCw, Calendar, PhoneCall, AlertCircle, CheckCircle2, FileText, TrendingUp, Users, PhoneOff, BarChart2, Clock } from 'lucide-react';
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

  // Calculate new 10-Stage counts
  const stageCounts = {
    NEW: leads.filter(l => l.stage === 'NEW').length,
    CONTACTED: leads.filter(l => l.stage === 'CONTACTED').length,
    NEGOTIATION: leads.filter(l => l.stage === 'NEGOTIATION').length,
    FOLLOW_UP: leads.filter(l => l.stage === 'FOLLOW_UP').length,
    QUALIFIED: leads.filter(l => l.stage === 'QUALIFIED').length,
    LOST: leads.filter(l => l.stage === 'LOST').length,
    BOOKED: leads.filter(l => l.stage === 'BOOKED').length,
    WON: leads.filter(l => l.stage === 'WON').length,
    NO_NEED: leads.filter(l => l.stage === 'NO_NEED').length,
    WRONG_LEAD: leads.filter(l => l.stage === 'WRONG_LEAD').length,
  };

  // 1. Auto Moved Today
  const autoMovedToday = leads.filter(l => {
    if (!l.customFields?.autoMovedAt) return false;
    const date = new Date(l.customFields.autoMovedAt);
    return date >= startOfToday && date <= endOfToday;
  }).length;

  // 2. Pending Auto Moves
  const pendingAutoMoves = leads.filter(l => 
    ['NEGOTIATION', 'FOLLOW_UP', 'QUALIFIED'].includes(l.stage)
  ).length;

  // 3. Average Proposal Age
  const proposalLeads = leads.filter(l => l.stage === 'NEGOTIATION' && l.proposalSentAt);
  const avgProposalAge = proposalLeads.length > 0
    ? (proposalLeads.reduce((sum, l) => sum + (now.getTime() - new Date(l.proposalSentAt!).getTime()), 0) / proposalLeads.length / (1000 * 60 * 60)).toFixed(1) + ' hrs'
    : '0.0 hrs';

  // 4. Average Follow-up Time
  const leadsWithFollowUp = leads.filter(l => l.nextFollowUp?.scheduledAt);
  const avgFollowUpTime = leadsWithFollowUp.length > 0
    ? (leadsWithFollowUp.reduce((sum, l) => sum + Math.abs(new Date(l.nextFollowUp!.scheduledAt).getTime() - new Date(l.createdAt).getTime()), 0) / leadsWithFollowUp.length / (1000 * 60 * 60 * 24)).toFixed(1) + ' days'
    : '0.0 days';

  // 5. Average Response Time
  const connectedLeads = leads.filter(l => l.customFields?.connectedAt);
  const avgResponseTime = connectedLeads.length > 0
    ? (connectedLeads.reduce((sum, l) => sum + (new Date(l.customFields!.connectedAt).getTime() - new Date(l.createdAt).getTime()), 0) / connectedLeads.length / (1000 * 60)).toFixed(0) + ' mins'
    : '0 mins';

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

      {/* 10-Stage Pipeline Counters */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pipeline Stage Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
          <AppCard className="p-3 bg-slate-900/60 border-slate-800 flex flex-col justify-between items-center text-center" hoverEffect={false}>
            <span className="text-[10px] font-bold text-cyan-400 uppercase font-mono truncate max-w-full">New</span>
            <h4 className="text-xl font-black text-white mt-1">{stageCounts.NEW}</h4>
          </AppCard>

          <AppCard className="p-3 bg-slate-900/60 border-slate-800 flex flex-col justify-between items-center text-center" hoverEffect={false}>
            <span className="text-[10px] font-bold text-amber-400 uppercase font-mono truncate max-w-full">Connected</span>
            <h4 className="text-xl font-black text-white mt-1">{stageCounts.CONTACTED}</h4>
          </AppCard>

          <AppCard className="p-3 bg-slate-900/60 border-slate-800 flex flex-col justify-between items-center text-center" hoverEffect={false}>
            <span className="text-[10px] font-bold text-purple-400 uppercase font-mono truncate max-w-full">Proposal</span>
            <h4 className="text-xl font-black text-white mt-1">{stageCounts.NEGOTIATION}</h4>
          </AppCard>

          <AppCard className="p-3 bg-slate-900/60 border-slate-800 flex flex-col justify-between items-center text-center" hoverEffect={false}>
            <span className="text-[10px] font-bold text-blue-400 uppercase font-mono truncate max-w-full">Follow Up F1</span>
            <h4 className="text-xl font-black text-white mt-1">{stageCounts.FOLLOW_UP}</h4>
          </AppCard>

          <AppCard className="p-3 bg-slate-900/60 border-slate-800 flex flex-col justify-between items-center text-center" hoverEffect={false}>
            <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono truncate max-w-full">Follow Up F2</span>
            <h4 className="text-xl font-black text-white mt-1">{stageCounts.QUALIFIED}</h4>
          </AppCard>

          <AppCard className="p-3 bg-slate-900/60 border-slate-800 flex flex-col justify-between items-center text-center" hoverEffect={false}>
            <span className="text-[10px] font-bold text-rose-400 uppercase font-mono truncate max-w-full">Follow Up F3</span>
            <h4 className="text-xl font-black text-white mt-1">{stageCounts.LOST}</h4>
          </AppCard>

          <AppCard className="p-3 bg-slate-900/60 border-slate-800 flex flex-col justify-between items-center text-center" hoverEffect={false}>
            <span className="text-[10px] font-bold text-pink-400 uppercase font-mono truncate max-w-full">Booked</span>
            <h4 className="text-xl font-black text-white mt-1">{stageCounts.BOOKED}</h4>
          </AppCard>

          <AppCard className="p-3 bg-slate-900/60 border-slate-800 flex flex-col justify-between items-center text-center" hoverEffect={false}>
            <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono truncate max-w-full">Won</span>
            <h4 className="text-xl font-black text-white mt-1">{stageCounts.WON}</h4>
          </AppCard>

          <AppCard className="p-3 bg-slate-900/60 border-slate-800 flex flex-col justify-between items-center text-center" hoverEffect={false}>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono truncate max-w-full">No Need</span>
            <h4 className="text-xl font-black text-white mt-1">{stageCounts.NO_NEED}</h4>
          </AppCard>

          <AppCard className="p-3 bg-slate-900/60 border-slate-800 flex flex-col justify-between items-center text-center" hoverEffect={false}>
            <span className="text-[10px] font-bold text-orange-400 uppercase font-mono truncate max-w-full">Wrong Lead</span>
            <h4 className="text-xl font-black text-white mt-1">{stageCounts.WRONG_LEAD}</h4>
          </AppCard>
        </div>
      </div>

      {/* Intelligent Automation Metrics Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workflow Intelligence</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <AppCard className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between" hoverEffect={false}>
            <div className="text-amber-400 flex items-center justify-between mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-[9px] font-mono font-extrabold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">AUTO</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auto Moved Today</p>
              <h3 className="text-2xl font-black text-white tracking-tight mt-1">{autoMovedToday}</h3>
            </div>
          </AppCard>

          <AppCard className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between" hoverEffect={false}>
            <div className="text-indigo-400 flex items-center justify-between mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-[9px] font-mono font-extrabold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">PENDING</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Auto Moves</p>
              <h3 className="text-2xl font-black text-white tracking-tight mt-1">{pendingAutoMoves}</h3>
            </div>
          </AppCard>

          <AppCard className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between" hoverEffect={false}>
            <div className="text-purple-400 flex items-center justify-between mb-2">
              <FileText className="h-4 w-4" />
              <span className="text-[9px] font-mono font-extrabold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">AGE</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Proposal Age</p>
              <h3 className="text-2xl font-black text-white tracking-tight mt-1">{avgProposalAge}</h3>
            </div>
          </AppCard>

          <AppCard className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between" hoverEffect={false}>
            <div className="text-blue-400 flex items-center justify-between mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-[9px] font-mono font-extrabold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">FOLLOW-UP</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Follow-up Time</p>
              <h3 className="text-2xl font-black text-white tracking-tight mt-1">{avgFollowUpTime}</h3>
            </div>
          </AppCard>

          <AppCard className="p-4 bg-slate-900/60 border-slate-800 flex flex-col justify-between" hoverEffect={false}>
            <div className="text-cyan-400 flex items-center justify-between mb-2">
              <PhoneCall className="h-4 w-4" />
              <span className="text-[9px] font-mono font-extrabold bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">SPEED</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Response Time</p>
              <h3 className="text-2xl font-black text-white tracking-tight mt-1">{avgResponseTime}</h3>
            </div>
          </AppCard>
        </div>
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
