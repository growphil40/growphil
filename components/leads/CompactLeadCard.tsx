'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Phone, MessageCircle, ArrowRight, Bell, Calendar, MapPin, Tag, Clock, History, PhoneCall, Edit3 } from 'lucide-react';
import { FiPhoneCall } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { Lead, LeadStage } from '../../types';

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
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

const cleanText = (text: string | null | undefined): string => {
  if (!text) return '';
  let cleaned = text.replace(/<[^>]*>/g, '');
  cleaned = cleaned.replace(/[<>]/g, '');
  return cleaned;
};

const formatReminderText = (scheduledAt?: string | null): { text: string; isOverdue: boolean } => {
  if (!scheduledAt) return { text: 'No Reminder', isOverdue: false };
  const target = new Date(scheduledAt);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs < 0) {
    return { text: 'Overdue', isOverdue: true };
  }

  const isToday = target.toDateString() === now.toDateString();
  const timeStr = target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return { text: `Today ${timeStr}`, isOverdue: false };
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (target.toDateString() === tomorrow.toDateString()) {
    return { text: `Tomorrow ${timeStr}`, isOverdue: false };
  }

  return { text: `${target.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`, isOverdue: false };
};

interface CompactLeadCardProps {
  lead: Lead;
  onCallClick: (lead: Lead) => void;
  onOpenReminder: (lead: Lead) => void;
  onOpenCallResult?: (lead: Lead) => void;
  onViewActivity?: (lead: Lead) => void;
  onStageChange?: (leadId: string, stage: LeadStage) => void;
  isNew?: boolean;
  isSelected?: boolean;
  onSelect?: (leadId: string) => void;
}

export const CompactLeadCard: React.FC<CompactLeadCardProps> = ({
  lead,
  onCallClick,
  onOpenReminder,
  onOpenCallResult,
  onViewActivity,
  onStageChange,
  isNew = false,
  isSelected = false,
  onSelect,
}) => {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const stageInfo = STAGE_CONFIG[lead.stage] || { label: lead.stage, color: 'border-slate-700 bg-slate-800 text-slate-300' };
  const reminderInfo = formatReminderText(lead.nextFollowUp?.scheduledAt);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    if (diff > -100 && diff < 100) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset < -40) {
      onCallClick(lead);
    } else if (swipeOffset > 40) {
      onOpenReminder(lead);
    }
    setSwipeOffset(0);
    setTouchStartX(null);
  };

  const attemptsCount = lead.callAttempts !== undefined ? lead.callAttempts : 0;
  const lastResultText = lead.lastCallResult || (attemptsCount > 0 ? 'Call Not Attended' : null);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateX(${swipeOffset}px)` }}
      className={`p-3.5 rounded-2xl border transition-all duration-200 relative bg-slate-900/60 hover:bg-slate-900/90 active:scale-[0.99] shadow-sm space-y-2.5 ${
        isNew
          ? 'animate-lead-arrive border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
          : isSelected
          ? 'border-indigo-500/60 bg-indigo-950/20'
          : 'border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Row 1: Name + Interactive Stage Badge + Reminder Bell + History */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link
            href={`/client/leads/${lead.id}`}
            className="text-sm font-bold text-white hover:text-indigo-400 transition-colors truncate leading-tight"
          >
            {cleanText(lead.name)}
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenReminder(lead);
            }}
            className="text-slate-500 hover:text-amber-400 p-0.5 rounded transition-colors cursor-pointer shrink-0"
            title="Schedule Reminder"
          >
            <Bell className="h-3.5 w-3.5" />
          </button>
          {onViewActivity && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewActivity(lead);
              }}
              className="text-slate-500 hover:text-indigo-400 p-0.5 rounded transition-colors cursor-pointer shrink-0"
              title="View Activity"
            >
              <History className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Current Stage Badge (Clickable for Manual Trigger) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenCallResult) onOpenCallResult(lead);
          }}
          className={`shrink-0 text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1 ${stageInfo.color}`}
          title="Click to manually log call result / update stage"
        >
          <span>{stageInfo.label}</span>
          <Edit3 className="h-2.5 w-2.5 opacity-70" />
        </button>
      </div>

      {/* Row 2: Phone + Source & City + Reminder Status */}
      <div className="flex items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2 min-w-0 truncate">
          <span className="font-semibold text-slate-200 truncate">
            {lead.phone ? cleanText(lead.phone) : 'No Phone'}
          </span>
          {lead.city && (
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {cleanText(lead.city)}
            </span>
          )}
          {lead.source && (
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300 shrink-0">
              {lead.source.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Reminder Status Badge */}
        {lead.nextFollowUp?.scheduledAt && (
          <span
            className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              reminderInfo.isOverdue
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400 animate-pulse'
                : 'bg-indigo-500/15 border border-indigo-500/20 text-indigo-300'
            }`}
          >
            <Clock className="h-2.5 w-2.5" />
            {reminderInfo.text}
          </span>
        )}
      </div>

      {/* Row 3: Call Attempt Counter & Last Result Badge */}
      {(attemptsCount > 0 || lastResultText) && (
        <div className="flex items-center justify-between text-[10px] bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-800/80">
          <span className="flex items-center gap-1.5 text-slate-400">
            <PhoneCall className="h-3 w-3 text-amber-400" />
            <span>Call Attempts:</span>
            <span className="font-extrabold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded">
              {attemptsCount}
            </span>
          </span>

          {lastResultText && (
            <span className="flex items-center gap-1 text-slate-400 truncate max-w-[160px]">
              <span className="text-slate-500">Last:</span>
              <span className="font-semibold text-slate-300 truncate">
                {lastResultText}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Row 4: Action Buttons (Call, WhatsApp, View) */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">

        {/* 2. Call Button (Compact) */}
        <button
          onClick={() => onCallClick(lead)}
          disabled={!lead.phone}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            lead.phone
              ? 'bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border-indigo-500/30 active:scale-95'
              : 'bg-slate-900 text-slate-600 border-slate-900 cursor-not-allowed opacity-50'
          }`}
          title="Call Lead"
        >
          <FiPhoneCall className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Call</span>
        </button>

        {/* 3. WhatsApp Button (Compact) */}
        <a
          href={lead.phone ? `https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}` : '#'}
          target={lead.phone ? '_blank' : undefined}
          rel={lead.phone ? 'noopener noreferrer' : undefined}
          onClick={(e) => !lead.phone && e.preventDefault()}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            lead.phone
              ? 'bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border-emerald-500/30 active:scale-95'
              : 'bg-slate-900 text-slate-600 border-slate-900 cursor-not-allowed opacity-50'
          }`}
          title="WhatsApp Message"
        >
          <FaWhatsapp className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>

        {/* 4. View Details Link */}
        <Link
          href={`/client/leads/${lead.id}`}
          className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
        >
          <span>View</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};
