'use client';

import React, { useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import { Lead, LeadStage } from '../../types';

interface ReminderSchedulerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  targetStage?: LeadStage | null;
  onReminderSaved: (leadId: string, followUp: any) => void;
}

export const ReminderSchedulerDrawer: React.FC<ReminderSchedulerDrawerProps> = ({
  isOpen,
  onClose,
  lead,
  targetStage,
  onReminderSaved,
}) => {
  const [scheduledAt, setScheduledAt] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) return;

    try {
      setIsSubmitting(true);

      // 1. If target stage provided, update stage first
      if (targetStage) {
        await api.patch(`/v1/leads/${lead.id}/stage`, { stage: targetStage });
      }

      // 2. Post follow-up reminder
      const res = await api.post(`/v1/leads/${lead.id}/follow-ups`, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        note: note || undefined,
      });

      const newFollowUp = res.data.data;
      onReminderSaved(lead.id, newFollowUp);

      setScheduledAt('');
      setNote('');
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to schedule reminder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Schedule Reminder: ${lead.name}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-3">
          <Calendar className="h-5 w-5 text-indigo-400 shrink-0" />
          <div>
            <p className="font-bold text-white">Automated Follow-up Workflow</p>
            <p className="text-[11px] text-indigo-300/80">
              Set date & time to receive Telegram alerts and card countdowns.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Reminder Date & Time
          </label>
          <input
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Notes / Instructions
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Discuss revised proposal & closing terms..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white focus:outline-none focus:border-indigo-500 h-28 resize-none"
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
          >
            Save Reminder
          </Button>
        </div>
      </form>
    </Drawer>
  );
};
