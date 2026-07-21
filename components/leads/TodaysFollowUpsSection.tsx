'use client';

import React from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Lead } from '../../types';

interface TodaysFollowUpsSectionProps {
  leads: Lead[];
  onSelectFilter: (filterType: string) => void;
  activeFilter?: string;
}

export const TodaysFollowUpsSection: React.FC<TodaysFollowUpsSectionProps> = ({
  leads,
  onSelectFilter,
  activeFilter,
}) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Compute metrics
  let dueTodayCount = 0;
  let overdueCount = 0;
  let upcomingCount = 0;

  leads.forEach((lead) => {
    if (lead.nextFollowUp && lead.nextFollowUp.status === 'pending' && lead.nextFollowUp.scheduledAt) {
      const scheduled = new Date(lead.nextFollowUp.scheduledAt);
      if (scheduled < startOfToday) {
        overdueCount++;
      } else if (scheduled >= startOfToday && scheduled <= endOfToday) {
        dueTodayCount++;
      } else if (scheduled > endOfToday) {
        upcomingCount++;
      }
    }
  });

  const totalFollowUps = dueTodayCount + overdueCount + upcomingCount;

  if (totalFollowUps === 0) return null;

  return (
    <div className="px-4 pt-3 pb-1 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-amber-400" />
          Today's Action Focus
        </h3>
        <span className="text-[10px] text-slate-500 font-semibold">
          {dueTodayCount + overdueCount} Urgent Calls
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Due Today */}
        <button
          onClick={() => onSelectFilter('TODAY_DUE')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden active:scale-95 ${
            activeFilter === 'TODAY_DUE'
              ? 'border-amber-500/60 bg-amber-500/15 shadow-md shadow-amber-500/10'
              : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-base font-black tracking-tight">{dueTodayCount}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-300 truncate">Due Today</p>
          <p className="text-[9px] text-slate-500 truncate">Scheduled today</p>
        </button>

        {/* Overdue */}
        <button
          onClick={() => onSelectFilter('OVERDUE')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden active:scale-95 ${
            activeFilter === 'OVERDUE'
              ? 'border-rose-500/60 bg-rose-500/15 shadow-md shadow-rose-500/10'
              : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-base font-black tracking-tight">{overdueCount}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-300 truncate">Overdue</p>
          <p className="text-[9px] text-slate-500 truncate">Missed call time</p>
        </button>

        {/* Upcoming */}
        <button
          onClick={() => onSelectFilter('UPCOMING')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden active:scale-95 ${
            activeFilter === 'UPCOMING'
              ? 'border-indigo-500/60 bg-indigo-500/15 shadow-md shadow-indigo-500/10'
              : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-400 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-base font-black tracking-tight">{upcomingCount}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-300 truncate">Upcoming</p>
          <p className="text-[9px] text-slate-500 truncate">Future calls</p>
        </button>
      </div>
    </div>
  );
};
