'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { Client } from '../../../types';
import { MetricCard, AppCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BarChart3, 
  DollarSign, 
  Activity,
  ArrowRight,
  ShieldCheck,
  Wallet,
  Settings,
  Layers,
} from 'lucide-react';

interface AnalyticsData {
  totalClients: number;
  totalLeads: number;
  leadsByStage: Record<string, number>;
  totalRevenue: number;
  totalAdSpend: number;
  roas: number | null;
}

const STAGE_CONFIG: { value: string; label: string; color: string; bgColor: string }[] = [
  { value: 'NEW', label: 'New', color: '#22d3ee', bgColor: 'rgba(34,211,238,0.08)' },
  { value: 'CONTACTED', label: 'Contacted', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.08)' },
  { value: 'QUALIFIED', label: 'Qualified', color: '#6366f1', bgColor: 'rgba(99,102,241,0.08)' },
  { value: 'NEGOTIATION', label: 'Proposal', color: '#a855f7', bgColor: 'rgba(168,85,247,0.08)' },
  { value: 'WON', label: 'Won', color: '#10b981', bgColor: 'rgba(16,185,129,0.08)' },
  { value: 'LOST', label: 'Lost', color: '#ef4444', bgColor: 'rgba(239,68,68,0.08)' },
];

export default function AgencyDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/v1/agency/analytics');
      setData(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await api.get('/v1/agency/clients', {
        params: { isDeleted: false, limit: 10 }
      });
      setClients(response.data.data);
    } catch (err) {
      console.error('Failed to load dashboard clients', err);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchClients();
  }, []);

  // ROAS progress ring variables
  const roasVal = data?.roas || 0;
  const roasTarget = 5.0; 
  const roasPercentage = Math.min((roasVal / roasTarget) * 100, 100);
  const ringCircumference = 2 * Math.PI * 55;
  const ringStrokeOffset = ringCircumference - (ringCircumference * roasPercentage) / 100;

  const totalLeads = data?.totalLeads ?? 0;

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
        <p className="text-muted text-sm font-semibold">Loading agency command center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-[48px] font-bold text-foreground tracking-tight leading-none font-display">
            Command Center
          </h1>
          <p className="text-text-secondary text-sm mt-2">Unified operations summary and connected node telemetry</p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Managed Clients"
          value={data?.totalClients ?? 0}
          subtext="Active portal links"
          icon={<Users size={20} />}
          accentColor="#3B82F6"
        />
        
        <MetricCard
          title="Gross Leads Synced"
          value={(data?.totalLeads ?? 0).toLocaleString()}
          subtext="Total pipeline entries"
          icon={<BarChart3 size={20} />}
          accentColor="#6366F1"
        />

        <MetricCard
          title="Revenue Tracked"
          value={`₹${data?.totalRevenue ? data.totalRevenue.toLocaleString() : '0'}`}
          subtext="Total transaction volume"
          icon={<DollarSign size={20} />}
          accentColor="#10B981"
        />

        <MetricCard
          title="Average ROAS"
          value={data?.roas !== null && data?.roas !== undefined ? `${data.roas.toFixed(2)}x` : '0.00x'}
          subtext={`Ad spend: ₹${data?.totalAdSpend ? data.totalAdSpend.toLocaleString() : '0'}`}
          icon={<Activity size={20} />}
          accentColor="#8B5CF6"
        />
      </div>

      {/* Leads by Stage Funnel */}
      {totalLeads > 0 && (
        <AppCard className="p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-sm font-extrabold text-foreground uppercase tracking-widest flex items-center gap-2">
                <Layers size={16} className="text-[#6366F1]" />
                Pipeline Breakdown
              </h2>
              <p className="text-xs text-muted mt-1">Lead distribution across all client accounts</p>
            </div>
            <span className="text-xs font-bold text-foreground bg-card-secondary/40 px-3 py-1.5 rounded-xl border border-border">
              {totalLeads} total leads
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {STAGE_CONFIG.map((stage) => {
              const count = data?.leadsByStage?.[stage.value] ?? 0;
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              return (
                <div
                  key={stage.value}
                  className="rounded-2xl border border-border/60 p-4 text-center transition-premium hover:border-border"
                  style={{ background: stage.bgColor }}
                >
                  <span
                    className="text-2xl font-black leading-none"
                    style={{ color: stage.color }}
                  >
                    {count}
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mt-1.5">
                    {stage.label}
                  </p>
                  <div className="mt-2 h-1 rounded-full bg-border/50 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: stage.color }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-text-secondary mt-1 block">{pct}%</span>
                </div>
              );
            })}
          </div>
        </AppCard>
      )}

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Operations Sidebar */}
        <div className="space-y-6">
          <AppCard className="p-6">
            <h2 className="text-sm font-extrabold text-foreground uppercase tracking-widest mb-4">
              Operations Hub
            </h2>
            <div className="space-y-3">
              <Link href="/agency/clients" className="block group">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-muted/5 group-hover:bg-muted/15 transition-premium">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/10">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Client Profiles</p>
                      <p className="text-[10px] text-muted font-medium mt-0.5">Manage details &amp; credentials</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-premium" />
                </div>
              </Link>

              <Link href="/agency/leads" className="block group">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-muted/5 group-hover:bg-muted/15 transition-premium">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/10">
                      <BarChart3 size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Leads Center</p>
                      <p className="text-[10px] text-muted font-medium mt-0.5">Pipeline &amp; follow-up management</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-premium" />
                </div>
              </Link>

              <Link href="/agency/settings" className="block group">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/80 bg-muted/5 group-hover:bg-muted/15 transition-premium">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-500/10 text-muted border border-slate-500/10">
                      <Settings size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Agency Settings</p>
                      <p className="text-[10px] text-muted font-medium mt-0.5">License &amp; team config</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-premium" />
                </div>
              </Link>
            </div>
          </AppCard>

          {/* Budget dial widget */}
          <AppCard className="p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-foreground uppercase tracking-widest">
                Budget Efficiency
              </h2>
              <p className="text-[10px] text-muted font-bold tracking-wider uppercase mt-1">Aggregate ROAS Status</p>
            </div>

            <div className="flex justify-center items-center my-6 relative select-none">
              <svg className="w-32 h-32" viewBox="0 0 130 130">
                <defs>
                  <linearGradient id="roasGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <circle
                  cx="65"
                  cy="65"
                  r="55"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="5"
                  opacity={0.4}
                />
                <circle
                  cx="65"
                  cy="65"
                  r="55"
                  fill="none"
                  stroke="url(#roasGradient)"
                  strokeWidth="6"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringStrokeOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 65 65)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col justify-center items-center">
                <span className="text-2xl font-black text-foreground tracking-tight leading-none">
                  {roasVal > 0 ? `${roasVal.toFixed(1)}x` : '0.0x'}
                </span>
                <span className="text-[9px] text-muted font-extrabold uppercase tracking-widest mt-1.5">
                  ROAS
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-border/80 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-muted">Total Ad Spend</span>
                <span className="text-foreground">₹{data?.totalAdSpend ? data.totalAdSpend.toLocaleString() : '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Total Revenue</span>
                <span className="text-emerald-400">₹{data?.totalRevenue ? data.totalRevenue.toLocaleString() : '0'}</span>
              </div>
            </div>
          </AppCard>
        </div>

        {/* Clients Connection status */}
        <div className="lg:col-span-2">
          <AppCard className="p-6 h-full flex flex-col justify-between">
            <div className="w-full">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-sm font-extrabold text-foreground uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#3B82F6]" />
                    Connection Profiles
                  </h2>
                  <p className="text-xs text-muted mt-1">Integration and budget statuses for active partner portals</p>
                </div>
                <Link href="/agency/clients" className="text-xs font-bold text-[#3B82F6] hover:underline">
                  View All
                </Link>
              </div>

              {loadingClients && clients.length === 0 ? (
                <div className="p-8 text-center text-muted text-sm font-medium">
                  Loading client profiles...
                </div>
              ) : clients.length === 0 ? (
                <div className="p-12 text-center text-muted text-sm flex flex-col items-center justify-center space-y-4 border border-dashed border-border rounded-2xl">
                  <p className="font-semibold text-foreground">No connections found</p>
                  <p className="text-xs text-muted max-w-xs leading-relaxed">Get started by registering client accounts and connecting Meta ad keys.</p>
                  <Link href="/agency/clients">
                    <Button variant="secondary" size="sm">Add Client</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.map((client) => {
                    const hasMeta = !!client.metaAccessToken;
                    return (
                      <div 
                        key={client.id}
                        className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-muted/5 hover:bg-muted/15 hover:border-border transition-premium"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-foreground truncate">{client.businessName}</h4>
                          <p className="text-[10px] text-muted font-semibold truncate mt-0.5">{client.email}</p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                            <Wallet size={12} className="text-muted shrink-0" />
                            <span>₹{client.metaAdSpend ? client.metaAdSpend.toLocaleString() : '0'}</span>
                          </div>

                          <Badge variant={hasMeta ? 'success' : 'warning'} dot>
                            {hasMeta ? 'Connected' : 'Pending'}
                          </Badge>

                          <Link href={`/agency/clients/${client.id}`}>
                            <Button variant="secondary" size="sm" className="px-3 py-1.5 h-8">
                              Manage
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </AppCard>
        </div>

      </div>
    </div>
  );
}
