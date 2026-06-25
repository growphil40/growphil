'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { useSocket } from '../../../../hooks/useSocket';
import { AppCard, MetricCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableContainer, Table, TableRow, TableCell } from '@/components/ui/table';
import { Drawer } from '@/components/ui/drawer';
import {
  Shield,
  ShieldCheck,
  Users,
  BarChart3,
  DollarSign,
  RefreshCw,
  Wallet,
  Activity,
  Layers,
  Database,
  Grid,
  FileText,
  Clock,
  ChevronRight,
  Info,
  ExternalLink,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Key,
  Globe,
  User,
  X,
  Target,
  Eye,
  MousePointerClick
} from 'lucide-react';

interface MetaDashboardData {
  connected: boolean;
  apiAvailable?: boolean;
  client?: {
    id: string;
    businessName: string;
    email: string;
    metaLastSyncAt: string | null;
  };
  overviewMetrics?: {
    spend: number;
    reach: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    cpm: number;
    leads: number;
    costPerLead: number;
  };
  campaigns?: Array<{
    id: string;
    name: string;
    objective: string;
    status: string;
    spend: number;
    reach: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    cpm: number;
    leads: number;
    costPerLead: number;
  }>;
  adsets?: Array<{
    id: string;
    name: string;
    status: string;
    dailyBudget: number;
    reach: number;
    leads: number;
    spend: number;
  }>;
  ads?: Array<{
    id: string;
    name: string;
    status: string;
    spend: number;
    reach: number;
    clicks: number;
    ctr: number;
    leads: number;
    cpc: number;
  }>;
  forms?: Array<{
    id: string;
    name: string;
    createdTime: string;
    leadsCount: number;
  }>;
  leads?: Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
    campaign: string;
    adset: string;
    ad: string;
    form: string;
    page: string;
    createdTime: string;
    metaLeadId: string;
    source: string;
  }>;
  connectionCard?: {
    connectedBusiness: { name: string; id: string };
    connectedAdAccount: { id: string; name: string; currency: string; timezone: string };
    connectedPage: { name: string; id: string };
    connectedUser: { name: string };
    daysRemaining: number;
  };
  diagnostics?: {
    webhookStatus: string;
    pageTokenStatus: string;
    userTokenStatus: string;
    permissionsGranted: Array<{ permission: string; status: string }>;
    queueHealth: string;
    failedJobs: number;
    deadLetterQueueCount: number;
    lastSuccessfulSync: string | null;
  };
}

interface LoggedEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export default function MetaDashboard() {
  const { socket, connected: socketConnected } = useSocket();

  const [data, setData] = useState<MetaDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [refreshing, setRefreshing] = useState(false);
  const [eventsList, setEventsList] = useState<LoggedEvent[]>([]);

  // Selected item side panel states for card details drawers
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [selectedAdset, setSelectedAdset] = useState<any | null>(null);
  const [selectedAd, setSelectedAd] = useState<any | null>(null);
  const [selectedForm, setSelectedForm] = useState<any | null>(null);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const response = await api.get('/v1/meta/dashboard');
      setData(response.data.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'Failed to retrieve Meta dashboard statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-Time Socket.IO event registrations
  useEffect(() => {
    if (!socket) return;

    const appendEvent = (type: string, message: string) => {
      const newEvent: LoggedEvent = {
        id: Math.random().toString(),
        type,
        message,
        timestamp: new Date().toISOString(),
      };
      setEventsList((prev) => [newEvent, ...prev].slice(0, 50));
    };

    const handleNewLead = (payload: any) => {
      const leadPayload = payload.lead || payload;
      
      appendEvent(
        'New Lead Received',
        `Lead "${leadPayload.name || 'Meta Lead'}" synced from campaign "${leadPayload.campaignName || '—'}"`
      );

      // Play Sound Alert
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch (e) {}

      // Desktop Notification
      if (Notification.permission === 'granted') {
        new Notification('New Meta Lead Sync 🔔', {
          body: `${leadPayload.name || 'Lead Name'} is synchronized.`,
        });
      }

      fetchDashboardData(true);
    };

    const handleWebhookReceived = (payload: any) => {
      appendEvent(
        'Webhook Received',
        `Meta webhook triggered for Form ID: ${payload.formId || '—'}`
      );
    };

    const handleCampaignUpdated = (payload: any) => {
      appendEvent(
        'Campaign Updated',
        `Campaign telemetry updated: ${payload.count || 0} active campaigns`
      );
    };

    const handleAdsetUpdated = (payload: any) => {
      appendEvent(
        'Adset Updated',
        `Adset configuration synchronized: ${payload.count || 0} active sets`
      );
    };

    const handleTokenRefreshed = (payload: any) => {
      appendEvent(
        'Token Refreshed',
        `Meta connection token verified. Expiry: ${new Date(payload.expiresAt).toLocaleDateString()}`
      );
    };

    socket.on('lead:new', handleNewLead);
    socket.on('webhook:received', handleWebhookReceived);
    socket.on('campaign:updated', handleCampaignUpdated);
    socket.on('adset_updated', handleAdsetUpdated);
    socket.on('token:refreshed', handleTokenRefreshed);

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('lead:new', handleNewLead);
      socket.off('webhook:received', handleWebhookReceived);
      socket.off('campaign:updated', handleCampaignUpdated);
      socket.off('adset_updated', handleAdsetUpdated);
      socket.off('token:refreshed', handleTokenRefreshed);
    };
  }, [socket, fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="w-10 h-10 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
        <p className="text-muted text-sm">Fetching real-time Meta Graph API telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-black text-foreground tracking-tight font-display">Meta Ads Dashboard</h1>
        <AppCard className="p-6 text-center border-red-500/20 bg-red-500/5">
          <p className="font-bold text-red-500 mb-1">Failed to load Meta integration data</p>
          <p className="text-xs text-muted mb-4">{error || 'Could not verify token configuration.'}</p>
          <Button
            onClick={() => fetchDashboardData()}
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={13} />}
          >
            Retry Telemetry
          </Button>
        </AppCard>
      </div>
    );
  }

  if (!data.connected) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 pb-12">
        <h1 className="text-3xl font-black text-foreground tracking-tight font-display">Meta Integration Hub</h1>
        <AppCard className="p-8 text-center space-y-6 flex flex-col items-center max-w-2xl mx-auto">
          <div className="h-14 w-14 bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 rounded-2xl flex items-center justify-center animate-pulse">
            <Shield size={28} />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-lg font-bold text-foreground">Connect Facebook Meta Integration</h3>
            <p className="text-xs text-muted leading-relaxed">
              Link your Meta developer application to synchronize live lead forms, audit active campaign metrics, view real-time webhook status, and perform diagnostic checks.
            </p>
          </div>
          <Link href="/client/integrations/google-sheets">
            <Button icon={<ExternalLink size={14} />}>
              Link Meta Ad Account
            </Button>
          </Link>
        </AppCard>
      </div>
    );
  }

  const { overviewMetrics, connectionCard, diagnostics, campaigns, adsets, ads, forms, leads } = data;
  const isApiAvailable = data.apiAvailable !== false;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight font-display flex items-center gap-3">
            Meta Command Center
            <Badge variant={isApiAvailable ? 'success' : 'danger'} dot>
              {isApiAvailable ? 'API Connected' : 'API Offline'}
            </Badge>
          </h1>
          <p className="text-muted text-xs font-semibold mt-1">
            Connected Ad Account: <span className="font-bold text-[#3B82F6]">{connectionCard?.connectedAdAccount?.name || '—'}</span> &bull; {connectionCard?.connectedBusiness?.name || '—'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`h-2 w-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[10px] text-muted font-bold uppercase tracking-wider hidden sm:inline">
            {socketConnected ? 'Real-Time Sync Ready' : 'Socket Reconnecting'}
          </span>
          <Button
            onClick={() => fetchDashboardData(true)}
            variant="secondary"
            size="sm"
            loading={refreshing}
            icon={<RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />}
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Main Tab Links */}
      <div className="flex overflow-x-auto gap-1 border-b border-border pb-px scrollbar-none select-none">
        {['Overview', 'Campaigns', 'Adsets', 'Ads', 'Forms', 'Leads', 'Diagnostics', 'Real-Time Feed'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest border-b-2 transition-premium cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/5'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ── Tab Views ── */}
      
      {/* 1. Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {!isApiAvailable || !overviewMetrics ? (
              <AppCard className="p-12 text-center text-muted">
                <Info size={40} className="mx-auto text-muted/50 mb-3" />
                <p className="font-bold text-foreground">No metrics logs available</p>
                <p className="text-xs mt-1">Check settings connection validation keys in the diagnostics tab.</p>
              </AppCard>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <MetricCard
                  title="Total Ad Spend"
                  value={`${connectionCard?.connectedAdAccount?.currency === 'INR' ? '₹' : '$'}${overviewMetrics.spend.toLocaleString()}`}
                  subtext="Spent across campaigns"
                  icon={<Wallet size={16} />}
                  accentColor="#8B5CF6"
                  sparkline={[2000, 2500, 3100, 3000, 4200, 5000, overviewMetrics.spend]}
                />
                <MetricCard
                  title="Reach"
                  value={overviewMetrics.reach.toLocaleString()}
                  subtext="Unique user impressions"
                  icon={<Globe size={16} />}
                  accentColor="#3B82F6"
                  sparkline={[15000, 22000, 29000, 35000, 48000, overviewMetrics.reach]}
                />
                <MetricCard
                  title="Total Leads Capture"
                  value={overviewMetrics.leads.toLocaleString()}
                  subtext="Direct webhook captures"
                  icon={<Users size={16} />}
                  accentColor="#10B981"
                  sparkline={[50, 75, 92, 110, 142, 160, overviewMetrics.leads]}
                />
                <MetricCard
                  title="Impressions"
                  value={overviewMetrics.impressions.toLocaleString()}
                  subtext="Total display counts"
                  icon={<Eye size={16} />}
                  accentColor="#6366F1"
                />
                <MetricCard
                  title="Average CTR"
                  value={`${overviewMetrics.ctr.toFixed(2)}%`}
                  subtext="Click-through ratio"
                  icon={<MousePointerClick size={16} />}
                  accentColor="#F59E0B"
                />
                <MetricCard
                  title="Cost Per Lead (CPL)"
                  value={`${connectionCard?.connectedAdAccount?.currency === 'INR' ? '₹' : '$'}${overviewMetrics.costPerLead.toFixed(2)}`}
                  subtext="Spend efficiency"
                  icon={<Target size={16} />}
                  accentColor="#EF4444"
                />
              </div>
            )}
          </div>

          {/* Connection Profile Panel */}
          <AppCard className="p-6">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-widest flex items-center gap-2 mb-6 pb-3 border-b border-border/80">
              <ShieldCheck className="text-[#3B82F6]" size={15} />
              Connection Profile
            </h3>
            <div className="space-y-4 text-xs font-semibold text-muted">
              <div>
                <span className="text-[9px] text-muted/60 uppercase block mb-1">Connected User</span>
                <div className="flex items-center gap-2 text-foreground">
                  <User size={13} className="text-indigo-400" />
                  <span>{connectionCard?.connectedUser?.name || '—'}</span>
                </div>
              </div>
              <div>
                <span className="text-[9px] text-muted/60 uppercase block mb-1">Business Account</span>
                <div className="text-foreground">{connectionCard?.connectedBusiness?.name || '—'}</div>
                <div className="text-[9px] text-muted font-mono mt-0.5">ID: {connectionCard?.connectedBusiness?.id || '—'}</div>
              </div>
              <div>
                <span className="text-[9px] text-muted/60 uppercase block mb-1">Ad Account Ref</span>
                <div className="text-foreground">{connectionCard?.connectedAdAccount?.name || '—'}</div>
                <div className="text-[9px] text-muted font-mono mt-0.5">ID: {connectionCard?.connectedAdAccount?.id || '—'}</div>
                <div className="flex items-center gap-3 mt-1.5">
                  <Badge variant="secondary">{connectionCard?.connectedAdAccount?.currency || '—'}</Badge>
                  <span className="text-[9px] text-muted/50">{connectionCard?.connectedAdAccount?.timezone || '—'}</span>
                </div>
              </div>
              <div>
                <span className="text-[9px] text-muted/60 uppercase block mb-1">Token Validity</span>
                <Badge variant={(connectionCard?.daysRemaining ?? 0) > 15 ? 'success' : 'warning'}>
                  {connectionCard?.daysRemaining} Days Remaining
                </Badge>
              </div>
            </div>
          </AppCard>
        </div>
      )}

      {/* 2. Campaigns Tab */}
      {activeTab === 'Campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!campaigns || campaigns.length === 0 ? (
            <div className="col-span-full text-center text-text-secondary py-12 font-medium bg-card rounded-3xl border border-border">
              No active campaigns discovered.
            </div>
          ) : (
            campaigns.map((camp) => (
              <AppCard 
                key={camp.id} 
                className="cursor-pointer border hover:border-primary/20 transition-all flex flex-col justify-between"
                onClick={() => setSelectedCampaign(camp)}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-white text-xs truncate max-w-[190px]" title={camp.name}>
                      {camp.name}
                    </h3>
                    <Badge variant={camp.status === 'ACTIVE' ? 'success' : 'secondary'} dot>
                      {camp.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                    <span>Objective</span>
                    <span className="text-white">{camp.objective}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-text-secondary border-t border-border/50 pt-3.5">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider block text-text-secondary/70">Spend</span>
                      <span className="text-white">₹{camp.spend.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider block text-text-secondary/70">Leads</span>
                      <span className="text-primary font-bold">{camp.leads}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider block text-text-secondary/70">CPL</span>
                      <span className="text-success font-bold">₹{camp.costPerLead.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </AppCard>
            ))
          )}
        </div>
      )}

      {/* 3. Adsets Tab */}
      {activeTab === 'Adsets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!adsets || adsets.length === 0 ? (
            <div className="col-span-full text-center text-text-secondary py-12 font-medium bg-card rounded-3xl border border-border">
              No active adsets discovered.
            </div>
          ) : (
            adsets.map((adset) => (
              <AppCard 
                key={adset.id} 
                className="cursor-pointer border hover:border-primary/20 transition-all flex flex-col justify-between"
                onClick={() => setSelectedAdset(adset)}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-white text-xs truncate max-w-[190px]" title={adset.name}>
                      {adset.name}
                    </h3>
                    <Badge variant={adset.status === 'ACTIVE' ? 'success' : 'secondary'} dot>
                      {adset.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                    <span>Daily Budget</span>
                    <span className="text-white font-mono">₹{adset.dailyBudget.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-text-secondary border-t border-border/50 pt-3.5">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider block text-text-secondary/70">Spend</span>
                      <span className="text-white">₹{adset.spend.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider block text-text-secondary/70">Leads</span>
                      <span className="text-primary font-bold">{adset.leads}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider block text-text-secondary/70">Reach</span>
                      <span className="text-white">{adset.reach.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </AppCard>
            ))
          )}
        </div>
      )}

      {/* 4. Ads Tab */}
      {activeTab === 'Ads' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!ads || ads.length === 0 ? (
            <div className="col-span-full text-center text-text-secondary py-12 font-medium bg-card rounded-3xl border border-border">
              No active ad creatives discovered.
            </div>
          ) : (
            ads.map((ad) => (
              <AppCard 
                key={ad.id} 
                className="cursor-pointer border hover:border-primary/20 transition-all flex flex-col justify-between"
                onClick={() => setSelectedAd(ad)}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-white text-xs truncate max-w-[190px]" title={ad.name}>
                      {ad.name}
                    </h3>
                    <Badge variant={ad.status === 'ACTIVE' ? 'success' : 'secondary'} dot>
                      {ad.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-text-secondary border-t border-border/50 pt-3.5">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider block text-text-secondary/70">Spend</span>
                      <span className="text-white">₹{ad.spend.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider block text-text-secondary/70">Leads</span>
                      <span className="text-primary font-bold">{ad.leads}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider block text-text-secondary/70">Clicks</span>
                      <span className="text-white">{ad.clicks.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </AppCard>
            ))
          )}
        </div>
      )}

      {/* 5. Forms Tab */}
      {activeTab === 'Forms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!forms || forms.length === 0 ? (
            <div className="col-span-full text-center text-text-secondary py-12 font-medium bg-card rounded-3xl border border-border">
              No active Lead Gen Forms discovered.
            </div>
          ) : (
            forms.map((form) => (
              <AppCard 
                key={form.id} 
                className="cursor-pointer border hover:border-primary/20 transition-all flex flex-col justify-between"
                onClick={() => setSelectedForm(form)}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-white text-xs truncate" title={form.name}>
                      {form.name}
                    </h3>
                    <p className="text-[9px] text-text-secondary font-mono mt-1 font-bold">ID: {form.id}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-text-secondary border-t border-border/50 pt-3.5">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider block text-text-secondary/70">Created Date</span>
                      <span className="text-white">{new Date(form.createdTime).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider block text-text-secondary/70">Total Leads</span>
                      <span className="text-primary font-bold">{form.leadsCount} Leads</span>
                    </div>
                  </div>
                </div>
              </AppCard>
            ))
          )}
        </div>
      )}

      {/* 6. Leads Tab */}
      {activeTab === 'Leads' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!leads || leads.length === 0 ? (
            <div className="col-span-full text-center text-text-secondary py-12 font-medium bg-card rounded-3xl border border-border">
              No synced leads discovered.
            </div>
          ) : (
            leads.map((lead) => (
              <AppCard 
                key={lead.id} 
                className="cursor-pointer border hover:border-primary/20 transition-all flex flex-col justify-between"
                onClick={() => setSelectedLead(lead)}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-primary text-xs truncate max-w-[190px]">
                      {lead.name}
                    </h3>
                    <Badge variant="secondary">{lead.source}</Badge>
                  </div>
                  <div className="space-y-1.5 text-xs font-semibold text-text-secondary">
                    <div className="flex justify-between">
                      <span>Phone</span>
                      <span className="text-white">{lead.phone || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email</span>
                      <span className="text-white truncate max-w-[170px]" title={lead.email}>{lead.email || '—'}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-text-secondary border-t border-border/50 pt-3 font-bold">
                    <span>{new Date(lead.createdTime).toLocaleDateString()}</span>
                    <span className="text-primary hover:underline">View details →</span>
                  </div>
                </div>
              </AppCard>
            ))
          )}
        </div>
      )}

      {/* 7. Diagnostics Tab */}
      {activeTab === 'Diagnostics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AppCard className="p-6">
              <h3 className="text-sm font-extrabold text-foreground uppercase tracking-widest flex items-center gap-2 mb-6">
                <ShieldCheck size={16} className="text-[#3B82F6]" />
                Technical Operations Audits
              </h3>

              <div className="space-y-3.5">
                <div className="flex justify-between items-center p-4 rounded-2xl border border-border/80 bg-muted/5">
                  <div>
                    <h4 className="font-bold text-foreground text-xs">Webhook Status</h4>
                    <p className="text-[10px] text-muted font-medium mt-0.5">Live callbacks node validation</p>
                  </div>
                  <Badge variant={diagnostics?.webhookStatus === 'CONNECTED' ? 'success' : 'danger'} dot>
                    {diagnostics?.webhookStatus || 'UNKNOWN'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-4 rounded-2xl border border-border/80 bg-muted/5">
                  <div>
                    <h4 className="font-bold text-foreground text-xs">Page Token Status</h4>
                    <p className="text-[10px] text-muted font-medium mt-0.5">Access permission signature</p>
                  </div>
                  <Badge variant={diagnostics?.pageTokenStatus === 'VALID' ? 'success' : 'danger'} dot>
                    {diagnostics?.pageTokenStatus || 'UNKNOWN'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-4 rounded-2xl border border-border/80 bg-muted/5">
                  <div>
                    <h4 className="font-bold text-foreground text-xs">User Authentication Status</h4>
                    <p className="text-[10px] text-muted font-medium mt-0.5">Facebook OAuth token credentials</p>
                  </div>
                  <Badge variant={diagnostics?.userTokenStatus === 'ACTIVE' ? 'success' : 'danger'} dot>
                    {diagnostics?.userTokenStatus || 'UNKNOWN'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-4 rounded-2xl border border-border/80 bg-muted/5">
                  <div>
                    <h4 className="font-bold text-foreground text-xs">Queue Health</h4>
                    <p className="text-[10px] text-muted font-medium mt-0.5">BullMQ processor background worker</p>
                  </div>
                  <Badge variant={diagnostics?.queueHealth === 'HEALTHY' ? 'success' : 'danger'} dot>
                    {diagnostics?.queueHealth || 'UNAVAILABLE'}
                  </Badge>
                </div>
              </div>
            </AppCard>

            <AppCard className="p-6">
              <h4 className="font-extrabold text-foreground text-xs uppercase tracking-widest mb-4">Permissions Granted Scopes</h4>
              <div className="flex flex-wrap gap-2">
                {!diagnostics?.permissionsGranted || diagnostics.permissionsGranted.length === 0 ? (
                  <span className="text-muted text-xs italic font-medium">No permission scopes detected.</span>
                ) : (
                  diagnostics.permissionsGranted.map((p: any, idx: number) => (
                    <span
                      key={idx}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold font-mono tracking-tight flex items-center gap-1.5 ${
                        p.status === 'granted'
                          ? 'bg-[#10B981]/5 border-[#10B981]/25 text-[#10B981]'
                          : 'bg-[#EF4444]/5 border-[#EF4444]/25 text-[#EF4444]'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${p.status === 'granted' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                      {p.permission}
                    </span>
                  ))
                )}
              </div>
            </AppCard>
          </div>

          {/* Sync Stats */}
          <AppCard className="p-6 h-fit space-y-5">
            <h3 className="text-xs font-extrabold text-foreground uppercase tracking-widest pb-3 border-b border-border/80">
              Sync Diagnostics
            </h3>
            <div className="space-y-4 text-xs font-semibold text-muted">
              <div className="flex justify-between items-center">
                <span>Failed Sync Jobs</span>
                <span className="text-foreground">{diagnostics?.failedJobs || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Dead Letter Queue Count</span>
                <span className="text-foreground">{diagnostics?.deadLetterQueueCount || 0}</span>
              </div>
              <div className="pt-3 border-t border-border/80">
                <span className="text-[9px] text-muted/60 uppercase block mb-1">Last Successful Sync</span>
                <div className="text-foreground">
                  {diagnostics?.lastSuccessfulSync ? new Date(diagnostics.lastSuccessfulSync).toLocaleString() : 'Never'}
                </div>
              </div>
            </div>
          </AppCard>
        </div>
      )}

      {/* 8. Real-Time Feed Tab */}
      {activeTab === 'Real-Time Feed' && (
        <AppCard className="p-6 max-w-3xl mx-auto space-y-6">
          <div className="flex justify-between items-center border-b border-border/80 pb-4">
            <div>
              <h2 className="text-sm font-extrabold text-foreground uppercase tracking-widest flex items-center gap-2">
                <Clock size={16} className="text-[#3B82F6]" />
                Live Connection Event Stream
              </h2>
              <p className="text-xs text-muted mt-1">Real-time callbacks captured via active Socket.IO connection</p>
            </div>
            <Button
              onClick={() => setEventsList([])}
              variant="secondary"
              size="sm"
            >
              Clear Log
            </Button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            {eventsList.length === 0 ? (
              <div className="py-12 text-center text-muted text-xs italic font-medium">
                No events streamed yet. Trigger lead inputs to receive socket payloads.
              </div>
            ) : (
              eventsList.map((evt) => (
                <div key={evt.id} className="flex gap-4 p-3.5 rounded-2xl border border-border/60 bg-muted/5 text-xs items-start">
                  <span className="text-muted/60 font-mono font-bold whitespace-nowrap mt-0.5">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                  <div className="space-y-1">
                    <Badge variant="info" className="px-2 py-0.5 text-[8.5px]">
                      {evt.type}
                    </Badge>
                    <p className="text-foreground/90 font-medium">{evt.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </AppCard>
      )}

      {/* Slide-over Lead Detail Drawer */}
      <Drawer
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title="Lead Summary details"
        size="sm"
      >
        {selectedLead && (
          <div className="space-y-6 text-xs font-semibold text-text-secondary">
            <div className="border-b border-border/80 pb-5">
              <Badge variant="info" className="mb-2">Captured lead</Badge>
              <h3 className="text-lg font-black text-white">{selectedLead.name}</h3>
              <p className="text-[10px] text-text-secondary mt-1">Capture timestamp: {new Date(selectedLead.createdTime).toLocaleString()}</p>
            </div>
 
            <div className="space-y-3.5">
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Email Address</span>
                <span className="text-white">{selectedLead.email || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Phone Number</span>
                <span className="text-white">{selectedLead.phone || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Campaign</span>
                <span className="text-white truncate max-w-[200px]" title={selectedLead.campaign}>{selectedLead.campaign || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Adset Group</span>
                <span className="text-white truncate max-w-[200px]" title={selectedLead.adset}>{selectedLead.adset || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Ad Creative</span>
                <span className="text-white">{selectedLead.ad || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Form ID</span>
                <span className="text-primary font-mono font-bold">{selectedLead.form || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Meta Lead ID</span>
                <span className="text-white font-mono">{selectedLead.metaLeadId || '—'}</span>
              </div>
            </div>
 
            <div className="pt-4">
              <Button
                onClick={() => setSelectedLead(null)}
                variant="secondary"
                className="w-full"
              >
                Close Profile
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Slide-over Campaign Detail Drawer */}
      <Drawer
        isOpen={!!selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        title="Campaign Specifications"
        size="sm"
      >
        {selectedCampaign && (
          <div className="space-y-6 text-xs font-semibold text-text-secondary">
            <div className="border-b border-border/80 pb-5">
              <Badge variant={selectedCampaign.status === 'ACTIVE' ? 'success' : 'secondary'} className="mb-2">
                {selectedCampaign.status}
              </Badge>
              <h3 className="text-lg font-black text-white">{selectedCampaign.name}</h3>
              <p className="text-[10px] text-text-secondary mt-1">Campaign Objective: {selectedCampaign.objective}</p>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Aggregate Spend</span>
                <span className="text-white">₹{selectedCampaign.spend.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Reach Count</span>
                <span className="text-white">{selectedCampaign.reach.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Synced Leads</span>
                <span className="text-primary font-bold">{selectedCampaign.leads} Leads</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">CTR (Click-Through Rate)</span>
                <span className="text-white">{selectedCampaign.ctr.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Cost Per Lead (CPL)</span>
                <span className="text-success font-bold">₹{selectedCampaign.costPerLead.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={() => setSelectedCampaign(null)}
                variant="secondary"
                className="w-full"
              >
                Close Summary
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Slide-over Adset Detail Drawer */}
      <Drawer
        isOpen={!!selectedAdset}
        onClose={() => setSelectedAdset(null)}
        title="Adset Metrics"
        size="sm"
      >
        {selectedAdset && (
          <div className="space-y-6 text-xs font-semibold text-text-secondary">
            <div className="border-b border-border/80 pb-5">
              <Badge variant={selectedAdset.status === 'ACTIVE' ? 'success' : 'secondary'} className="mb-2">
                {selectedAdset.status}
              </Badge>
              <h3 className="text-lg font-black text-white">{selectedAdset.name}</h3>
              <p className="text-[10px] text-text-secondary mt-1">ID: {selectedAdset.id}</p>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Daily Budget Limit</span>
                <span className="text-white font-mono">₹{selectedAdset.dailyBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Cumulative Spends</span>
                <span className="text-white">₹{selectedAdset.spend.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Synced Leads</span>
                <span className="text-primary font-bold">{selectedAdset.leads} Leads</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Unique User Reach</span>
                <span className="text-white">{selectedAdset.reach.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={() => setSelectedAdset(null)}
                variant="secondary"
                className="w-full"
              >
                Close Metrics
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Slide-over Ad Creative Detail Drawer */}
      <Drawer
        isOpen={!!selectedAd}
        onClose={() => setSelectedAd(null)}
        title="Ad Creative Performance"
        size="sm"
      >
        {selectedAd && (
          <div className="space-y-6 text-xs font-semibold text-text-secondary">
            <div className="border-b border-border/80 pb-5">
              <Badge variant={selectedAd.status === 'ACTIVE' ? 'success' : 'secondary'} className="mb-2">
                {selectedAd.status}
              </Badge>
              <h3 className="text-lg font-black text-white">{selectedAd.name}</h3>
              <p className="text-[10px] text-text-secondary mt-1">ID: {selectedAd.id}</p>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Spent Budget</span>
                <span className="text-white">₹{selectedAd.spend.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Synced Leads</span>
                <span className="text-primary font-bold">{selectedAd.leads} Leads</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Clicks Recorded</span>
                <span className="text-white">{selectedAd.clicks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">CTR (Click-Through Rate)</span>
                <span className="text-white">{selectedAd.ctr.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Unique Reach</span>
                <span className="text-white">{selectedAd.reach.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={() => setSelectedAd(null)}
                variant="secondary"
                className="w-full"
              >
                Close Metrics
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Slide-over Lead Gen Form Detail Drawer */}
      <Drawer
        isOpen={!!selectedForm}
        onClose={() => setSelectedForm(null)}
        title="Meta Form Telemetry"
        size="sm"
      >
        {selectedForm && (
          <div className="space-y-6 text-xs font-semibold text-text-secondary">
            <div className="border-b border-border/80 pb-5">
              <Badge variant="success" className="mb-2">Live Sync Listener</Badge>
              <h3 className="text-lg font-black text-white">{selectedForm.name}</h3>
              <p className="text-[9px] text-text-secondary font-mono mt-1 font-bold">ID: {selectedForm.id}</p>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Created Date</span>
                <span className="text-white">{new Date(selectedForm.createdTime).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-text-secondary/70">Synced Lead Count</span>
                <span className="text-primary font-bold">{selectedForm.leadsCount} Leads</span>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={() => setSelectedForm(null)}
                variant="secondary"
                className="w-full"
              >
                Close Summary
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

