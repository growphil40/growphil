'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, Bell, Trash2, Phone, MessageCircle, PhoneCall, Clock } from 'lucide-react';
import { Lead, LeadStage } from '../../types';

const STAGES: { value: LeadStage; label: string; dotColor: string }[] = [
  { value: 'NEW', label: 'New', dotColor: 'bg-cyan-400' },
  { value: 'CONTACTED', label: 'F1 (Connected)', dotColor: 'bg-amber-400' },
  { value: 'NEGOTIATION', label: 'Proposal', dotColor: 'bg-purple-400' },
  { value: 'FOLLOW_UP', label: 'F2 (Follow Up)', dotColor: 'bg-blue-400' },
  { value: 'QUALIFIED', label: 'F3 (Follow Up)', dotColor: 'bg-indigo-400' },
  { value: 'BOOKED', label: 'Booked', dotColor: 'bg-rose-400' },
  { value: 'WON', label: 'Won', dotColor: 'bg-emerald-400' },
  { value: 'NO_NEED', label: 'No Need', dotColor: 'bg-slate-400' },
  { value: 'WRONG_LEAD', label: 'Wrong Lead', dotColor: 'bg-orange-400' },
];

const cleanText = (text: string | null | undefined): string => {
  if (!text) return '';
  let cleaned = text.replace(/<[^>]*>/g, '');
  cleaned = cleaned.replace(/[<>]/g, '');
  return cleaned;
};

interface ManagerKanbanViewProps {
  leads: Lead[];
  onUpdateStage: (leadId: string, stage: LeadStage) => void;
  onOpenReminder: (leadId: string, name: string) => void;
  onDeleteLead?: (leadId: string, name: string) => void;
  isSuperAdmin?: boolean;
  selectedLeadIds?: string[];
  onSelectLead?: (leadId: string) => void;
  newLeadIds?: Set<string>;
}

export const ManagerKanbanView: React.FC<ManagerKanbanViewProps> = ({
  leads,
  onUpdateStage,
  onOpenReminder,
  onDeleteLead,
  isSuperAdmin = false,
  selectedLeadIds = [],
  onSelectLead,
  newLeadIds = new Set(),
}) => {
  const [draggedOverStage, setDraggedOverStage] = useState<LeadStage | null>(null);

  // Group leads by stage
  const leadsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.value] = leads.filter((l) => l.stage === stage.value);
    return acc;
  }, {} as Record<LeadStage, Lead[]>);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    setDraggedOverStage(stage);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: LeadStage) => {
    e.preventDefault();
    setDraggedOverStage(null);
    const leadId = e.dataTransfer.getData('text/plain');
    if (!leadId) return;
    onUpdateStage(leadId, targetStage);
  };

  return (
    <div className="hidden md:flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
      {STAGES.map((col) => {
        const stageLeads = leadsByStage[col.value] || [];
        const isDraggingOver = draggedOverStage === col.value;

        return (
          <div
            key={col.value}
            onDragOver={(e) => handleDragOver(e, col.value)}
            onDrop={(e) => handleDrop(e, col.value)}
            className={`flex-1 min-w-[270px] max-w-[310px] rounded-2xl border p-3.5 flex flex-col h-[700px] transition-all ${
              isDraggingOver
                ? 'border-indigo-500/60 bg-indigo-500/10 shadow-xl shadow-indigo-500/5'
                : 'border-slate-900 bg-slate-950/40'
            }`}
          >
            {/* Column Sticky Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-900 sticky top-0 bg-slate-950/90 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`}></span>
                <span className="font-bold text-slate-200 text-xs tracking-tight">{col.label}</span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                {stageLeads.length}
              </span>
            </div>

            {/* Lead Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent">
              {stageLeads.map((lead) => {
                const isNewlyArrived = newLeadIds.has(lead.id);
                const isSelected = selectedLeadIds.includes(lead.id);
                const attemptsCount = lead.callAttempts !== undefined ? lead.callAttempts : 0;

                return (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className={`p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing space-y-2 hover:shadow-lg hover:shadow-black/30 ${
                      isNewlyArrived
                        ? 'animate-lead-arrive border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                        : isSelected
                        ? 'border-indigo-500/50 bg-indigo-950/30'
                        : 'border-slate-800/80 bg-slate-900/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-slate-200 text-xs hover:underline truncate flex-1">
                        <Link href={`/client/leads/${lead.id}`}>{cleanText(lead.name)}</Link>
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onOpenReminder(lead.id, lead.name)}
                          className="text-slate-500 hover:text-amber-400 p-0.5 rounded hover:bg-amber-500/10 transition-colors cursor-pointer"
                          title="Set Reminder"
                        >
                          <Bell className="h-3.5 w-3.5" />
                        </button>
                        {isSuperAdmin && onDeleteLead && (
                          <>
                            {onSelectLead && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onSelectLead(lead.id)}
                                className="rounded border-slate-800 bg-slate-950 text-indigo-600 h-3.5 w-3.5 cursor-pointer"
                              />
                            )}
                            <button
                              onClick={() => onDeleteLead(lead.id, lead.name)}
                              className="text-slate-500 hover:text-red-400 p-0.5 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Delete Lead"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1">
                      {lead.phone && (
                        <div className="flex items-center justify-between">
                          <span className="truncate">{cleanText(lead.phone)}</span>
                          <div className="flex gap-1 shrink-0">
                            <a
                              href={`tel:${lead.phone}`}
                              className="p-1 rounded bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-400 transition-colors cursor-pointer"
                              title="Call"
                            >
                              <Phone className="h-3 w-3" />
                            </a>
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-400 transition-colors cursor-pointer"
                              title="WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Call Attempts & Last Result Meta */}
                      {attemptsCount > 0 && (
                        <div className="flex items-center justify-between text-[10px] bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800/80 mt-1">
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <PhoneCall className="h-2.5 w-2.5" />
                            <span>Attempts: {attemptsCount}</span>
                          </span>
                          {lead.lastCallResult && (
                            <span className="text-slate-400 truncate max-w-[110px]">
                              {lead.lastCallResult}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[9px] text-slate-500">
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                      <Link href={`/client/leads/${lead.id}`} className="text-emerald-400 hover:text-emerald-300 font-bold">
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}

              {stageLeads.length === 0 && (
                <div className="flex flex-col items-center justify-center h-28 border border-dashed border-slate-900 rounded-xl text-slate-600 text-[10px]">
                  <Layers className="h-4 w-4 mb-1 opacity-30" />
                  Drag leads here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
