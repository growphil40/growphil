'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Client, Lead, LeadStage, FollowUp } from '../../../../types';
import { Button } from '@/components/ui/button';
import { AppCard, MetricCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Layers, 
  Calendar, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Inbox,
  Clock,
  ExternalLink
} from 'lucide-react';

const STAGES: { value: LeadStage; label: string; color: string; dotColor: string }[] = [
  { value: 'NEW', label: 'New', color: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400', dotColor: 'bg-cyan-400' },
  { value: 'CONTACTED', label: 'Contacted', color: 'border-amber-500/20 bg-amber-500/5 text-amber-400', dotColor: 'bg-amber-400' },
  { value: 'QUALIFIED', label: 'Qualified', color: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400', dotColor: 'bg-indigo-400' },
  { value: 'NEGOTIATION', label: 'Proposal', color: 'border-purple-500/20 bg-purple-500/5 text-purple-400', dotColor: 'bg-purple-400' },
  { value: 'WON', label: 'Won', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400', dotColor: 'bg-emerald-400' },
  { value: 'LOST', label: 'Lost', color: 'border-red-500/20 bg-red-500/5 text-red-400', dotColor: 'bg-red-400' },
  { value: 'BOOKED', label: 'Booked', color: 'border-rose-500/20 bg-rose-500/5 text-rose-400', dotColor: 'bg-rose-400' },
  { value: 'NO_NEED', label: 'No Need', color: 'border-slate-500/20 bg-slate-500/5 text-slate-400', dotColor: 'bg-slate-400' },
  { value: 'WRONG_LEAD', label: 'Wrong Lead', color: 'border-orange-500/20 bg-orange-500/5 text-orange-400', dotColor: 'bg-orange-400' }
];

export default function ClientLeadsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<Client | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'tasks'>('pipeline');

  // Load client metadata, leads and tasks
  useEffect(() => {
    if (!clientId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch client details from clients list
        const clientsRes = await api.get('/v1/agency/clients');
        const clientRecord = clientsRes.data.data.find((c: Client) => c.id === clientId);

        if (!clientRecord) {
          setError('Selected client profile not found.');
          return;
        }
        setClient(clientRecord);

        // Fetch leads and tasks
        const [leadsRes, followUpsRes] = await Promise.all([
          api.get('/v1/leads', { params: { clientId, limit: 100 } }),
          api.get('/v1/follow-ups', { params: { clientId } })
        ]);

        setLeads(leadsRes.data.data || []);
        setFollowUps(followUpsRes.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load details for this client.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clientId]);

  // Group leads by pipeline stage
  const leadsByStage: Record<LeadStage, Lead[]> = STAGES.reduce((acc, stage) => {
    if (stage.value === 'CONTACTED') {
      acc[stage.value] = leads.filter(l => l.stage === 'CONTACTED' || l.stage === 'FOLLOW_UP');
    } else {
      acc[stage.value] = leads.filter(l => l.stage === stage.value);
    }
    return acc;
  }, {} as Record<LeadStage, Lead[]>);

  const handleStageChange = async (leadId: string, nextStage: LeadStage) => {
    try {
      await api.patch(`/v1/leads/${leadId}/stage`, { stage: nextStage });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: nextStage } : l));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update stage');
    }
  };

  // Complete task
  const handleCompleteTask = async (taskId: string) => {
    try {
      await api.patch(`/v1/follow-ups/${taskId}/complete`);
      setFollowUps(prev => prev.map(f => f.id === taskId ? { ...f, status: 'done', completedAt: new Date().toISOString() } : f));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to complete task.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm font-semibold">Loading client leads workspace...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6 animate-in fade-in duration-200">
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-sm text-red-500 font-bold">
          {error || 'Client details not found.'}
        </div>
        <Button onClick={() => router.push('/agency/leads')} variant="secondary" icon={<ArrowLeft size={14} />}>
          Back to Directory
        </Button>
      </div>
    );
  }

  const totalLeads = leads.length;
  const wonLeads = leads.filter(l => l.stage === 'WON').length;
  const pendingTasks = followUps.filter(f => f.status === 'pending').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Back to Client Directory / Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <Button onClick={() => router.push('/agency/leads')} variant="secondary" size="sm" icon={<ArrowLeft size={13} />}>
          Back to Client Directory
        </Button>
        <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
          Client Workspace Telemetry
        </span>
      </div>

      {/* Client Overview Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl border border-border bg-card shadow-premium-card gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-white tracking-tight leading-none">{client.businessName}</h1>
            <Badge variant={client.metaAccessToken ? 'success' : 'warning'} dot>
              {client.metaAccessToken ? 'Meta Connected' : 'Meta Pending'}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary font-medium">Owner Email: {client.email} • ID: {client.id}</p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Link href={`/agency/clients/${client.id}`}>
            <Button variant="secondary" size="sm" icon={<ExternalLink size={13} />}>
              Configure Integrations
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          title="Leads Scoped"
          value={totalLeads}
          subtext="Total transaction records"
          icon={<Layers size={18} />}
          accentColor="#3B82F6"
        />
        <MetricCard
          title="Deals Won"
          value={wonLeads}
          subtext="Closed contracts"
          icon={<CheckCircle2 size={18} />}
          accentColor="#10B981"
        />
        <MetricCard
          title="Open Follow-ups"
          value={pendingTasks}
          subtext="Awaiting attention"
          icon={<Calendar size={18} />}
          accentColor="#F59E0B"
        />
      </div>

      {/* Main Workspace Tabs */}
      <AppCard className="p-6">
        <div className="flex justify-between items-center mb-6 border-b border-border pb-3">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`text-xs uppercase font-extrabold pb-2 border-b-2 transition-colors cursor-pointer tracking-wider ${
                activeTab === 'pipeline' 
                  ? 'text-primary border-primary' 
                  : 'text-text-secondary border-transparent hover:text-white'
              }`}
            >
              Leads Pipeline
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`text-xs uppercase font-extrabold pb-2 border-b-2 transition-colors cursor-pointer tracking-wider ${
                activeTab === 'tasks' 
                  ? 'text-primary border-primary' 
                  : 'text-text-secondary border-transparent hover:text-white'
              }`}
            >
              Follow-up Tasks
            </button>
          </div>

          <span className="text-[10px] text-text-secondary font-bold uppercase">
            Workspace Detail
          </span>
        </div>

        {/* TAB PIPELINE */}
        {activeTab === 'pipeline' && (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {STAGES.map((col) => {
              const stageLeads = leadsByStage[col.value] || [];
              return (
                <div
                  key={col.value}
                  className="flex-1 min-w-[250px] max-w-[280px] rounded-2xl border border-border bg-card-secondary/20 p-3 flex flex-col h-[520px]"
                >
                  <div className="flex items-center justify-between mb-3.5 pb-1.5 border-b border-border">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                      <span className="font-bold text-white text-xs">{col.label}</span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-card border border-border text-text-secondary">
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 transition-premium space-y-3"
                      >
                        <h4 
                          onClick={() => router.push(`/agency/leads/${clientId}/${lead.id}`)}
                          className="font-bold text-white text-xs truncate hover:text-primary cursor-pointer"
                        >
                          {lead.name}
                        </h4>
                        <p className="text-[10px] text-text-secondary font-semibold">Phone: {lead.phone || 'N/A'}</p>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <select
                            value={lead.stage}
                            onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                            className="bg-card text-white text-[9px] font-bold border border-border rounded-lg pl-1.5 pr-3 py-1 cursor-pointer focus:outline-none"
                          >
                            {[...STAGES].sort((a, b) => a.label.localeCompare(b.label)).map((s) => (
                              <option key={s.value} value={s.value} className="bg-slate-900 text-white font-normal">
                                {s.label}
                              </option>
                            ))}
                          </select>
                          
                          <button 
                            onClick={() => router.push(`/agency/leads/${clientId}/${lead.id}`)}
                            className="text-[9px] text-emerald-400 hover:underline font-bold cursor-pointer bg-transparent border-none p-0"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}

                    {stageLeads.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-28 border border-dashed border-border rounded-xl text-text-secondary/50 text-[10px]">
                        <Inbox className="h-5 w-5 mb-1 opacity-30" />
                        No leads in stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB TASKS */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            {followUps.length === 0 && (
              <div className="text-center py-12 text-text-secondary text-xs italic">
                No follow-ups scheduled for this client.
              </div>
            )}
            {followUps.map((task) => {
              const isOverdue = new Date(task.scheduledAt) < new Date() && task.status === 'pending';
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border bg-card-secondary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-premium ${
                    isOverdue ? 'border-red-500/20' : 'border-border'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-xs">Follow-up with: {task.lead?.name || 'Unknown'}</h3>
                      <Badge 
                        variant={task.status === 'done' ? 'success' : isOverdue ? 'danger' : 'warning'} 
                        dot
                      >
                        {task.status === 'done' ? 'Complete' : isOverdue ? 'Overdue' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-text-secondary font-semibold flex items-center gap-1">
                      <Clock size={11} />
                      Scheduled: {new Date(task.scheduledAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-text-secondary mt-2 italic bg-card-secondary/40 p-2.5 rounded-xl border border-border/40 max-w-xl">
                      {task.note || 'No instruction notes provided.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    {task.lead?.phone && (
                      <>
                        <a
                          href={`tel:${task.lead.phone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/15 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                          title="Call Lead"
                        >
                          <Phone className="h-3 w-3" />
                          Call
                        </a>
                        <a
                          href={`https://wa.me/${task.lead.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-450 border border-emerald-500/15 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                          title="WhatsApp Message"
                        >
                          <MessageCircle className="h-3 w-3" />
                          WhatsApp
                        </a>
                      </>
                    )}
                    {task.status === 'pending' && (
                      <Button 
                        onClick={() => handleCompleteTask(task.id)}
                        variant="primary" 
                        size="sm"
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AppCard>
    </div>
  );
}
