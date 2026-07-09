'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../../lib/api';
import { Client } from '../../../../../types';
import { 
  ArrowLeft,
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
  Layers,
  Database,
  Calendar
} from 'lucide-react';

interface ClientAnalyticsData {
  client: Client;
  totalLeads: number;
  leadsByStage: Record<string, number>;
  totalRevenue: number;
  totalAdSpend: number;
  roas: number | null;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

const STAGES_CONFIG = [
  { key: 'NEW', label: 'New', color: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  { key: 'CONTACTED', label: 'Contacted', color: '#eab308', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  { key: 'FOLLOW_UP', label: 'Follow Up', color: '#f97316', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  { key: 'QUALIFIED', label: 'Qualified', color: '#6366f1', bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: '#a855f7', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  { key: 'WON', label: 'Won', color: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  { key: 'LOST', label: 'Lost', color: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  { key: 'BOOKED', label: 'Booked', color: '#f43f5e', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  { key: 'NO_NEED', label: 'No Need', color: '#64748b', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  { key: 'WRONG_LEAD', label: 'Wrong Lead', color: '#f97316', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' }
];

export default function ClientAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [data, setData] = useState<ClientAnalyticsData | null>(null);
  const [googleConn, setGoogleConn] = useState<any>(null);
  const [googleHistory, setGoogleHistory] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStagePoint, setActiveStagePoint] = useState<number | null>(null);
  const [activeRevPoint, setActiveRevPoint] = useState<number | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/v1/agency/clients/${clientId}/analytics`);
      setData(res.data.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'Failed to load client analytics metrics.');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const fetchGoogleData = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const [connRes, historyRes] = await Promise.all([
        api.get(`/v1/agency/clients/${clientId}/google/connections`),
        api.get(`/v1/agency/clients/${clientId}/google/history`)
      ]);
      setGoogleConn(connRes.data.data[0] || null);
      setGoogleHistory(historyRes.data.data || []);
    } catch (err) {
      console.error('Failed to load spreadsheet history / connection details', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchAnalytics();
      fetchGoogleData();
    }
  }, [clientId, fetchAnalytics, fetchGoogleData]);

  const handleRefresh = () => {
    fetchAnalytics();
    fetchGoogleData();
  };

  // Funnel chart variables
  const stageData = STAGES_CONFIG.map((stage) => ({
    key: stage.key,
    label: stage.label,
    color: stage.color,
    count: data?.leadsByStage?.[stage.key] || 0
  }));

  const maxCount = Math.max(...stageData.map((d) => d.count), 5);
  
  const svgWidth = 500;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const points = stageData.map((d, index) => {
    const x = paddingX + index * (chartWidth / (stageData.length - 1));
    const y = svgHeight - paddingY - (d.count / maxCount) * chartHeight;
    return { x, y, label: d.label, count: d.count, color: d.color, key: d.key };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : '';

  // Revenue monthly trend chart variables
  const trendData = data?.revenueByMonth || [];
  const maxRevenue = Math.max(...trendData.map((d) => d.revenue), 10000);
  const revPoints = trendData.map((d, index) => {
    const x = paddingX + index * (chartWidth / Math.max(trendData.length - 1, 1));
    const y = svgHeight - paddingY - (d.revenue / maxRevenue) * chartHeight;
    return { x, y, month: d.month, revenue: d.revenue };
  });

  const revLinePath = revPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const revAreaPath = revPoints.length > 0
    ? `${revLinePath} L ${revPoints[revPoints.length - 1].x} ${svgHeight - paddingY} L ${revPoints[0].x} ${svgHeight - paddingY} Z`
    : '';

  // ROAS progress ring variables
  const roasVal = data?.roas || 0;
  const roasTarget = 5.0; // High target baseline
  const roasPercentage = Math.min((roasVal / roasTarget) * 100, 100);
  const ringCircumference = 2 * Math.PI * 60; // r=60
  const ringStrokeOffset = ringCircumference - (ringCircumference * roasPercentage) / 100;

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Aggregating client intelligence metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => router.push('/agency/clients')}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            <ArrowLeft size={13} /> Back to Clients
          </button>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-sm text-red-400 text-center shadow-xl shadow-red-500/5">
          <p className="font-semibold text-base mb-2">Error Loading Client Analytics</p>
          <p className="text-zinc-500">{error || 'Client information not available.'}</p>
        </div>
      </div>
    );
  }

  const client = data.client;
  const hasMeta = client.metaTokenStatus === 'CONNECTED';

  return (
    <div className="space-y-8 pb-12">
      {/* Header and Back Link */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-6">
        <div className="space-y-2">
          <button 
            onClick={() => router.push('/agency/clients')}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer select-none"
          >
            <ArrowLeft size={14} /> Back to Clients
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-white">
              {client.businessName} Analytics
            </h1>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                hasMeta
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {hasMeta ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
              {hasMeta ? 'Meta Active' : 'Meta Link Pending'}
            </span>
          </div>
          <p className="text-zinc-400 text-sm">
            {hasMeta 
              ? `${client.email} — Partner Meta Ads performance dashboard and analytics` 
              : `${client.email} — Partner performance dashboard and analytics`}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white transition-all cursor-pointer select-none active:scale-95"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#3B82F6]' : ''} />
          Refresh Stats
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Leads */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 relative overflow-hidden group shadow-lg shadow-black/35">
          <div className="absolute top-0 right-0 h-24 w-24 bg-cyan-500/5 rounded-full blur-2xl -translate-y-8 translate-x-8"></div>
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/15 text-[#3B82F6]">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              Gross Volume
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {hasMeta ? 'Meta Leads Synced' : 'Total Leads Synced'}
            </p>
            <h3 className="text-3xl font-black mt-1.5 text-white tracking-tight">{data.totalLeads}</h3>
            <p className="text-[10.5px] text-zinc-400 mt-2">
              {hasMeta ? 'Synced from Meta Ad campaigns' : (
                <>Won stage: <span className="text-emerald-400 font-bold">{data.leadsByStage['WON'] || 0}</span> ({data.totalLeads > 0 ? ((data.leadsByStage['WON'] || 0) / data.totalLeads * 100).toFixed(1) : 0}%)</>
              )}
            </p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 relative overflow-hidden group shadow-lg shadow-black/35">
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl -translate-y-8 translate-x-8"></div>
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-400">
              <DollarSign size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp size={10} /> Won Deals
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {hasMeta ? 'Meta Closed Revenue' : 'Total Client Revenue'}
            </p>
            <h3 className="text-3xl font-black mt-1.5 text-emerald-400 tracking-tight">
              ₹{data.totalRevenue.toLocaleString()}
            </h3>
            <p className="text-[10.5px] text-zinc-400 mt-2">
              {hasMeta ? 'Generated from Meta Ads leads' : (
                <>Avg ticket value: <span className="text-white font-bold">₹{data.leadsByStage['WON'] > 0 ? (data.totalRevenue / data.leadsByStage['WON']).toLocaleString(undefined, {maximumFractionDigits:0}) : 0}</span></>
              )}
            </p>
          </div>
        </div>

        {/* Ad Spend */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 relative overflow-hidden group shadow-lg shadow-black/35">
          <div className="absolute top-0 right-0 h-24 w-24 bg-violet-500/5 rounded-full blur-2xl -translate-y-8 translate-x-8"></div>
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/15 text-violet-400">
              <Wallet size={20} />
            </div>
            <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
              Meta Ads
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Facebook Ad Spend</p>
            <h3 className="text-3xl font-black mt-1.5 text-violet-400 tracking-tight">
              ₹{data.totalAdSpend.toLocaleString()}
            </h3>
            <p className="text-[10.5px] text-zinc-400 mt-2">
              Cost per lead: <span className="text-white font-bold">₹{data.totalLeads > 0 ? (data.totalAdSpend / data.totalLeads).toFixed(2) : '0.00'}</span>
            </p>
          </div>
        </div>

        {/* ROAS Coefficient */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 relative overflow-hidden group shadow-lg shadow-black/35">
          <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-8 translate-x-8"></div>
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/15 text-indigo-400">
              <Activity size={20} />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roasVal >= 3.0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
              Target &gt;3.0x
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Return on Ad Spend</p>
            <h3 className="text-3xl font-black mt-1.5 text-indigo-400 tracking-tight">
              {roasVal !== null ? `${roasVal}x` : '0.00x'}
            </h3>
            <p className="text-[10.5px] text-zinc-400 mt-2">
              Spend efficiency: <span className={`font-bold ${roasVal >= 3.0 ? 'text-emerald-400' : roasVal > 0 ? 'text-yellow-400' : 'text-zinc-500'}`}>
                {roasVal >= 3.0 ? 'High' : roasVal > 0 ? 'Moderate' : 'No ad data'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SVG Funnel Pipeline Stage Distribution */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 flex flex-col justify-between shadow-lg shadow-black/35 relative">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers size={18} className="text-[#3B82F6]" />
                  {hasMeta ? 'Meta Ads Conversion Funnel' : 'Pipeline Funnel Distribution'}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {hasMeta 
                    ? 'Frequency count of Meta leads mapped across pipeline stages' 
                    : 'Frequency count of leads mapped across pipeline stages'}
                </p>
              </div>
              
              {activeStagePoint !== null && (
                <div className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-[#3B82F6] animate-in fade-in duration-200">
                  {points[activeStagePoint].label}: <span className="text-white">{points[activeStagePoint].count} leads</span>
                </div>
              )}
            </div>

            <div className="relative w-full h-[220px] bg-zinc-950/20 border border-zinc-900/40 rounded-xl overflow-hidden p-2">
              <svg className="w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cyan-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const y = paddingY + ratio * chartHeight;
                  return (
                    <line
                      key={index}
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#18181b"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {[0, 0.5, 1].map((ratio, index) => {
                  const val = Math.round(maxCount * (1 - ratio));
                  const y = paddingY + ratio * chartHeight + 4;
                  return (
                    <text
                      key={index}
                      x={paddingX - 10}
                      y={y}
                      fill="#52525b"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  );
                })}

                {areaPath && <path d={areaPath} fill="url(#cyan-gradient)" />}

                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {points.map((p, index) => {
                  const isActive = activeStagePoint === index;
                  return (
                    <g key={index} className="cursor-pointer">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="16"
                        fill="transparent"
                        onMouseEnter={() => setActiveStagePoint(index)}
                        onMouseLeave={() => setActiveStagePoint(null)}
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isActive ? "8" : "4.5"}
                        fill={p.color}
                        opacity={isActive ? "0.4" : "0.25"}
                        className="transition-all duration-200"
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isActive ? "4.5" : "2.5"}
                        fill={isActive ? "#fff" : p.color}
                        stroke="#09090b"
                        strokeWidth="1.5"
                        className="transition-all duration-200"
                      />
                    </g>
                  );
                })}

                {points.map((p, index) => {
                  return (
                    <text
                      key={index}
                      x={p.x}
                      y={svgHeight - 8}
                      fill="#52525b"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {p.label}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mt-4 pt-4 border-t border-zinc-900 text-center">
            {stageData.map((d) => (
              <div key={d.key} className="space-y-1">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{d.label}</p>
                <p className="text-xs font-extrabold text-white">{d.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Budget efficiency dial card */}
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 flex flex-col justify-between shadow-lg shadow-black/35">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
              <Activity size={18} className="text-violet-400" />
              Budget Efficiency
            </h2>
            <p className="text-xs text-zinc-400 mb-6">Client ROAS indicator against the pro-baseline target threshold.</p>
          </div>

          <div className="flex justify-center items-center my-4 relative">
            <svg className="w-36 h-36" viewBox="0 0 140 140">
              <defs>
                <linearGradient id="roas-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <circle
                cx="70"
                cy="70"
                r="60"
                fill="none"
                stroke="#18181b"
                strokeWidth="7"
              />
              <circle
                cx="70"
                cy="70"
                r="60"
                fill="none"
                stroke="url(#roas-grad)"
                strokeWidth="7"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringStrokeOffset}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col justify-center items-center">
              <span className="text-2xl font-black text-white leading-none tracking-tight">
                {roasVal > 0 ? `${roasVal.toFixed(2)}x` : 'N/A'}
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
                Client ROAS
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-900 space-y-3.5 text-xs text-zinc-300">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Invoiced Revenue</span>
              <span className="font-bold text-white">₹{data.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Facebook Ad Spend</span>
              <span className="font-bold text-white">₹{data.totalAdSpend.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Efficiency Status</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${roasVal >= 3.0 ? 'bg-emerald-500/10 text-emerald-400' : roasVal > 0 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {roasVal >= 3.0 ? 'Highly Profitable' : roasVal > 0 ? 'Moderate' : 'No ad data'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue trends & Google connection logs history */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SVG Monthly Revenue trends chart */}
        <div className={`${hasMeta ? 'lg:col-span-3' : 'lg:col-span-2'} rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 flex flex-col justify-between shadow-lg shadow-black/35 relative`}>
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#3B82F6]" />
                  {hasMeta ? 'Meta Closed Revenue (Last 6 Months)' : 'Monthly Closed Revenue (Last 6 Months)'}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {hasMeta 
                    ? 'Revenue from Meta leads aggregated over trailing billing cycles' 
                    : 'Closed sales volume aggregated over trailing billing cycles'}
                </p>
              </div>

              {activeRevPoint !== null && (
                <div className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-emerald-400 animate-in fade-in duration-200">
                  {trendData[activeRevPoint].month}: <span className="text-white">₹{trendData[activeRevPoint].revenue.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="relative w-full h-[220px] bg-zinc-950/20 border border-zinc-900/40 rounded-xl overflow-hidden p-2">
              {trendData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                  No historical sales records loaded for this client.
                </div>
              ) : (
                <svg className="w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="emerald-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                    const y = paddingY + ratio * chartHeight;
                    return (
                      <line
                        key={index}
                        x1={paddingX}
                        y1={y}
                        x2={svgWidth - paddingX}
                        y2={y}
                        stroke="#18181b"
                        strokeDasharray="4 4"
                      />
                    );
                  })}

                  {[0, 0.5, 1].map((ratio, index) => {
                    const val = Math.round(maxRevenue * (1 - ratio));
                    const y = paddingY + ratio * chartHeight + 4;
                    return (
                      <text
                        key={index}
                        x={paddingX - 10}
                        y={y}
                        fill="#52525b"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="end"
                      >
                        ₹{val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                      </text>
                    );
                  })}

                  {revAreaPath && <path d={revAreaPath} fill="url(#emerald-gradient)" />}

                  {revLinePath && (
                    <path
                      d={revLinePath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {revPoints.map((p, index) => {
                    const isActive = activeRevPoint === index;
                    return (
                      <g key={index} className="cursor-pointer">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="16"
                          fill="transparent"
                          onMouseEnter={() => setActiveRevPoint(index)}
                          onMouseLeave={() => setActiveRevPoint(null)}
                        />
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isActive ? "8" : "4.5"}
                          fill="#10b981"
                          opacity={isActive ? "0.4" : "0.25"}
                          className="transition-all duration-200"
                        />
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isActive ? "4.5" : "2.5"}
                          fill={isActive ? "#fff" : "#10b981"}
                          stroke="#09090b"
                          strokeWidth="1.5"
                          className="transition-all duration-200"
                        />
                      </g>
                    );
                  })}

                  {revPoints.map((p, index) => {
                    return (
                      <text
                        key={index}
                        x={p.x}
                        y={svgHeight - 8}
                        fill="#52525b"
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {p.month}
                      </text>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2 mt-4 pt-4 border-t border-zinc-900 text-center">
            {trendData.map((d, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{d.month}</p>
                <p className="text-xs font-extrabold text-white">₹{d.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Google Sheets Connection details panel */}
        {!hasMeta && (
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 flex flex-col justify-between shadow-lg shadow-black/35">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database size={18} className="text-[#3B82F6]" />
                Spreadsheet Integration
              </h2>
              
              {googleConn ? (
                <div className="space-y-4">
                  <div className="p-3 bg-[#3B82F6]/5 rounded-xl border border-[#3B82F6]/15">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Spreadsheet File</p>
                    <p className="text-xs font-bold text-white truncate mt-1">
                      {googleConn.spreadsheetName}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Tab: <span className="font-semibold text-cyan-400">{googleConn.sheetName}</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-2">
                      Auto sync interval: <span className="font-semibold text-white">{googleConn.syncInterval}s</span>
                    </p>
                    {googleConn.lastSyncAt && (
                      <p className="text-[9.5px] text-zinc-500 mt-1">
                        Last Synced: <span className="font-semibold text-white">{new Date(googleConn.lastSyncAt).toLocaleString()}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 rounded-full ${googleConn.syncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-zinc-300">
                      Auto-sync {googleConn.syncEnabled ? 'Enabled' : 'Paused'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center text-zinc-500 text-xs py-8">
                  No active Google Spreadsheet connection connected for this client.
                </div>
              )}
            </div>

            <div className="border-t border-zinc-900 mt-6 pt-4 text-center">
              <Link
                href={`/agency/clients/${clientId}`}
                className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-bold text-[#3B82F6] hover:text-[#068ba2] hover:underline"
              >
                Configure Integration Credentials
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Sync history logs list */}
      {!hasMeta && (
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 overflow-hidden shadow-lg shadow-black/35">
          <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar size={18} className="text-[#3B82F6]" />
                Spreadsheet Synchronization History Logs
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Audit log of lead background processes executed via BullMQ scheduler</p>
            </div>
          </div>

          {loadingHistory && googleHistory.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              Loading background synchronization records...
            </div>
          ) : googleHistory.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm py-12">
              No synchronization history logs found for this spreadsheet connection.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950/50 text-zinc-400 uppercase tracking-widest text-[9.5px] font-extrabold">
                    <th className="py-4 px-6">Execution Timestamp</th>
                    <th className="py-4 px-6">Spreadsheet Scope</th>
                    <th className="py-4 px-6">Parsed Rows</th>
                    <th className="py-4 px-6">New Leads Created</th>
                    <th className="py-4 px-6">Duplicates Skipped</th>
                    <th className="py-4 px-6">Sync Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {googleHistory.map((log) => {
                    const hasFailed = log.failedRows > 0;
                    return (
                      <tr 
                        key={log.id}
                        className="hover:bg-zinc-900/20 text-zinc-300 transition-colors"
                      >
                        <td className="py-4.5 px-6">
                          <div className="font-bold text-white">{new Date(log.createdAt).toLocaleString()}</div>
                        </td>
                        <td className="py-4.5 px-6 truncate max-w-[200px]">
                          <span className="text-zinc-400 font-semibold">{log.spreadsheetName || '—'}</span>
                          <span className="text-zinc-600 block text-[10px] mt-0.5">Tab: {log.sheetTabName || '—'}</span>
                        </td>
                        <td className="py-4.5 px-6 font-semibold text-white">
                          {log.totalRows} rows
                        </td>
                        <td className="py-4.5 px-6">
                          <span className="text-emerald-400 font-bold">+{log.importedRows}</span>
                        </td>
                        <td className="py-4.5 px-6 text-zinc-500">
                          {log.duplicateRows} skipped
                        </td>
                        <td className="py-4.5 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                            hasFailed
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {hasFailed ? 'Partial Issues' : 'Success'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
