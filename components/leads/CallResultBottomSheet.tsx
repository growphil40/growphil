'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, PhoneCall, Calendar, ArrowLeft, Clock, FileText, Paperclip, AlertCircle, PhoneOff } from 'lucide-react';
import { api } from '../../lib/api';
import { Lead, LeadStage } from '../../types';

export interface CallStageRule {
  stage: LeadStage | 'CALL_NOT_ATTENDED';
  label: string;
  badgeColor: string;
  requiresStep2: boolean;
  requiresFollowUpDateTime: boolean;
  requiresNotes: boolean;
  keepStage?: boolean;
}

export const CALL_STAGE_RULES: CallStageRule[] = [
  { stage: 'CONTACTED', label: 'Connected', badgeColor: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400', requiresStep2: true, requiresFollowUpDateTime: true, requiresNotes: true, keepStage: true },
  { stage: 'CALL_NOT_ATTENDED', label: 'Call Not Attended', badgeColor: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400', requiresStep2: true, requiresFollowUpDateTime: true, requiresNotes: false, keepStage: true },
  { stage: 'NEGOTIATION', label: 'Proposal Sent', badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-400', requiresStep2: true, requiresFollowUpDateTime: true, requiresNotes: true },
  { stage: 'BOOKED', label: 'Booked', badgeColor: 'border-rose-500/40 bg-rose-500/10 text-rose-400', requiresStep2: true, requiresFollowUpDateTime: false, requiresNotes: true },
  { stage: 'WON', label: 'Won', badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400', requiresStep2: true, requiresFollowUpDateTime: false, requiresNotes: true },
  { stage: 'NO_NEED', label: 'No Need', badgeColor: 'border-slate-500/40 bg-slate-500/10 text-slate-400', requiresStep2: true, requiresFollowUpDateTime: false, requiresNotes: true },
  { stage: 'WRONG_LEAD', label: 'Wrong Lead', badgeColor: 'border-orange-500/40 bg-orange-500/10 text-orange-400', requiresStep2: true, requiresFollowUpDateTime: false, requiresNotes: true },
];

interface CallResultBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onCompleteWorkflow: (leadId: string, newStage: LeadStage, newFollowUp?: any, noteText?: string, isCna?: boolean) => void;
}

export const CallResultBottomSheet: React.FC<CallResultBottomSheetProps> = ({
  isOpen,
  onClose,
  lead,
  onCompleteWorkflow,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRule, setSelectedRule] = useState<CallStageRule | null>(null);

  // Step 2 Form States
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset internal states when opened with a new lead
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedRule(null);
      setNotes('');
      setFollowUpDate('');
      setFollowUpTime('');
      setValidationError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  // Handle Stage Selection in Step 1
  const handleSelectStage = async (rule: CallStageRule) => {
    setSelectedRule(rule);
    setValidationError(null);

    if (!rule.requiresStep2) {
      try {
        setIsSubmitting(true);
        const targetStage = rule.keepStage ? lead.stage : (rule.stage as LeadStage);
        if (!rule.keepStage) {
          await api.patch(`/v1/leads/${lead.id}/stage`, { stage: targetStage });
        }
        onCompleteWorkflow(lead.id, targetStage, undefined, undefined, rule.keepStage);
        onClose();
      } catch (err: any) {
        alert(err.response?.data?.error?.message || 'Failed to update lead stage.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Transition smoothly to Step 2
      setStep(2);
    }
  };

  // Handle Step 2 Submission & Validation
  const handleSaveStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRule) return;

    setValidationError(null);

    // 1. Validation checks
    if (selectedRule.requiresNotes && !notes.trim()) {
      setValidationError('Notes are required.');
      return;
    }

    if (selectedRule.requiresFollowUpDateTime) {
      if (!followUpDate) {
        setValidationError('Please select the next follow-up date.');
        return;
      }
      if (!followUpTime) {
        setValidationError('Please select the follow-up time.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const isCna = selectedRule.stage === 'CALL_NOT_ATTENDED';
      const targetStage = selectedRule.keepStage ? lead.stage : (selectedRule.stage as LeadStage);

      // 1. Update Lead Stage (if stage changes)
      if (!selectedRule.keepStage) {
        await api.patch(`/v1/leads/${lead.id}/stage`, { stage: targetStage });
      }

      // 2. Save Notes / CNA Activity Log
      const noteContent = isCna
        ? `Call Not Attended${notes.trim() ? `: ${notes.trim()}` : ''}`
        : notes.trim();

      if (noteContent) {
        await api.post(`/v1/leads/${lead.id}/notes`, { note: noteContent });
      }

      // 3. Save Follow-up Date & Time if scheduled
      let createdFollowUp = null;
      if (selectedRule.requiresFollowUpDateTime && followUpDate && followUpTime) {
        const scheduledAtISO = new Date(`${followUpDate}T${followUpTime}`).toISOString();
        const fuRes = await api.post(`/v1/leads/${lead.id}/follow-ups`, {
          scheduledAt: scheduledAtISO,
          note: noteContent || undefined,
        });
        createdFollowUp = fuRes.data.data;
      }

      // 4. Trigger completion callback in parent
      onCompleteWorkflow(lead.id, targetStage, createdFollowUp, noteContent, isCna);

      onClose();
    } catch (err: any) {
      setValidationError(err.response?.data?.error?.message || 'Failed to save workflow details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">

        {/* ───────────────────────────────────────────────────────────── */}
        {/* STEP 1: Select Call Result */}
        {/* ───────────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Step 1 of 2</p>
                  <h3 className="text-base font-bold text-white leading-tight">Call Completed</h3>
                  <p className="text-xs text-slate-400">{lead.name} • {lead.phone || 'No phone'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Call Results Options List */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Call Result
              </label>
              <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                {CALL_STAGE_RULES.map((rule) => (
                  <button
                    key={rule.stage}
                    disabled={isSubmitting}
                    onClick={() => handleSelectStage(rule)}
                    className="p-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 text-left text-xs font-semibold text-slate-200 transition-all cursor-pointer flex items-center justify-between active:scale-98"
                  >
                    <span className="truncate">{rule.label}</span>
                    {rule.stage === 'CALL_NOT_ATTENDED' ? (
                      <PhoneOff className="h-3.5 w-3.5 text-amber-400 shrink-0 ml-1" />
                    ) : rule.requiresStep2 ? (
                      <Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0 ml-1" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* STEP 2: Lead Notes & Follow-up Scheduler */}
        {/* ───────────────────────────────────────────────────────────── */}
        {step === 2 && selectedRule && (
          <form onSubmit={handleSaveStep2} className="space-y-4 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Back to Step 1"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">Step 2 of 2</p>
                    <span className={`text-[9px] font-extrabold px-2 py-0.2 rounded-full border uppercase ${selectedRule.badgeColor}`}>
                      {selectedRule.label}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {selectedRule.stage === 'CALL_NOT_ATTENDED' ? 'Schedule Next Call' : 'Lead Notes & Follow-up'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Validation Error Alert */}
            {validationError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Field 1: Notes Multiline Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Notes {selectedRule.requiresNotes ? <span className="text-rose-400">*</span> : <span className="text-slate-500 font-normal">(Optional)</span>}
              </label>
              <textarea
                required={selectedRule.requiresNotes}
                rows={3}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder={selectedRule.stage === 'CALL_NOT_ATTENDED' ? 'e.g. Call went to voicemail. Customer did not pick up.' : `Example:\nCustomer requested a callback tomorrow after 4 PM.\nInterested in Gold Package.\nRequested quotation on WhatsApp.`}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-sans"
              />
            </div>

            {/* Field 2 & 3: Next Follow-up Date & Time */}
            {selectedRule.requiresFollowUpDateTime && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Next Call Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={followUpDate}
                    onChange={(e) => {
                      setFollowUpDate(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Next Call Time <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={followUpTime}
                    onChange={(e) => {
                      setFollowUpTime(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Field 4: Attachment (Optional Placeholder) */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                Attachment (Optional - Future Support)
              </label>
              <div className="p-3 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-slate-500 text-[11px] flex items-center justify-center gap-2">
                <span>Drag or select file to attach</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-2xl border border-slate-800 bg-slate-900 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl border border-indigo-400/30 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Save Workflow</span>
                    <CheckCircle className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
