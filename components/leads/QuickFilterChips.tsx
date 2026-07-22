'use client';

import React from 'react';
import { LeadStage } from '../../types';

export interface FilterChipOption {
  id: string;
  label: string;
  stageValue: LeadStage | '' | 'TODAY_DUE';
  badgeColor?: string;
}

export const CHIP_OPTIONS: FilterChipOption[] = [
  { id: 'all', label: 'All Leads', stageValue: '' },
  { id: 'new', label: 'New', stageValue: 'NEW', badgeColor: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' },
  { id: 'connected', label: 'Connected', stageValue: 'CONTACTED', badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
  { id: 'proposal', label: 'Proposal', stageValue: 'NEGOTIATION', badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-400' },
  { id: 'f1', label: 'Follow Up (F1)', stageValue: 'FOLLOW_UP', badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
  { id: 'f2', label: 'Follow Up (F2)', stageValue: 'QUALIFIED', badgeColor: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400' },
  { id: 'f3', label: 'Follow Up (F3)', stageValue: 'LOST', badgeColor: 'border-slate-500/40 bg-slate-500/10 text-slate-400' },
  { id: 'booked', label: 'Booked', stageValue: 'BOOKED', badgeColor: 'border-rose-500/40 bg-rose-500/10 text-rose-400' },
  { id: 'won', label: 'Won', stageValue: 'WON', badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  { id: 'noneed', label: 'No Need', stageValue: 'NO_NEED', badgeColor: 'border-slate-500/40 bg-slate-500/10 text-slate-400' },
  { id: 'wrong', label: 'Wrong Lead', stageValue: 'WRONG_LEAD', badgeColor: 'border-orange-500/40 bg-orange-500/10 text-orange-400' },
];

const BLINK_STYLES: Record<string, string> = {
  NEW: 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400 border shadow-[0_0_10px_rgba(6,182,212,0.25)] animate-pulse font-bold',
  CONTACTED: 'bg-amber-950/40 border-amber-500/50 text-amber-400 border shadow-[0_0_10px_rgba(245,158,11,0.25)] animate-pulse font-bold',
  FOLLOW_UP: 'bg-blue-950/40 border-blue-500/50 text-blue-400 border shadow-[0_0_10px_rgba(59,130,246,0.25)] animate-pulse font-bold',
  QUALIFIED: 'bg-indigo-950/40 border-indigo-500/50 text-indigo-400 border shadow-[0_0_10px_rgba(99,102,241,0.25)] animate-pulse font-bold',
  LOST: 'bg-red-950/40 border-red-500/50 text-red-400 border shadow-[0_0_10px_rgba(239,68,68,0.25)] animate-pulse font-bold',
};

interface QuickFilterChipsProps {
  activeStage: string;
  onSelectStage: (stage: string) => void;
  countsByStage?: Record<string, number>;
}

export const QuickFilterChips: React.FC<QuickFilterChipsProps> = ({
  activeStage,
  onSelectStage,
  countsByStage = {},
}) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar scrollbar-none py-1">
      <div className="flex items-center gap-2 min-w-max">
        {CHIP_OPTIONS.map((chip) => {
          const isActive = activeStage === chip.stageValue;
          const count = chip.stageValue !== ''
            ? countsByStage[chip.stageValue] || 0 
            : undefined;

          const shouldBlink = count !== undefined && count > 0 && ['NEW', 'CONTACTED', 'FOLLOW_UP', 'QUALIFIED', 'LOST'].includes(chip.stageValue);
          const blinkClass = shouldBlink ? BLINK_STYLES[chip.stageValue] || '' : '';

          return (
            <button
              key={chip.id}
              onClick={() => onSelectStage(chip.stageValue)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 select-none ${
                isActive
                  ? `bg-indigo-600 text-white border border-indigo-400/40 font-bold ${
                      shouldBlink
                        ? 'animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.55)] border-indigo-300'
                        : 'shadow-md shadow-indigo-600/30'
                    }`
                  : shouldBlink && blinkClass
                    ? blinkClass
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span>{chip.label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
