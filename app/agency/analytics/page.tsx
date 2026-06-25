'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { Client } from '../../../types';
import { AppCard } from '@/components/ui/card';
import { FunnelBarChart, RadialProgressGauge } from '@/components/ui/chart';
import { 
  Users, 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  ArrowUpRight, 
  Wallet,
  Activity,
  Layers
} from 'lucide-react';

interface AnalyticsData {
  totalClients: number;
  totalLeads: number;
  leadsByStage: Record<string, number>;
  totalRevenue: number;
  totalAdSpend: number;
  roas: number | null;
}

const STAGES_CONFIG = [
  { key: 'NEW', label: 'New', color: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  { key: 'CONTACTED', label: 'Contacted', color: '#eab308', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  { key: 'FOLLOW_UP', label: 'Follow Up', color: '#f97316', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  { key: 'QUALIFIED', label: 'Qualified', color: '#6366f1', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: '#a855f7', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  { key: 'WON', label: 'Won', color: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { key: 'LOST', label: 'Lost', color: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' }
];

export default function AgencyAnalyticsPage() {
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
      setError(err.response?.data?.error?.message || 'Failed to load agency analytics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await api.get('/v1/agency/clients', {
        params: { isDeleted: false, limit: 100 }
      });
      const connectedClients = (response.data.data || []).filter(
        (c: Client) => c.metaTokenStatus === 'CONNECTED'
      );
      setClients(connectedClients);
    } catch (err) {
      console.error('Failed to load agency clients', err);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchClients();
  }, []);

  const handleRefresh = () => {
    fetchData();
    fetchClients();
  };

  const stageData = STAGES_CONFIG.map((stage) => ({
    key: stage.key,
    label: stage.label,
    color: stage.color,
    count: data?.leadsByStage?.[stage.key] || 0
  }));

  const funnelChartData = stageData.map((d) => ({
    name: d.label,
    count: d.count,
    color: d.color,
  }));

  const roasVal = data?.roas || 0;


  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Aggregating agency intelligence metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black tracking-tight text-white">Agency Intelligence</h1>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-sm text-red-400 text-center shadow-xl shadow-red-500/5">
          <p className="font-semibold text-base mb-2">Error Loading Analytics</p>
          <p className="text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            Agency Intelligence
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 animate-pulse">
              Live
            </span>
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Unified client metrics, budget spend efficiency, and conversion statistics for connected Meta accounts</p>
        </div>
        
        <button
          onClick={handleRefresh}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-bold bg-muted/10 border border-border hover:bg-muted/20 text-foreground transition-all cursor-pointer select-none active:scale-95"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-primary' : ''} />
          Refresh Dashboard
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Clients Card */}
        <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-primary/10 transition-colors duration-300"></div>
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/15 text-primary">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              Active
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Managed Clients</p>
            <h3 className="text-3xl font-black mt-1.5 text-foreground tracking-tight">{data?.totalClients || 0}</h3>
            <p className="text-[10.5px] text-muted-foreground mt-2 flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">100%</span> service uptime across nodes
            </p>
          </div>
        </div>

        {/* Gross Leads Card */}
        <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-indigo-500/10 transition-colors duration-300"></div>
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/15 text-indigo-500">
              <BarChart3 size={20} />
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              +14.2% MoM
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross Leads Synced</p>
            <h3 className="text-3xl font-black mt-1.5 text-foreground tracking-tight">{data?.totalLeads || 0}</h3>
            <p className="text-[10.5px] text-muted-foreground mt-2 flex items-center gap-1.5">
              <span className="text-indigo-500 font-bold">Real-time</span> Meta &amp; Sheets pipeline
            </p>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-emerald-500/10 transition-colors duration-300"></div>
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-500">
              <DollarSign size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp size={10} /> +8.7%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Closed Sales volume</p>
            <h3 className="text-3xl font-black mt-1.5 text-emerald-500 tracking-tight">
              ₹{data?.totalRevenue ? data.totalRevenue.toLocaleString() : '0'}
            </h3>
            <p className="text-[10.5px] text-muted-foreground mt-2 flex items-center gap-1.5">
              Across all connected client pipelines
            </p>
          </div>
        </div>

        {/* Aggregate ROAS Card */}
        <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 h-24 w-24 bg-violet-500/5 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:bg-violet-500/10 transition-colors duration-300"></div>
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/15 text-violet-500">
              <Activity size={20} />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roasVal >= 3.0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
              Target &gt;3.0x
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aggregate ROAS</p>
            <h3 className="text-3xl font-black mt-1.5 text-violet-500 tracking-tight">
              {data?.roas !== null && data?.roas !== undefined ? `${data.roas}x` : '0.00x'}
            </h3>
            <p className="text-[10.5px] text-muted-foreground mt-2 flex items-center gap-1.5 truncate">
              Ad spend: ₹{data?.totalAdSpend ? data.totalAdSpend.toLocaleString() : '0'}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recharts Funnel Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Layers size={18} className="text-primary" />
                Conversion Funnel Analysis
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Leads frequency distribution mapped across pipeline milestones</p>
            </div>
          </div>

          {/* Recharts horizontal funnel bar */}
          <FunnelBarChart data={funnelChartData} />

          {/* Bottom summary strip */}
          <div className="grid grid-cols-7 gap-2 mt-4 pt-4 border-t border-border text-center">
            {stageData.map((d) => (
              <div key={d.key} className="space-y-1">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{d.label}</p>
                <p className="text-xs font-extrabold text-foreground">{d.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recharts Radial ROAS Gauge Card */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-1">
              <Activity size={18} className="text-violet-500" />
              Budget Efficiency
            </h2>
            <p className="text-xs text-muted-foreground mb-4">Aggregated ROAS factor visual indicator compared to base target threshold.</p>
          </div>

          {/* Recharts Radial Gauge */}
          <div className="flex justify-center items-center my-2">
            <RadialProgressGauge
              value={roasVal}
              max={5}
              label="Aggregate ROAS"
              primaryColor="#3B82F6"
              secondaryColor="#8b5cf6"
            />
          </div>

          {/* Budget allocation info */}
          <div className="mt-4 pt-4 border-t border-border space-y-3.5 text-xs text-muted-foreground">
            <div className="flex justify-between items-center">
              <span>Gross invoiced client revenue</span>
              <span className="font-bold text-foreground">₹{data?.totalRevenue ? data.totalRevenue.toLocaleString() : '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total client Meta ad spend</span>
              <span className="font-bold text-foreground">₹{data?.totalAdSpend ? data.totalAdSpend.toLocaleString() : '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Efficiency status</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                roasVal >= 3.0
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : roasVal > 0
                  ? 'bg-indigo-500/10 text-indigo-500'
                  : 'bg-muted/20 text-muted-foreground'
              }`}>
                {roasVal >= 3.0 ? 'Highly Profitable' : roasVal > 0 ? 'Moderate' : 'No ad data'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Client Accounts Breakdown Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-border bg-muted/5">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            Connected Meta Client Accounts Performance
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Summary of ad spend configurations, active integrations, and connection scopes for Meta-connected clients</p>
        </div>

        {loadingClients && clients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Loading managed accounts metadata...
          </div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center justify-center space-y-3">
            <p>No connected Meta client accounts found.</p>
            <Link 
              href="/agency/clients" 
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Connect Meta for your clients <ArrowUpRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/5 text-muted-foreground uppercase tracking-widest text-[9.5px] font-extrabold">
                  <th className="py-4 px-6">Business Profile</th>
                  <th className="py-4 px-6">Google Sheets Integration</th>
                  <th className="py-4 px-6">Facebook/Meta Ad spend</th>
                  <th className="py-4 px-6">Meta token scope status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {clients.map((client) => {
                  const hasMeta = !!client.metaAccessToken;
                  
                  return (
                    <tr 
                      key={client.id}
                      className="hover:bg-muted/5 text-muted-foreground transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-4.5 px-6">
                        <div className="font-bold text-foreground text-sm">{client.businessName}</div>
                        <div className="text-muted-foreground text-xs mt-0.5">{client.email}</div>
                      </td>

                      {/* Google Sheets info */}
                      <td className="py-4.5 px-6">
                        <span className="text-muted-foreground">
                          Active spreadsheets sync scheduled
                        </span>
                      </td>

                      {/* Ad spend (INR) */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-1.5">
                          <Wallet size={13} className="text-primary" />
                          <span className="font-semibold text-foreground">
                            ₹{client.metaAdSpend ? client.metaAdSpend.toLocaleString() : '0'}
                          </span>
                        </div>
                      </td>

                      {/* Meta Status */}
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-2">
                          {hasMeta ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <ShieldCheck size={12} />
                              Connected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              <ShieldAlert size={12} />
                              Pending Link
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4.5 px-6 text-right">
                        <Link
                          href={`/agency/clients/${client.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 hover:underline"
                        >
                          Configure Account
                          <ArrowUpRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


