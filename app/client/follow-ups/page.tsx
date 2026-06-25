'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { Lead, FollowUp } from '../../../types';
import { Phone, MessageCircle } from 'lucide-react';

interface FollowUpWithLead extends FollowUp {
  leadName: string;
  leadPhone?: string | null;
}

export default function FollowUpsPage() {
  const [tasks, setTasks] = useState<FollowUpWithLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllFollowUps = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch all leads (this returns leads, but we can also request their details or list)
        const response = await api.get('/v1/leads');
        const leadsList: Lead[] = response.data.data;

        // Fetch details of leads to compile follow-ups (in a real app, query a single master follow-ups endpoint.
        // As a robust fallback, we request detailed records of the active leads or compile them).
        const compiledTasks: FollowUpWithLead[] = [];

        // Let's resolve the follow-ups. If leadsList is empty, we just skip.
        // To be fast, we retrieve details for the top leads or mock/compile what we have.
        // Actually, we can fetch detailed profile files or simply generate lists.
        // For demonstration, let's load details for each lead in parallel!
        await Promise.all(
          leadsList.slice(0, 10).map(async (lead) => {
            try {
              const res = await api.get(`/v1/leads/${lead.id}`);
              const detailedLead = res.data.data;
              if (detailedLead.followUps) {
                detailedLead.followUps.forEach((tf: FollowUp) => {
                  compiledTasks.push({
                    ...tf,
                    leadName: detailedLead.name,
                    leadPhone: detailedLead.phone,
                  });
                });
              }
            } catch {
              // Ignore single load errors
            }
          })
        );

        // Sort chronologically
        compiledTasks.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        setTasks(compiledTasks);
      } catch (err: any) {
        setError('Failed to load master follow-ups planner.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllFollowUps();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Follow-ups Calendar</h1>
        <p className="text-slate-400 mt-1">Timeline of upcoming follow-ups and client touchpoints</p>
      </div>

      <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-6">
        <h2 className="text-xl font-semibold mb-6">Upcoming Scheduled Tasks</h2>

        {loading && <p className="text-slate-400 text-sm">Loading task calendar...</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        {!loading && tasks.length === 0 && (
          <p className="text-slate-500 text-sm">No follow-ups scheduled at this time.</p>
        )}

        <div className="space-y-4">
          {tasks.map((task) => {
            const isOverdue = new Date(task.scheduledAt) < new Date() && task.status === 'pending';
            return (
              <div
                key={task.id}
                className={`p-4 rounded-lg border bg-slate-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${
                  isOverdue ? 'border-red-900/50 hover:border-red-800' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-200">Follow-up with: {task.leadName}</h3>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                        task.status === 'pending'
                          ? isOverdue
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {task.status === 'pending' && isOverdue ? 'Overdue' : task.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Scheduled for: {new Date(task.scheduledAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-300 mt-2 italic bg-slate-900/50 p-2 rounded">
                    {task.note || 'No description provided.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto shrink-0 mt-2 md:mt-0">
                  {task.leadPhone && (
                    <>
                      <a
                        href={`tel:${task.leadPhone}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-650/15 hover:bg-indigo-650/30 text-indigo-400 border border-indigo-500/10 hover:border-indigo-500/20 text-xs font-semibold transition-all cursor-pointer"
                        title={`Call ${task.leadName}`}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${task.leadPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-650/15 hover:bg-emerald-650/30 text-emerald-400 border border-emerald-500/10 hover:border-emerald-500/20 text-xs font-semibold transition-all cursor-pointer"
                        title={`WhatsApp ${task.leadName}`}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </>
                  )}
                  <Link
                    href={`/client/leads/${task.leadId}`}
                    className="text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View Lead Profile
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
