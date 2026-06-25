'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams, notFound } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Client, MetaTokenStatus } from '../../../../types';
import { useSocket } from '../../../../hooks/useSocket';
import { AppCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stepper } from '@/components/ui/stepper';
import { TableContainer, Table, TableRow, TableCell } from '@/components/ui/table';
import { 
  Database, ArrowLeftRight, Calendar, AlertCircle, CheckCircle2, RotateCw, 
  TrendingUp, Building2, Facebook, Key, Activity, Shield, ShieldCheck, 
  ShieldAlert, Users, BarChart3, Wallet, Layers, Grid, ChevronRight, 
  Info, ExternalLink, Sliders, Play, Pause, Globe, Target, Eye, 
  MousePointerClick, X, DollarSign, FileText, Clock, User, CheckCircle, AlertTriangle
} from 'lucide-react';

// ─── Status Badge Component ───────────────────────────────────────────────────
function MetaStatusBadge({ status }: { status: MetaTokenStatus | null | undefined }) {
  const configs: Record<MetaTokenStatus, { label: string; className: string; dot: string }> = {
    CONNECTED:    { label: 'Connected',    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    EXPIRED:      { label: 'Expired',      className: 'bg-red-500/10 text-red-400 border-red-500/20',             dot: 'bg-red-400' },
    DISCONNECTED: { label: 'Disconnected', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',          dot: 'bg-zinc-400' },
    ERROR:        { label: 'Error',        className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',    dot: 'bg-orange-400' },
    PENDING:      { label: 'Not Connected', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',     dot: 'bg-amber-400' },
  };

  const cfg = configs[status ?? 'PENDING'];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'CONNECTED' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
}

// ─── Time Ago Helper ──────────────────────────────────────────────────────────
function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [clientUpdateError, setClientUpdateError] = useState<string | null>(null);
  const [notFoundTriggered, setNotFoundTriggered] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Leads state
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);

  if (notFoundTriggered) {
    notFound();
  }

  // Edit fields
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [metaPageId, setMetaPageId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [connectingMeta, setConnectingMeta] = useState(false);

  // Meta Dashboard Telemetry State
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  
  const { socket, connected: socketConnected } = useSocket();
  const [activeTab, setActiveTab] = useState('Overview');
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  // Meta connection selection options
  const [adAccounts, setAdAccounts] = useState<Array<{ id: string; name: string; account_id?: string; accountId?: string; access_token?: string }>>([]);
  const [pages, setPages] = useState<Array<{ id: string; name: string; access_token: string; category?: string; followers?: number }>>([]);
  const [selectedAdAccountId, setSelectedAdAccountId] = useState('');
  const [selectedPageId, setSelectedPageId] = useState('');
  const [savingMetaConfig, setSavingMetaConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);

  // Google Sheets state
  const [googleConn, setGoogleConn] = useState<any>(null);
  const [checkingGoogleStatus, setCheckingGoogleStatus] = useState(true);
  const [activeGoogleConnection, setActiveGoogleConnection] = useState<any>(null);

  // Selector dropdowns state
  const [googleSpreadsheets, setGoogleSpreadsheets] = useState<{ id: string; name: string }[]>([]);
  const [loadingGoogleSpreadsheets, setLoadingGoogleSpreadsheets] = useState(false);
  const [selectedGoogleSpreadsheetId, setSelectedGoogleSpreadsheetId] = useState('');
  
  const [googleSheets, setGoogleSheets] = useState<{ name: string }[]>([]);
  const [loadingGoogleSheets, setLoadingGoogleSheets] = useState(false);
  const [selectedGoogleSheetName, setSelectedGoogleSheetName] = useState('');

  // Headers list for mappings
  const [googleHeaders, setGoogleHeaders] = useState<string[]>([]);
  const [loadingGoogleHeaders, setLoadingGoogleHeaders] = useState(false);

  // Mapping state
  const [googleFieldMappings, setGoogleFieldMappings] = useState<Record<string, string>>({
    name: '',
    email: '',
    phone: '',
    source: '',
    city: '',
  });

  // Sync intervals
  const [googleSyncInterval, setGoogleSyncInterval] = useState(300);
  const [savingGoogleConnection, setSavingGoogleConnection] = useState(false);

  // Manual sync and stats
  const [googleSyncingNow, setGoogleSyncingNow] = useState(false);
  const [googleSyncStats, setGoogleSyncStats] = useState<{
    totalRows: number;
    importedRows: number;
    duplicateRows: number;
    failedRows: number;
  } | null>(null);

  // Logs state
  const [googleHistory, setGoogleHistory] = useState<any[]>([]);
  const [loadingGoogleHistory, setLoadingGoogleHistory] = useState(false);

  const [googleErrorMsg, setGoogleErrorMsg] = useState<string | null>(null);
  const [googleSuccessMsg, setGoogleSuccessMsg] = useState<string | null>(null);
  const [googleSetupStep, setGoogleSetupStep] = useState(1);

  // Toast notifications state
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'warning' | 'error' }>>([]);

  const addToast = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Refs for tracking leads and sync history logs to prevent stale closures and timer resets
  const leadsRef = React.useRef<any[]>([]);
  const googleHistoryRef = React.useRef<any[]>([]);
  const isInitialLeadsLoaded = React.useRef(false);
  const isInitialHistoryLoaded = React.useRef(false);

  React.useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  React.useEffect(() => {
    googleHistoryRef.current = googleHistory;
  }, [googleHistory]);

  // Link by URL state
  const [googleConnectMode, setGoogleConnectMode] = useState<'drive' | 'url'>('drive');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [googleFetchingUrlInfo, setGoogleFetchingUrlInfo] = useState(false);
  const [googleResolvedSpreadsheetName, setGoogleResolvedSpreadsheetName] = useState('');

  const fetchClient = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/v1/agency/clients`, {
        params: { includeDeleted: true }
      });
      const clientRecord = response.data.data.find((c: Client) => c.id === clientId);

      if (!clientRecord) {
        setNotFoundTriggered(true);
        return;
      }

      setClient(clientRecord);
      setBusinessName(clientRecord.businessName);
      setEmail(clientRecord.email);
      setMetaPageId(clientRecord.metaPageId || '');
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFoundTriggered(true);
      } else {
        setError(err.message || 'Failed to load client details.');
      }
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const loadMetaDashboardData = useCallback(async () => {
    try {
      setLoadingDashboard(true);
      setDashboardError(null);
      const res = await api.get(`/v1/meta/dashboard`, {
        params: { clientId }
      });
      const data = res.data.data;
      setDashboardData(data);
      if (data) {
        setAdAccounts(data.adAccounts || []);
        setPages(data.pages || []);
        setSelectedAdAccountId(data.connectionCard?.connectedAdAccount?.id || '');
        setSelectedPageId(data.connectionCard?.connectedPage?.id || '');
      }
    } catch (err: any) {
      console.error('Failed to load Meta dashboard telemetry:', err);
      setDashboardError(err.response?.data?.error?.message || 'Failed to load Meta integration diagnostics.');
    } finally {
      setLoadingDashboard(false);
    }
  }, [clientId]);

  const fetchClientLeads = useCallback(async () => {
    try {
      setLoadingLeads(true);
      setLeadsError(null);
      const res = await api.get(`/v1/leads`, {
        params: { clientId, limit: 100 },
      });
      setLeads(res.data.data || []);
      isInitialLeadsLoaded.current = true;
    } catch (err: any) {
      console.error(err);
      setLeadsError('Failed to load client leads.');
    } finally {
      setLoadingLeads(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchClient();
      fetchClientLeads();
    }
  }, [clientId, fetchClient, fetchClientLeads]);

  // Show success banner when redirected back after Meta OAuth
  useEffect(() => {
    if (searchParams.get('meta_connected') === 'true') {
      setSuccessBanner('Meta Ad Account successfully connected! Lead sync is now active.');
      // Re-fetch to get fresh token status
      fetchClient();
    }
  }, [searchParams, fetchClient]);

  useEffect(() => {
    if (client?.metaTokenStatus === 'CONNECTED') {
      loadMetaDashboardData();
    }
  }, [client, loadMetaDashboardData]);

  useEffect(() => {
    if (!socket) return;

    const appendEvent = (type: string, message: string) => {
      const newEvent = {
        id: Math.random().toString(),
        type,
        message,
        timestamp: new Date().toISOString(),
      };
      setEventsList((prev) => [newEvent, ...prev].slice(0, 50));
    };

    const handleNewLead = (payload: any) => {
      console.log('🔌 [Socket] New lead received:', payload);
      const leadPayload = payload.lead || payload;
      
      appendEvent(
        'New Lead Received',
        `Lead "${leadPayload.name || 'Meta Lead'}" synced from campaign "${leadPayload.campaignName || '—'}"`
      );

      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch (e) {}

      if (Notification.permission === 'granted') {
        new Notification('New Meta Lead Sync 🔔', {
          body: `${leadPayload.name || 'Lead Name'} is synchronized.`,
        });
      }

      loadMetaDashboardData();
    };

    const handleWebhookReceived = (payload: any) => {
      console.log('🔌 [Socket] Webhook event received:', payload);
      appendEvent(
        'Webhook Received',
        `Meta webhook triggered for Form ID: ${payload.formId || '—'}`
      );
    };

    const handleCampaignUpdated = (payload: any) => {
      console.log('🔌 [Socket] Campaign updated:', payload);
      appendEvent(
        'Campaign Updated',
        `Campaign telemetry updated: ${payload.count || 0} active campaigns`
      );
    };

    const handleAdsetUpdated = (payload: any) => {
      console.log('🔌 [Socket] Adset updated:', payload);
      appendEvent(
        'Adset Updated',
        `Adset configuration synchronized: ${payload.count || 0} active sets`
      );
    };

    const handleTokenRefreshed = (payload: any) => {
      console.log('🔌 [Socket] Token refreshed:', payload);
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
  }, [socket, loadMetaDashboardData]);

  const handleAutoSaveMetaConfig = async (newAdAccountId?: string, newPageId?: string) => {
    try {
      setSavingMetaConfig(true);
      setMetaError(null);
      setConfigSuccess(null);

      const targetAdAccountId = newAdAccountId !== undefined ? newAdAccountId : selectedAdAccountId;
      const targetPageId = newPageId !== undefined ? newPageId : selectedPageId;

      const selectedAcct = adAccounts.find((a) => a.id === targetAdAccountId || a.accountId === targetAdAccountId);
      const selectedPg = pages.find((p) => p.id === targetPageId);

      if (!selectedAcct || !selectedPg) {
        return;
      }

      await api.post(`/v1/agency/clients/${clientId}/meta/config`, {
        metaAdAccountId: selectedAcct.id,
        metaAdAccountName: selectedAcct.name,
        metaPageId: selectedPg.id,
        metaPageName: selectedPg.name,
        metaPageAccessToken: selectedPg.access_token,
      });

      addToast('Meta integration settings updated successfully!', 'success');
      fetchClient();
      loadMetaDashboardData();
    } catch (err: any) {
      setMetaError(err.response?.data?.error?.message || err.message || 'Failed to auto-save configuration.');
    } finally {
      setSavingMetaConfig(false);
    }
  };

  const handleAutoSaveClientInfo = async (field: string, value: string) => {
    if (!value.trim()) return;
    try {
      setIsUpdating(true);
      setClientUpdateError(null);
      const payload = {
        businessName: field === 'businessName' ? value : businessName,
        email: field === 'email' ? value : email,
      };

      const response = await api.put(`/v1/agency/clients/${clientId}`, payload);
      setClient(response.data.data);
      addToast('Client details saved automatically.', 'success');
    } catch (err: any) {
      setClientUpdateError(err.response?.data?.error?.message || 'Failed to auto-save client details.');
      addToast('Failed to auto-save client details.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdAccountChange = (val: string) => {
    setSelectedAdAccountId(val);
    handleAutoSaveMetaConfig(val, undefined);
  };

  const handlePageChange = (val: string) => {
    setSelectedPageId(val);
    handleAutoSaveMetaConfig(undefined, val);
  };

  const handleMetaConnect = async () => {
    try {
      setMetaError(null);
      setConnectingMeta(true);
      const response = await api.get(`/v1/agency/clients/${clientId}/meta-connect`);
      const { oauthUrl } = response.data.data;

      if (oauthUrl) {
        window.location.href = oauthUrl;
      } else {
        throw new Error('OAuth link could not be generated.');
      }
    } catch (err: any) {
      setMetaError(err.response?.data?.error?.message || err.message || 'Failed to initiate Meta OAuth.');
      setConnectingMeta(false);
    }
  };

  const handleMetaDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this Meta Account? All connected ad account settings and webhook page routings will be cleared.')) {
      return;
    }
    try {
      setLoadingDashboard(true);
      await api.delete(`/v1/agency/clients/${clientId}/meta`);
      setDashboardData(null);
      addToast('Meta Account disconnected successfully.', 'success');
      await fetchClient();
    } catch (err: any) {
      addToast(err.response?.data?.error?.message || err.message || 'Failed to disconnect Meta Account.', 'error');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchGoogleSpreadsheets = async () => {
    try {
      setLoadingGoogleSpreadsheets(true);
      const res = await api.get(`/v1/agency/clients/${clientId}/google/spreadsheets`);
      setGoogleSpreadsheets(res.data.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingGoogleSpreadsheets(false);
    }
  };

  const loadGoogleSyncHistory = async () => {
    try {
      setLoadingGoogleHistory(true);
      const res = await api.get(`/v1/agency/clients/${clientId}/google/history`);
      setGoogleHistory(res.data.data || []);
      isInitialHistoryLoaded.current = true;
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGoogleHistory(false);
    }
  };

  const fetchGoogleSheetHeaders = async (spreadsheetId: string, sheetName: string) => {
    try {
      setLoadingGoogleHeaders(true);
      const res = await api.get(`/v1/agency/clients/${clientId}/google/spreadsheets/${spreadsheetId}/sheets/${encodeURIComponent(sheetName)}/headers`);
      setGoogleHeaders(res.data.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingGoogleHeaders(false);
    }
  };

  const loadGoogleStatusAndConnections = useCallback(async () => {
    try {
      setCheckingGoogleStatus(true);
      setGoogleErrorMsg(null);

      // 1. Fetch Google auth connection status
      const googleRes = await api.get(`/v1/agency/clients/${clientId}/google/status`);
      setGoogleConn(googleRes.data.data);

      if (googleRes.data.data) {
        // 2. Load connections
        const connectionsRes = await api.get(`/v1/agency/clients/${clientId}/google/connections`);
        const conn = connectionsRes.data.data[0] || null;
        setActiveGoogleConnection(conn);

        if (conn) {
          // Pre-populate mappings
          const maps: Record<string, string> = {};
          conn.mappings.forEach((m: any) => {
            maps[m.crmField] = m.sheetColumn;
          });
          setGoogleFieldMappings(maps);
          // Preload sheet headers
          fetchGoogleSheetHeaders(conn.spreadsheetId, conn.sheetName);
        } else {
          // If no connection, fetch spreadsheets list for setup
          try {
            setLoadingGoogleSpreadsheets(true);
            const res = await api.get(`/v1/agency/clients/${clientId}/google/spreadsheets`);
            setGoogleSpreadsheets(res.data.data || []);
          } catch (err: any) {
            console.error(err);
          } finally {
            setLoadingGoogleSpreadsheets(false);
          }
        }

        // 3. Load sync logs history
        try {
          setLoadingGoogleHistory(true);
          const res = await api.get(`/v1/agency/clients/${clientId}/google/history`);
          setGoogleHistory(res.data.data || []);
          isInitialHistoryLoaded.current = true;
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingGoogleHistory(false);
        }
      }
    } catch (err: any) {
      setGoogleErrorMsg(err.response?.data?.error?.message || 'Failed to verify Google connection status.');
    } finally {
      setCheckingGoogleStatus(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      loadGoogleStatusAndConnections();
    }
  }, [clientId, loadGoogleStatusAndConnections]);

  const pollLeads = useCallback(async () => {
    if (!clientId) return;
    try {
      const res = await api.get(`/v1/leads`, {
        params: { clientId, limit: 100 },
      });
      const newLeads = res.data.data || [];
      
      if (isInitialLeadsLoaded.current) {
        const existingIds = new Set(leadsRef.current.map((l: any) => l.id));
        const addedLeads = newLeads.filter((l: any) => !existingIds.has(l.id));
        
        if (addedLeads.length > 0) {
          addedLeads.forEach((lead: any) => {
            addToast(`🎉 New lead found: ${lead.name || 'Google Sheet Lead'}!`, 'success');
          });
        }
      }
      
      setLeads(newLeads);
      isInitialLeadsLoaded.current = true;
    } catch (err) {
      console.error('Error polling leads:', err);
    }
  }, [clientId, addToast]);

  const pollSyncHistory = useCallback(async () => {
    if (!clientId) return;
    try {
      const res = await api.get(`/v1/agency/clients/${clientId}/google/history`);
      const newHistory = res.data.data || [];

      if (isInitialHistoryLoaded.current) {
        const existingIds = new Set(googleHistoryRef.current.map((h: any) => h.id));
        const addedHistory = newHistory.filter((h: any) => !existingIds.has(h.id));

        if (addedHistory.length > 0) {
          addedHistory.forEach((log: any) => {
            if (log.duplicateRows > 0) {
              addToast(`⚠️ Skipped ${log.duplicateRows} duplicate lead(s) from spreadsheet sync`, 'warning');
            }
          });
        }
      }

      setGoogleHistory(newHistory);
      isInitialHistoryLoaded.current = true;
    } catch (err) {
      console.error('Error polling sync history:', err);
    }
  }, [clientId, addToast]);

  useEffect(() => {
    if (!clientId) return;
    // Set up 30 seconds polling interval
    const interval = setInterval(() => {
      pollLeads();
      pollSyncHistory();
    }, 30000);

    return () => clearInterval(interval);
  }, [clientId, pollLeads, pollSyncHistory]);

  // Show success banner when redirected back after Google OAuth
  useEffect(() => {
    if (searchParams.get('google_connected') === 'true') {
      setSuccessBanner('Google Account successfully connected! You can configure sheet synchronisation now.');
      loadGoogleStatusAndConnections();
    }
  }, [searchParams, loadGoogleStatusAndConnections]);

  const handleConnectGoogle = async () => {
    try {
      setGoogleErrorMsg(null);
      const res = await api.get(`/v1/agency/clients/${clientId}/google/connect`);
      const { oauthUrl } = res.data.data;
      if (oauthUrl) {
        window.location.href = oauthUrl;
      }
    } catch (err: any) {
      setGoogleErrorMsg(err.response?.data?.error?.message || 'Failed to initiate Google OAuth.');
    }
  };

  const handleGoogleSpreadsheetChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedGoogleSpreadsheetId(id);
    setSelectedGoogleSheetName('');
    setGoogleSheets([]);
    setGoogleHeaders([]);

    if (!id) return;

    try {
      setLoadingGoogleSheets(true);
      const res = await api.get(`/v1/agency/clients/${clientId}/google/spreadsheets/${id}/sheets`);
      setGoogleSheets(res.data.data || []);
    } catch (err: any) {
      setGoogleErrorMsg(err.response?.data?.error?.message || 'Failed to fetch spreadsheet tabs.');
    } finally {
      setLoadingGoogleSheets(false);
    }
  };

  const handleGoogleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedGoogleSheetName(name);
    if (name && selectedGoogleSpreadsheetId) {
      fetchGoogleSheetHeaders(selectedGoogleSpreadsheetId, name);
    }
  };

  const handleGoogleFetchSpreadsheetByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleErrorMsg(null);
    setGoogleSuccessMsg(null);
    setGoogleResolvedSpreadsheetName('');
    setSelectedGoogleSpreadsheetId('');
    setSelectedGoogleSheetName('');
    setGoogleSheets([]);
    setGoogleHeaders([]);

    if (!googleSheetUrl) {
      setGoogleErrorMsg('Please enter a Google Sheet URL.');
      return;
    }

    try {
      setGoogleFetchingUrlInfo(true);
      const res = await api.post(`/v1/agency/clients/${clientId}/google/connect-by-url`, { sheetUrl: googleSheetUrl });
      const { spreadsheetId, spreadsheetName, sheets } = res.data.data;

      setSelectedGoogleSpreadsheetId(spreadsheetId);
      setGoogleResolvedSpreadsheetName(spreadsheetName);
      setGoogleSheets(sheets);
      setGoogleSuccessMsg(`Successfully loaded spreadsheet: "${spreadsheetName}"`);
    } catch (err: any) {
      setGoogleErrorMsg(err.response?.data?.error?.message || 'Failed to fetch spreadsheet details. Ensure the Google account is connected and the URL is correct.');
    } finally {
      setGoogleFetchingUrlInfo(false);
    }
  };

  const handleSaveGoogleConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleErrorMsg(null);
    setGoogleSuccessMsg(null);

    let spreadsheetName = '';
    if (googleConnectMode === 'url') {
      spreadsheetName = googleResolvedSpreadsheetName;
    } else {
      const spreadsheet = googleSpreadsheets.find((s) => s.id === selectedGoogleSpreadsheetId);
      spreadsheetName = spreadsheet?.name || '';
    }

    if (!selectedGoogleSpreadsheetId || !selectedGoogleSheetName || !spreadsheetName) {
      setGoogleErrorMsg('Please select a spreadsheet and sheet name.');
      return;
    }

    if (!googleFieldMappings.name) {
      setGoogleErrorMsg('CRM Field "Customer Name" must be mapped to a spreadsheet column.');
      return;
    }

    try {
      setSavingGoogleConnection(true);

      const connRes = await api.post(`/v1/agency/clients/${clientId}/google/connections`, {
        spreadsheetId: selectedGoogleSpreadsheetId,
        spreadsheetName,
        sheetName: selectedGoogleSheetName,
        syncInterval: Number(googleSyncInterval),
        sheetUrl: googleConnectMode === 'url' ? googleSheetUrl : null,
      });

      const connectionId = connRes.data.data.id;

      const mappingsArray = Object.entries(googleFieldMappings)
        .filter(([_, sheetColumn]) => sheetColumn !== '')
        .map(([crmField, sheetColumn]) => ({ crmField, sheetColumn }));

      await api.post(`/v1/agency/clients/${clientId}/google/mappings`, {
        connectionId,
        mappings: mappingsArray,
      });

      setGoogleSuccessMsg('Google Sheet spreadsheet connection configured and activated successfully!');
      loadGoogleStatusAndConnections();
      setGoogleSetupStep(1);
    } catch (err: any) {
      setGoogleErrorMsg(err.response?.data?.error?.message || 'Failed to save configuration.');
    } finally {
      setSavingGoogleConnection(false);
    }
  };

  const handleRemoveGoogleConnection = async () => {
    if (!activeGoogleConnection) return;
    if (!confirm('Are you sure you want to disconnect this Google Sheet? Sync logs history will be preserved.')) return;

    try {
      setGoogleErrorMsg(null);
      await api.delete(`/v1/agency/clients/${clientId}/google/connections/${activeGoogleConnection.id}`);
      setGoogleSuccessMsg('Google Sheet disconnected.');
      setActiveGoogleConnection(null);
      setGoogleFieldMappings({ name: '', email: '', phone: '', source: '', city: '' });
      setSelectedGoogleSpreadsheetId('');
      setSelectedGoogleSheetName('');
      setGoogleHeaders([]);
      setGoogleSetupStep(1);
      fetchGoogleSpreadsheets();
    } catch (err: any) {
      setGoogleErrorMsg(err.response?.data?.error?.message || 'Failed to remove connection.');
    }
  };

  const handleToggleGoogleSync = async () => {
    if (!activeGoogleConnection) return;
    try {
      setGoogleErrorMsg(null);
      const nextStatus = !activeGoogleConnection.syncEnabled;
      const res = await api.patch(`/v1/agency/clients/${clientId}/google/connections/${activeGoogleConnection.id}`, {
        syncEnabled: nextStatus,
      });
      setActiveGoogleConnection(res.data.data);
      setGoogleSuccessMsg(nextStatus ? 'Spreadsheet auto-sync enabled.' : 'Spreadsheet auto-sync disabled.');
    } catch (err: any) {
      setGoogleErrorMsg(err.response?.data?.error?.message || 'Failed to toggle sync.');
    }
  };

  const handleGoogleSyncNow = async () => {
    if (!activeGoogleConnection) return;
    try {
      setGoogleErrorMsg(null);
      setGoogleSuccessMsg(null);
      setGoogleSyncStats(null);
      setGoogleSyncingNow(true);

      const res = await api.post(`/v1/agency/clients/${clientId}/google/sync-now`, {
        connectionId: activeGoogleConnection.id,
      });

      setGoogleSyncStats(res.data.data);
      setGoogleSuccessMsg('Manual synchronisation completed successfully!');
      await pollSyncHistory();
      await pollLeads();
    } catch (err: any) {
      setGoogleErrorMsg(err.response?.data?.error?.message || 'Manual synchronization execution failed.');
    } finally {
      setGoogleSyncingNow(false);
    }
  };

  const handleGoogleMappingChange = (crmField: string, value: string) => {
    setGoogleFieldMappings((prev) => ({
      ...prev,
      [crmField]: value,
    }));
  };

  const renderLeadsSection = () => {
    return (
      <AppCard className="p-6">
        <h2 className="text-sm font-extrabold text-foreground uppercase tracking-widest mb-6">Preserved Client Leads</h2>

        {loadingLeads && (
          <p className="text-muted text-xs animate-pulse">Loading preserved leads...</p>
        )}

        {!loadingLeads && leadsError && (
          <p className="text-red-500 text-xs font-bold">{leadsError}</p>
        )}

        {!loadingLeads && !leadsError && leads.length === 0 && (
          <p className="text-muted text-xs italic font-semibold">No leads found for this client.</p>
        )}

        {!loadingLeads && leads.length > 0 && (
          <TableContainer>
            <Table>
              <thead>
                <TableRow>
                  <TableCell isHeader>Customer Name</TableCell>
                  <TableCell isHeader>Phone</TableCell>
                  <TableCell isHeader>Email</TableCell>
                  <TableCell isHeader>Pipeline Stage</TableCell>
                  <TableCell isHeader>Source</TableCell>
                  <TableCell isHeader>Imported At</TableCell>
                </TableRow>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-bold text-[#3B82F6]">{lead.name}</TableCell>
                    <TableCell className="font-bold text-foreground">{lead.phone || '—'}</TableCell>
                    <TableCell className="text-muted/80">{lead.email || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={lead.stage === 'WON' ? 'success' : lead.stage === 'LOST' ? 'danger' : 'info'}>
                        {lead.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="px-2 py-0.5 text-[9px]">
                        {lead.leadSource || lead.source || 'Manual'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted/65 font-bold">
                      {new Date(lead.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
      </AppCard>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading client workspace...</p>
        </div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-sm text-red-400 text-center">
        {error}
        <button
          onClick={() => router.push('/agency/clients')}
          className="block mx-auto mt-4 text-xs underline text-indigo-400 hover:text-indigo-300"
        >
          Return to clients
        </button>
      </div>
    );
  }

  const isConnected = client?.metaTokenStatus === 'CONNECTED';
  const hasIssue = client?.metaTokenStatus === 'EXPIRED' || client?.metaTokenStatus === 'ERROR';

  if (client?.isDeleted) {
    return (
      <div className="space-y-8">
        <div>
          <button
            type="button"
            onClick={() => router.push('/agency/clients')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mb-4 flex items-center gap-1 cursor-pointer"
          >
            ← Back to Clients
          </button>
          <h1 className="text-3xl font-bold tracking-tight">{client.businessName} (Archived)</h1>
          <p className="text-slate-400 mt-1">Leads and historical records stored for {client.businessName}</p>
        </div>

        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-400">
          <span className="font-semibold block mb-1">Archived Client Account</span>
          This client was deleted. User access and sheets/ads integrations are disabled, but the leads are safely stored below.
        </div>

        {renderLeadsSection()}
      </div>
    );
  }

  const renderGoogleSheetsCard = () => {
    const steps = ['General', 'Connection', 'Configuration', 'Review'];
    const activeStep = googleSetupStep - 1;

    return (
      <AppCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Google Sheets Integration</h2>
            <p className="text-xs text-muted mt-1">
              Connect Google Sheets to automatically synchronize rows as leads in CRM.
            </p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
              googleConn
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : 'bg-muted/10 text-muted border-border'
            }`}
          >
            {googleConn ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        {/* Google Alerts */}
        {(googleErrorMsg || googleSuccessMsg) && (
          <div
            className={`mb-6 rounded-2xl p-4 text-xs border flex items-center gap-2 ${
              googleSuccessMsg
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}
          >
            {googleSuccessMsg ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span className="flex-1 font-semibold">{googleErrorMsg || googleSuccessMsg}</span>
            <button
              onClick={() => {
                setGoogleErrorMsg(null);
                setGoogleSuccessMsg(null);
              }}
              className="text-sm font-bold hover:opacity-60 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {checkingGoogleStatus ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Show Stepper if not fully configured with active connection */}
            {!activeGoogleConnection && (
              <div className="border-b border-border/60 pb-6 mb-2">
                <Stepper steps={steps} activeStep={activeStep} />
              </div>
            )}

            {/* If Google account is connected */}
            <>
              {/* Active Connection panel */}
              {activeGoogleConnection ? (
                <div className="space-y-6 pt-4 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-foreground uppercase tracking-widest">
                      Active Spreadsheet Connection
                    </h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border font-bold ${
                        activeGoogleConnection.syncEnabled
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-muted/10 text-muted border-border'
                      }`}
                    >
                      {activeGoogleConnection.syncEnabled ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-muted/5 border border-border p-4">
                      <p className="text-[10px] text-muted uppercase font-bold tracking-wider mb-1">Spreadsheet</p>
                      <p className="text-xs font-bold text-foreground truncate">{activeGoogleConnection.spreadsheetName}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/5 border border-border p-4">
                      <p className="text-[10px] text-muted uppercase font-bold tracking-wider mb-1">Sheet Tab</p>
                      <p className="text-xs font-bold text-foreground truncate">{activeGoogleConnection.sheetName}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/5 border border-border p-4">
                      <p className="text-[10px] text-muted uppercase font-bold tracking-wider mb-1">Interval</p>
                      <p className="text-xs font-bold text-foreground truncate">
                        {activeGoogleConnection.syncInterval < 60
                          ? `Every ${activeGoogleConnection.syncInterval}s`
                          : `Every ${activeGoogleConnection.syncInterval / 60}m`}
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] text-muted font-semibold">
                    📅 Last Synced:{' '}
                    <span className="text-foreground">
                      {activeGoogleConnection.lastSyncAt ? new Date(activeGoogleConnection.lastSyncAt).toLocaleString() : 'Never synced.'}
                    </span>
                  </div>

                  {/* Mappings */}
                  <div className="rounded-2xl bg-muted/5 border border-border p-4">
                    <p className="text-xs font-extrabold text-foreground uppercase tracking-widest mb-3">Column Mappings</p>
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-muted">
                      {activeGoogleConnection.mappings?.map((m: any) => (
                        <div key={m.crmField} className="flex justify-between border-b border-border/40 pb-2">
                          <span className="capitalize">{m.crmField}</span>
                          <span className="font-bold text-foreground">{m.sheetColumn}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleGoogleSyncNow}
                      disabled={googleSyncingNow}
                      className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-extrabold uppercase tracking-widest text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-premium"
                    >
                      <RotateCw className={`h-3 w-3 ${googleSyncingNow ? 'animate-spin' : ''}`} />
                      {googleSyncingNow ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={handleToggleGoogleSync}
                      className="flex-1 rounded-2xl bg-muted/10 hover:bg-muted/15 border border-border py-3 text-xs font-extrabold uppercase tracking-widest text-foreground transition-premium cursor-pointer"
                    >
                      {activeGoogleConnection.syncEnabled ? 'Pause Sync' : 'Resume Sync'}
                    </button>
                    <button
                      onClick={handleRemoveGoogleConnection}
                      className="rounded-2xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-3 text-xs font-extrabold uppercase tracking-widest cursor-pointer transition-premium"
                    >
                      Disconnect Sheet
                    </button>
                  </div>

                  {/* Sync Stats */}
                  {googleSyncStats && (
                    <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-4 text-center grid grid-cols-4 gap-2 text-xs mt-2 font-semibold">
                      <div>
                        <p className="text-[10px] text-muted uppercase">Rows</p>
                        <p className="font-bold text-foreground mt-0.5">{googleSyncStats.totalRows}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted uppercase">New</p>
                        <p className="font-bold text-emerald-500 mt-0.5">+{googleSyncStats.importedRows}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted uppercase">Dupes</p>
                        <p className="font-bold text-amber-500 mt-0.5">{googleSyncStats.duplicateRows}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted uppercase">Fail</p>
                        <p className="font-bold text-red-500 mt-0.5">{googleSyncStats.failedRows}</p>
                      </div>
                    </div>
                  )}

                  {/* Import Logs */}
                  <div className="space-y-3 pt-4 border-t border-border/60">
                    <p className="text-xs font-extrabold text-foreground uppercase tracking-widest">Sync History Logs</p>
                    {loadingGoogleHistory && <p className="text-[10px] text-muted animate-pulse">Loading logs...</p>}
                    {!loadingGoogleHistory && googleHistory.length === 0 && (
                      <p className="text-[10px] text-muted italic font-medium">No sync history logs found.</p>
                    )}
                    <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                      {googleHistory.map((log: any) => (
                        <div key={log.id} className="p-3.5 rounded-2xl border border-border/60 bg-muted/5 text-[10px] font-semibold flex justify-between items-center text-muted">
                          <div>
                            <p className="text-foreground font-bold">{new Date(log.createdAt).toLocaleString()}</p>
                            <p className="mt-0.5">
                              Imported: {log.importedRows} | Duplicates: {log.duplicateRows} | Failed: {log.failedRows}
                            </p>
                          </div>
                          <span className="font-bold text-foreground bg-muted/10 px-2 py-0.5 rounded-full border border-border">({log.totalRows} rows)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Wizard mode for configuration */
                <div className="space-y-6 pt-4 border-t border-border/60">
                  {/* STEP 1: General */}
                  {googleSetupStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-[10px] text-muted mb-2 font-bold uppercase tracking-widest">
                          1. Google Account Connection
                        </label>
                        {!googleConn ? (
                          <div className="rounded-2xl border border-dashed border-border p-6 text-center space-y-3">
                            <p className="text-xs text-muted leading-relaxed">
                              To start synchronising leads from Google Sheets, you must first connect the client's Google Account.
                            </p>
                            <button
                              type="button"
                              onClick={handleConnectGoogle}
                              className="inline-flex items-center gap-1.5 rounded-2xl bg-primary hover:bg-primary/90 px-6 py-2.5 text-xs font-extrabold uppercase tracking-widest text-white transition-premium cursor-pointer"
                            >
                              🔗 Connect Google Account
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-2xl bg-muted/5 border border-border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground">Google Account Connected</p>
                                <p className="text-[10px] text-muted mt-0.5">{googleConn.googleEmail}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm('Disconnect Google account? Active spreadsheet connections will be removed.')) {
                                  try {
                                    await api.delete(`/v1/agency/clients/${clientId}/google/connections/all`);
                                    loadGoogleStatusAndConnections();
                                    setGoogleSetupStep(1);
                                  } catch (err: any) {
                                    setGoogleErrorMsg(err.response?.data?.error?.message || 'Failed to disconnect account.');
                                  }
                                }
                              }}
                              className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                            >
                              Disconnect
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] text-muted mb-2 font-bold uppercase tracking-widest">
                          2. Choose Sync Interval
                        </label>
                        <select
                          value={googleSyncInterval}
                          onChange={(e) => setGoogleSyncInterval(Number(e.target.value))}
                          className="w-full rounded-2xl border border-border bg-card text-foreground px-4.5 py-3 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-premium"
                        >
                          <option value="30">Every 30 seconds</option>
                          <option value="60">Every 1 minute</option>
                          <option value="300">Every 5 minutes</option>
                          <option value="900">Every 15 minutes</option>
                          <option value="1800">Every 30 minutes</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-muted mb-2 font-bold uppercase tracking-widest">
                          3. Select Connection Mode
                        </label>
                        <div className="flex border border-border rounded-2xl overflow-hidden p-1 bg-muted/5">
                          <button
                            onClick={() => {
                              setGoogleConnectMode('drive');
                              setSelectedGoogleSpreadsheetId('');
                              setSelectedGoogleSheetName('');
                              setGoogleSheets([]);
                              setGoogleHeaders([]);
                              setGoogleErrorMsg(null);
                              setGoogleSuccessMsg(null);
                            }}
                            type="button"
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest text-center rounded-xl cursor-pointer transition-premium ${
                              googleConnectMode === 'drive'
                                ? 'bg-primary text-white'
                                : 'text-muted hover:text-foreground'
                            }`}
                          >
                            📂 Choose from Drive
                          </button>
                          <button
                            onClick={() => {
                              setGoogleConnectMode('url');
                              setSelectedGoogleSpreadsheetId('');
                              setSelectedGoogleSheetName('');
                              setGoogleSheets([]);
                              setGoogleHeaders([]);
                              setGoogleErrorMsg(null);
                              setGoogleSuccessMsg(null);
                            }}
                            type="button"
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest text-center rounded-xl cursor-pointer transition-premium ${
                              googleConnectMode === 'url'
                                ? 'bg-primary text-white'
                                : 'text-muted hover:text-foreground'
                            }`}
                          >
                            🔗 Connect via Link
                          </button>
                        </div>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={() => setGoogleSetupStep(2)}
                          disabled={!googleConn}
                          type="button"
                          className="w-full rounded-2xl bg-primary hover:bg-primary/90 py-3 text-xs font-extrabold uppercase tracking-widest text-white transition-premium cursor-pointer disabled:opacity-50"
                        >
                          Next: Select Spreadsheet →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Connection */}
                  {googleSetupStep === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="space-y-4">
                        {googleConnectMode === 'drive' && (
                          <div>
                            <label className="block text-[10px] text-muted mb-1.5 font-bold uppercase tracking-widest">
                              Select Spreadsheet
                              {loadingGoogleSpreadsheets && <span className="lowercase ml-2">(loading...)</span>}
                            </label>
                            <select
                              value={selectedGoogleSpreadsheetId}
                              onChange={handleGoogleSpreadsheetChange}
                              className="w-full rounded-2xl border border-border bg-card text-foreground px-4.5 py-3 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-premium"
                              disabled={loadingGoogleSpreadsheets}
                            >
                              <option value="">-- Select Spreadsheet --</option>
                              {googleSpreadsheets.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {googleConnectMode === 'url' && !selectedGoogleSpreadsheetId && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] text-muted mb-1.5 font-bold uppercase tracking-widest">
                                Paste Google Sheet URL
                              </label>
                              <input
                                type="text"
                                value={googleSheetUrl}
                                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                                placeholder="e.g. https://docs.google.com/spreadsheets/d/.../edit"
                                className="w-full rounded-2xl border border-border bg-card text-foreground px-4.5 py-3 text-xs placeholder-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-premium"
                                disabled={googleFetchingUrlInfo}
                              />
                              <p className="text-[10px] text-muted font-medium mt-1.5">
                                Make sure access is granted to the client's connected Google account.
                              </p>
                            </div>
                            <button
                              onClick={handleGoogleFetchSpreadsheetByUrl}
                              disabled={googleFetchingUrlInfo || !googleSheetUrl}
                              type="button"
                              className="w-full rounded-2xl bg-primary hover:bg-primary/90 py-3 text-xs font-extrabold uppercase tracking-widest text-white transition-premium cursor-pointer disabled:opacity-50"
                            >
                              {googleFetchingUrlInfo ? 'Fetching Spreadsheet Metadata...' : 'Fetch Spreadsheet & Load Tabs'}
                            </button>
                          </div>
                        )}

                        {googleConnectMode === 'url' && selectedGoogleSpreadsheetId && (
                          <div className="p-4 rounded-2xl border border-border bg-muted/5 flex justify-between items-center text-xs font-semibold">
                            <div>
                              <p className="text-muted uppercase tracking-widest text-[9px]">Resolved Spreadsheet Name</p>
                              <p className="text-foreground font-extrabold mt-0.5">{googleResolvedSpreadsheetName}</p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedGoogleSpreadsheetId('');
                                setSelectedGoogleSheetName('');
                                setGoogleSheets([]);
                                setGoogleHeaders([]);
                              }}
                              type="button"
                              className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                            >
                              Change URL
                            </button>
                          </div>
                        )}

                        {selectedGoogleSpreadsheetId && (
                          <div>
                            <label className="block text-[10px] text-muted mb-1.5 font-bold uppercase tracking-widest">
                              Select Sheet Tab
                              {loadingGoogleSheets && <span className="lowercase ml-2">(loading...)</span>}
                            </label>
                            <select
                              value={selectedGoogleSheetName}
                              onChange={handleGoogleSheetChange}
                              className="w-full rounded-2xl border border-border bg-card text-foreground px-4.5 py-3 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-premium"
                              disabled={loadingGoogleSheets}
                            >
                              <option value="">-- Select Sheet Name --</option>
                              {googleSheets.map((s) => (
                                <option key={s.name} value={s.name}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => setGoogleSetupStep(1)}
                          type="button"
                          className="flex-1 rounded-2xl bg-muted/10 hover:bg-muted/15 border border-border py-3 text-xs font-extrabold uppercase tracking-widest text-foreground transition-premium cursor-pointer"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setGoogleSetupStep(3)}
                          disabled={!selectedGoogleSpreadsheetId || !selectedGoogleSheetName}
                          type="button"
                          className="flex-1 rounded-2xl bg-primary hover:bg-primary/90 py-3 text-xs font-extrabold uppercase tracking-widest text-white transition-premium cursor-pointer disabled:opacity-50"
                        >
                          Next: Configure Mapping →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Configuration */}
                  {googleSetupStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="space-y-3">
                        <label className="block text-[10px] text-muted font-bold uppercase tracking-widest mb-1">
                          Lead Fields Column Mapping
                          {loadingGoogleHeaders && <span className="lowercase ml-2">(loading headers...)</span>}
                        </label>

                        {[
                          { value: 'name', label: 'Customer Name *' },
                          { value: 'email', label: 'Email Address' },
                          { value: 'phone', label: 'Phone Number' },
                          { value: 'source', label: 'Campaign / Source' },
                          { value: 'city', label: 'City' },
                        ].map((field) => (
                          <div key={field.value} className="grid grid-cols-2 gap-4 items-center p-3 rounded-2xl border border-border bg-card">
                            <span className="text-xs text-foreground font-bold">{field.label}</span>
                            <select
                              value={googleFieldMappings[field.value] || ''}
                              onChange={(e) => handleGoogleMappingChange(field.value, e.target.value)}
                              className="w-full rounded-xl border border-border bg-card text-foreground px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                            >
                              <option value="">-- Not Mapped --</option>
                              {googleHeaders.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => setGoogleSetupStep(2)}
                          type="button"
                          className="flex-1 rounded-2xl bg-muted/10 hover:bg-muted/15 border border-border py-3 text-xs font-extrabold uppercase tracking-widest text-foreground transition-premium cursor-pointer"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setGoogleSetupStep(4)}
                          disabled={!googleFieldMappings.name}
                          type="button"
                          className="flex-1 rounded-2xl bg-primary hover:bg-primary/90 py-3 text-xs font-extrabold uppercase tracking-widest text-white transition-premium cursor-pointer disabled:opacity-50"
                        >
                          Next: Review →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Review */}
                  {googleSetupStep === 4 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="rounded-2xl border border-border p-4 bg-muted/5 space-y-4 text-xs">
                        <h3 className="text-xs font-extrabold text-foreground uppercase tracking-widest border-b border-border pb-2">
                          Configuration Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-y-2 font-semibold">
                          <span className="text-muted">Account:</span>
                          <span className="text-foreground truncate">{googleConn.googleEmail}</span>

                          <span className="text-muted">Spreadsheet Source:</span>
                          <span className="text-foreground capitalize">{googleConnectMode === 'url' ? 'Link Connection' : 'Google Drive'}</span>

                          <span className="text-muted">Spreadsheet:</span>
                          <span className="text-foreground truncate">
                            {googleConnectMode === 'url' ? googleResolvedSpreadsheetName : googleSpreadsheets.find((s) => s.id === selectedGoogleSpreadsheetId)?.name || '—'}
                          </span>

                          <span className="text-muted">Sheet Tab:</span>
                          <span className="text-foreground truncate">{selectedGoogleSheetName}</span>

                          <span className="text-muted">Sync Interval:</span>
                          <span className="text-foreground">
                            {googleSyncInterval < 60 ? `Every ${googleSyncInterval} seconds` : `Every ${googleSyncInterval / 60} minutes`}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-border space-y-2">
                          <p className="text-[10px] text-muted uppercase font-bold tracking-wider">Field Mappings</p>
                          <div className="space-y-1.5">
                            {Object.entries(googleFieldMappings)
                              .filter(([_, value]) => value !== '')
                              .map(([key, value]) => (
                                <div key={key} className="flex justify-between text-[11px] font-semibold">
                                  <span className="capitalize text-muted">{key}:</span>
                                  <span className="text-foreground">{value}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => setGoogleSetupStep(3)}
                          type="button"
                          className="flex-1 rounded-2xl bg-muted/10 hover:bg-muted/15 border border-border py-3 text-xs font-extrabold uppercase tracking-widest text-foreground transition-premium cursor-pointer"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={handleSaveGoogleConnection}
                          disabled={savingGoogleConnection}
                          type="button"
                          className="flex-1 rounded-2xl bg-primary hover:bg-primary/90 py-3 text-xs font-extrabold uppercase tracking-widest text-white transition-premium cursor-pointer disabled:opacity-50"
                        >
                          {savingGoogleConnection ? 'Saving Connection...' : 'Save Settings & Activate Sync'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          </div>
        )}
      </AppCard>
    );
  };

  const renderClientSettingsCard = () => {
    return (
      <AppCard className="p-6 h-fit">
        <h2 className="text-sm font-extrabold text-foreground uppercase tracking-widest mb-6">Client Settings</h2>

        {clientUpdateError && (
          <div className="mb-6 rounded-2xl p-4 text-xs border text-center bg-red-500/10 border-red-500/20 text-red-500 font-semibold animate-in fade-in duration-200">
            {clientUpdateError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-muted mb-2 font-bold uppercase tracking-widest">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              onBlur={() => handleAutoSaveClientInfo('businessName', businessName)}
              className="w-full rounded-2xl border border-border bg-card text-foreground px-4.5 py-3 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-premium"
              disabled={isUpdating}
            />
          </div>

          <div>
            <label className="block text-[10px] text-muted mb-2 font-bold uppercase tracking-widest">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleAutoSaveClientInfo('email', email)}
              className="w-full rounded-2xl border border-border bg-card text-foreground px-4.5 py-3 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-premium"
              disabled={isUpdating}
            />
          </div>
          
          <p className="text-[10px] text-muted font-semibold italic mt-2">
            Note: Changes to client info are auto-saved on input blur (clicking outside the field).
          </p>
        </div>
      </AppCard>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <button
          type="button"
          onClick={() => router.push('/agency/clients')}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mb-4 flex items-center gap-1 cursor-pointer"
        >
          ← Back to Clients
        </button>
        <h1 className="text-3xl font-bold tracking-tight">{client?.businessName}</h1>
        <p className="text-slate-400 mt-1">Configure partner details, budgets, and Meta Lead Ads connectivity</p>
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400 flex items-center justify-between">
          <span>✅ {successBanner}</span>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400/60 hover:text-emerald-400 text-lg leading-none">×</button>
        </div>
      )}

      {isConnected && loadingDashboard && !dashboardData ? (
        <div className="rounded-xl border border-slate-900 bg-slate-900/10 backdrop-blur-xl p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Fetching Meta dashboard telemetry...</p>
          </div>
        </div>
      ) : isConnected && dashboardData ? (
        <div className="space-y-8 animate-in fade-in duration-350">
          {/* Main Tab Links */}
          <div className="flex overflow-x-auto gap-1.5 border-b border-zinc-900 pb-px scrollbar-none select-none">
            {['Overview', 'Campaigns', 'Adsets', 'Ads', 'Forms', 'Leads', 'Diagnostics', 'Real-Time Feed'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-xs font-extrabold uppercase tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/5'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Overview Tab */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {!dashboardData.overviewMetrics ? (
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-12 text-center text-zinc-400">
                    <ShieldAlert size={48} className="mx-auto text-red-500/50 mb-3" />
                    <p className="font-bold text-lg text-white">No Meta data available</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Could not communicate with Meta Graph APIs. Verify your permission scopes or credentials inside Settings/Diagnostics.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Spend */}
                    <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5">
                      <div className="p-2 w-fit rounded-xl bg-violet-500/10 border border-violet-500/15 text-violet-400">
                        <Wallet size={18} />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4">Spend</p>
                      <h3 className="text-2xl font-black text-white mt-1">
                        {dashboardData.connectionCard?.connectedAdAccount?.currency === 'INR' ? '₹' : '$'}
                        {(dashboardData.overviewMetrics.spend || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h3>
                    </div>

                    {/* Reach */}
                    <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5">
                      <div className="p-2 w-fit rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/15 text-[#3B82F6]">
                        <Globe size={18} />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4">Reach</p>
                      <h3 className="text-2xl font-black text-white mt-1">
                        {(dashboardData.overviewMetrics.reach || 0).toLocaleString()}
                      </h3>
                    </div>

                    {/* Impressions */}
                    <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5">
                      <div className="p-2 w-fit rounded-xl bg-indigo-500/10 border border-indigo-500/15 text-indigo-400">
                        <Eye size={18} />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4">Impressions</p>
                      <h3 className="text-2xl font-black text-white mt-1">
                        {(dashboardData.overviewMetrics.impressions || 0).toLocaleString()}
                      </h3>
                    </div>

                    {/* Clicks */}
                    <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5">
                      <div className="p-2 w-fit rounded-xl bg-cyan-500/10 border border-cyan-500/15 text-cyan-400">
                        <MousePointerClick size={18} />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4">Clicks</p>
                      <h3 className="text-2xl font-black text-white mt-1">
                        {(dashboardData.overviewMetrics.clicks || 0).toLocaleString()}
                      </h3>
                    </div>

                    {/* CTR */}
                    <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5">
                      <div className="p-2 w-fit rounded-xl bg-amber-500/10 border border-amber-500/15 text-amber-400">
                        <PercentIcon />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4">CTR</p>
                      <h3 className="text-2xl font-black text-white mt-1">
                        {(dashboardData.overviewMetrics.ctr || 0).toFixed(2)}%
                      </h3>
                    </div>

                    {/* CPC */}
                    <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5">
                      <div className="p-2 w-fit rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-400">
                        <DollarSign size={18} />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4">CPC</p>
                      <h3 className="text-2xl font-black text-white mt-1">
                        {dashboardData.connectionCard?.connectedAdAccount?.currency === 'INR' ? '₹' : '$'}
                        {(dashboardData.overviewMetrics.cpc || 0).toFixed(2)}
                      </h3>
                    </div>

                    {/* CPM */}
                    <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5">
                      <div className="p-2 w-fit rounded-xl bg-teal-500/10 border border-teal-500/15 text-teal-400">
                        <Sliders size={18} />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4">CPM</p>
                      <h3 className="text-2xl font-black text-white mt-1">
                        {dashboardData.connectionCard?.connectedAdAccount?.currency === 'INR' ? '₹' : '$'}
                        {(dashboardData.overviewMetrics.cpm || 0).toFixed(2)}
                      </h3>
                    </div>

                    {/* Leads */}
                    <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5">
                      <div className="p-2 w-fit rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-400">
                        <Users size={18} />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4">Leads</p>
                      <h3 className="text-2xl font-black text-white mt-1">
                        {(dashboardData.overviewMetrics.leads || 0).toLocaleString()}
                      </h3>
                    </div>

                    {/* Cost Per Lead */}
                    <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5">
                      <div className="p-2 w-fit rounded-xl bg-orange-500/10 border border-orange-500/15 text-orange-400">
                        <Target size={18} />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4">Cost Per Lead</p>
                      <h3 className="text-2xl font-black text-white mt-1">
                        {dashboardData.connectionCard?.connectedAdAccount?.currency === 'INR' ? '₹' : '$'}
                        {(dashboardData.overviewMetrics.costPerLead || 0).toFixed(2)}
                      </h3>
                    </div>
                  </div>
                )}

                {/* Spend & ROI Metrics */}
                <div className="rounded-xl border border-slate-900 bg-slate-900/10 backdrop-blur-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" /> Spend & ROI Metrics
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-slate-950 border border-slate-800 p-4">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Current Month Spend</p>
                      <p className="text-xl font-bold text-white">₹{(dashboardData.overviewMetrics?.currentMonthSpend ?? dashboardData.overviewMetrics?.spend ?? 0).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Fetched directly from Meta Insights</p>
                    </div>
                    <div className="rounded-lg bg-slate-950 border border-slate-800 p-4">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Meta Closed Revenue</p>
                      <p className="text-xl font-bold text-emerald-400">₹{(dashboardData.totalRevenue ?? 0).toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Sum of WON leads value</p>
                    </div>
                    <div className="rounded-lg bg-slate-950 border border-slate-800 p-4">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Return on Ad Spend (ROAS)</p>
                      <p className="text-xl font-bold text-indigo-400">{(dashboardData.roas ?? 0).toFixed(2)}x</p>
                      <p className="text-[10px] text-slate-500 mt-1">Revenue / Spend ratio</p>
                    </div>
                  </div>
                </div>

                {renderGoogleSheetsCard()}
              </div>

              {/* Connection Profile & Settings column */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 shadow-xl space-y-6">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-zinc-900">
                    <ShieldCheck className="text-[#3B82F6]" size={16} />
                    Connection Profile
                  </h3>

                  <div className="space-y-5 text-xs text-zinc-300">
                    {/* User */}
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Connected User</span>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-indigo-400" />
                        <span className="font-semibold text-white">{dashboardData.connectionCard?.connectedUser?.name || '—'}</span>
                      </div>
                    </div>

                    {/* Business */}
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Connected Business</span>
                      <div className="font-semibold text-white">{dashboardData.connectionCard?.connectedBusiness?.name || '—'}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {dashboardData.connectionCard?.connectedBusiness?.id || '—'}</div>
                    </div>

                    {/* Ad Account */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Connected Ad Account</span>
                        {adAccounts.length > 1 && (
                          <span className="text-[9px] text-slate-500 italic">Select to Switch</span>
                        )}
                      </div>
                      {adAccounts.length > 1 ? (
                        <select
                          value={selectedAdAccountId}
                          onChange={(e) => handleAdAccountChange(e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                          disabled={savingMetaConfig}
                        >
                          {adAccounts.map((acct) => (
                            <option key={acct.id} value={acct.id}>
                              {acct.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="font-semibold text-white">{dashboardData.connectionCard?.connectedAdAccount?.name || '—'}</div>
                      )}
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {dashboardData.connectionCard?.connectedAdAccount?.id || '—'}</div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="bg-zinc-900 px-2 py-0.5 rounded text-[10px] font-bold text-violet-400 border border-zinc-800">
                          {dashboardData.connectionCard?.connectedAdAccount?.currency || '—'}
                        </span>
                        <span className="text-zinc-500 font-medium text-[10px]">
                          {dashboardData.connectionCard?.connectedAdAccount?.timezone || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Page */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Connected Page</span>
                        {pages.length > 1 && (
                          <span className="text-[9px] text-slate-500 italic">Select to Switch</span>
                        )}
                      </div>
                      {pages.length > 1 ? (
                        <select
                          value={selectedPageId}
                          onChange={(e) => handlePageChange(e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                          disabled={savingMetaConfig}
                        >
                          {pages.map((pg) => (
                            <option key={pg.id} value={pg.id}>
                              {pg.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="font-semibold text-white">{dashboardData.connectionCard?.connectedPage?.name || '—'}</div>
                      )}
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {dashboardData.connectionCard?.connectedPage?.id || '—'}</div>
                    </div>

                    {/* Expiration */}
                    <div className="pt-3 border-t border-zinc-900/60 flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Token Expiry</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        dashboardData.connectionCard?.daysRemaining && dashboardData.connectionCard.daysRemaining > 15
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {dashboardData.connectionCard?.daysRemaining} Days Remaining
                      </span>
                    </div>

                    {/* Disconnect Action */}
                    <div className="pt-4 border-t border-zinc-900/60">
                      <button
                        onClick={handleMetaDisconnect}
                        className="w-full rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 py-2.5 text-xs font-semibold text-red-400 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Disconnect Meta Account
                      </button>
                    </div>
                  </div>
                </div>

                {renderClientSettingsCard()}
              </div>
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'Campaigns' && (
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 overflow-hidden shadow-lg animate-in fade-in duration-200">
              <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-950/20">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#3B82F6]" />
                  Campaign Performance List
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-950/50 text-zinc-400 uppercase tracking-widest text-[9px] font-extrabold">
                      <th className="py-4 px-6">Campaign Name</th>
                      <th className="py-4 px-6">Objective</th>
                      <th className="py-4 px-6">Spend</th>
                      <th className="py-4 px-6">Reach</th>
                      <th className="py-4 px-6">Impressions</th>
                      <th className="py-4 px-6">Clicks</th>
                      <th className="py-4 px-6">Leads</th>
                      <th className="py-4 px-6">CTR</th>
                      <th className="py-4 px-6">CPC</th>
                      <th className="py-4 px-6">CPM</th>
                      <th className="py-4 px-6">Cost Per Lead</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {!dashboardData.campaigns || dashboardData.campaigns.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-8 px-6 text-center text-zinc-500 font-semibold text-sm">
                          No Meta data available
                        </td>
                      </tr>
                    ) : (
                      dashboardData.campaigns.map((camp: any) => (
                        <tr key={camp.id} className="hover:bg-zinc-900/20 text-zinc-300 transition-colors">
                          <td className="py-4.5 px-6 font-bold text-white max-w-[200px] truncate">{camp.name}</td>
                          <td className="py-4.5 px-6 font-semibold uppercase">{camp.objective}</td>
                          <td className="py-4.5 px-6 font-semibold text-white">
                            {dashboardData.connectionCard?.connectedAdAccount?.currency === 'INR' ? '₹' : '$'}
                            {camp.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4.5 px-6 font-medium">{camp.reach.toLocaleString()}</td>
                          <td className="py-4.5 px-6">{camp.impressions.toLocaleString()}</td>
                          <td className="py-4.5 px-6">{camp.clicks.toLocaleString()}</td>
                          <td className="py-4.5 px-6 font-bold text-[#3B82F6]">{camp.leads}</td>
                          <td className="py-4.5 px-6">{camp.ctr.toFixed(2)}%</td>
                          <td className="py-4.5 px-6">
                            {dashboardData.connectionCard?.connectedAdAccount?.currency === 'INR' ? '₹' : '$'}
                            {camp.cpc.toFixed(2)}
                          </td>
                          <td className="py-4.5 px-6">
                            {dashboardData.connectionCard?.connectedAdAccount?.currency === 'INR' ? '₹' : '$'}
                            {camp.cpm.toFixed(2)}
                          </td>
                          <td className="py-4.5 px-6 font-bold text-emerald-400">
                            {dashboardData.connectionCard?.connectedAdAccount?.currency === 'INR' ? '₹' : '$'}
                            {camp.costPerLead.toFixed(2)}
                          </td>
                          <td className="py-4.5 px-6">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                              camp.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}>
                              {camp.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Adsets Tab */}
          {activeTab === 'Adsets' && (
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 overflow-hidden shadow-lg animate-in fade-in duration-200">
              <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-950/20">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders size={18} className="text-[#3B82F6]" />
                  Adsets Configuration &amp; Performance
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-950/50 text-zinc-400 uppercase tracking-widest text-[9px] font-extrabold">
                      <th className="py-4 px-6">Adset Name</th>
                      <th className="py-4 px-6">Daily Budget</th>
                      <th className="py-4 px-6">Reach</th>
                      <th className="py-4 px-6">Leads Count</th>
                      <th className="py-4 px-6">Spend</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {!dashboardData.adsets || dashboardData.adsets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 px-6 text-center text-zinc-500 font-semibold text-sm">
                          No Meta data available
                        </td>
                      </tr>
                    ) : (
                      dashboardData.adsets.map((adset: any) => (
                        <tr key={adset.id} className="hover:bg-zinc-900/20 text-zinc-300 transition-colors">
                          <td className="py-4.5 px-6 font-bold text-white">{adset.name}</td>
                          <td className="py-4.5 px-6 font-semibold text-white">
                            {dashboardData.connectionCard?.connectedAdAccount?.currency === 'INR' ? '₹' : '$'}
                            {adset.dailyBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4.5 px-6 font-medium">{adset.reach.toLocaleString()}</td>
                          <td className="py-4.5 px-6 font-bold text-[#3B82F6]">{adset.leads}</td>
                          <td className="py-4.5 px-6 font-semibold">
                            {dashboardData.connectionCard?.connectedAdAccount?.currency === 'INR' ? '₹' : '$'}
                            {adset.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4.5 px-6">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                              adset.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}>
                              {adset.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ads Tab */}
          {activeTab === 'Ads' && (
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 overflow-hidden shadow-lg animate-in fade-in duration-200">
              <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-950/20">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Grid size={18} className="text-[#3B82F6]" />
                  Active Ads Performance
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-950/50 text-zinc-400 uppercase tracking-widest text-[9px] font-extrabold">
                      <th className="py-4 px-6">Ad Name</th>
                      <th className="py-4 px-6">Spend</th>
                      <th className="py-4 px-6">Reach</th>
                      <th className="py-4 px-6">Clicks</th>
                      <th className="py-4 px-6">CTR</th>
                      <th className="py-4 px-6">Leads Count</th>
                      <th className="py-4 px-6">CPC</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {!dashboardData.ads || dashboardData.ads.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 px-6 text-center text-zinc-500 font-semibold text-sm">
                          No Meta data available
                        </td>
                      </tr>
                    ) : (
                      dashboardData.ads.map((ad: any) => (
                        <tr key={ad.id} className="hover:bg-zinc-900/25 text-zinc-300 transition-colors">
                          <td className="py-4.5 px-6 font-bold text-white">{ad.name}</td>
                          <td className="py-4.5 px-6 font-semibold text-white">
                            {dashboardData.connectionCard?.connectedAdAccount?.currency === 'INR' ? '₹' : '$'}
                            {ad.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4.5 px-6 font-medium">{ad.reach.toLocaleString()}</td>
                          <td className="py-4.5 px-6">{ad.clicks.toLocaleString()}</td>
                          <td className="py-4.5 px-6 font-semibold">{ad.ctr.toFixed(2)}%</td>
                          <td className="py-4.5 px-6 font-bold text-[#3B82F6]">{ad.leads}</td>
                          <td className="py-4.5 px-6 font-semibold">
                            {dashboardData.connectionCard?.connectedAdAccount?.currency === 'INR' ? '₹' : '$'}
                            {ad.cpc.toFixed(2)}
                          </td>
                          <td className="py-4.5 px-6">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                              ad.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}>
                              {ad.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Forms Tab */}
          {activeTab === 'Forms' && (
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 overflow-hidden shadow-lg animate-in fade-in duration-200">
              <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-950/20">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText size={18} className="text-[#3B82F6]" />
                  Facebook Lead Gen Forms
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-950/50 text-zinc-400 uppercase tracking-widest text-[9px] font-extrabold">
                      <th className="py-4 px-6">Form Name</th>
                      <th className="py-4 px-6">Form ID</th>
                      <th className="py-4 px-6">Created Date</th>
                      <th className="py-4 px-6">Lead Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {!dashboardData.forms || dashboardData.forms.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 px-6 text-center text-zinc-500 font-semibold text-sm">
                          No Meta data available
                        </td>
                      </tr>
                    ) : (
                      dashboardData.forms.map((form: any) => (
                        <tr key={form.id} className="hover:bg-zinc-900/20 text-zinc-300 transition-colors">
                          <td className="py-4.5 px-6 font-bold text-white">{form.name}</td>
                          <td className="py-4.5 px-6 font-mono text-zinc-500">{form.id}</td>
                          <td className="py-4.5 px-6 font-medium text-zinc-400">
                            {new Date(form.createdTime).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-4.5 px-6 font-bold text-[#3B82F6]">{form.leadsCount} leads</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Leads Tab */}
          {activeTab === 'Leads' && (
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 overflow-hidden shadow-lg animate-in fade-in duration-200">
              <div className="px-6 py-5 border-b border-zinc-900 bg-zinc-950/20">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users size={18} className="text-[#3B82F6]" />
                  Synced Meta Leads Feed
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-950/50 text-zinc-400 uppercase tracking-widest text-[9px] font-extrabold">
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">Phone</th>
                      <th className="py-4 px-6">Email</th>
                      <th className="py-4 px-6">Campaign</th>
                      <th className="py-4 px-6">Adset</th>
                      <th className="py-4 px-6">Ad</th>
                      <th className="py-4 px-6">Form ID</th>
                      <th className="py-4 px-6">Page Name</th>
                      <th className="py-4 px-6">Created Time</th>
                      <th className="py-4 px-6">Meta Lead ID</th>
                      <th className="py-4 px-6">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {!dashboardData.leads || dashboardData.leads.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 px-6 text-center text-zinc-500 font-semibold text-sm">
                          No Meta data available
                        </td>
                      </tr>
                    ) : (
                      dashboardData.leads.map((lead: any) => (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className="hover:bg-zinc-900/25 text-zinc-300 transition-colors cursor-pointer"
                        >
                          <td className="py-4.5 px-6 font-bold text-white whitespace-nowrap">{lead.name}</td>
                          <td className="py-4.5 px-6 font-medium text-zinc-300 whitespace-nowrap">{lead.phone}</td>
                          <td className="py-4.5 px-6 text-zinc-400">{lead.email}</td>
                          <td className="py-4.5 px-6 max-w-[150px] truncate" title={lead.campaign}>{lead.campaign}</td>
                          <td className="py-4.5 px-6 max-w-[150px] truncate" title={lead.adset}>{lead.adset}</td>
                          <td className="py-4.5 px-6 max-w-[150px] truncate" title={lead.ad}>{lead.ad}</td>
                          <td className="py-4.5 px-6 font-mono text-zinc-500">{lead.form}</td>
                          <td className="py-4.5 px-6 truncate max-w-[150px]">{lead.page}</td>
                          <td className="py-4.5 px-6 text-zinc-500 font-medium whitespace-nowrap">
                            {new Date(lead.createdTime).toLocaleString()}
                          </td>
                          <td className="py-4.5 px-6 font-mono text-zinc-500">{lead.metaLeadId}</td>
                          <td className="py-4.5 px-6">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                              {lead.source}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Diagnostics Tab */}
          {activeTab === 'Diagnostics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 shadow-xl animate-in fade-in duration-200">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                    <ShieldCheck size={20} className="text-[#3B82F6]" />
                    Technical Operations Audits
                  </h3>

                  <div className="space-y-4">
                    {/* Webhook Status */}
                    <div className="flex justify-between items-center p-4 rounded-xl border border-zinc-900 bg-zinc-950/20">
                      <div>
                        <h4 className="font-bold text-white text-sm">Webhook Status</h4>
                        <p className="text-[10px] text-zinc-500">Live lead submissions callbacks registration</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        dashboardData.diagnostics?.webhookStatus === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {dashboardData.diagnostics?.webhookStatus || 'UNKNOWN'}
                      </span>
                    </div>

                    {/* Page Token Status */}
                    <div className="flex justify-between items-center p-4 rounded-xl border border-zinc-900 bg-zinc-950/20">
                      <div>
                        <h4 className="font-bold text-white text-sm">Facebook Page Token</h4>
                        <p className="text-[10px] text-zinc-500">Form reading permissions state</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        dashboardData.diagnostics?.pageTokenStatus === 'VALID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {dashboardData.diagnostics?.pageTokenStatus || 'UNKNOWN'}
                      </span>
                    </div>

                    {/* User Token Status */}
                    <div className="flex justify-between items-center p-4 rounded-xl border border-zinc-900 bg-zinc-950/20">
                      <div>
                        <h4 className="font-bold text-white text-sm">User Authentication Status</h4>
                        <p className="text-[10px] text-zinc-500">OAuth user credentials validity</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        dashboardData.diagnostics?.userTokenStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {dashboardData.diagnostics?.userTokenStatus || 'UNKNOWN'}
                      </span>
                    </div>

                    {/* Queue Health */}
                    <div className="flex justify-between items-center p-4 rounded-xl border border-zinc-900 bg-zinc-950/20">
                      <div>
                        <h4 className="font-bold text-white text-sm">BullMQ Processor</h4>
                        <p className="text-[10px] text-zinc-500">Live processing worker background health</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        dashboardData.diagnostics?.queueHealth === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {dashboardData.diagnostics?.queueHealth || 'UNAVAILABLE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scopes snapshot */}
                <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6">
                  <h4 className="font-bold text-white text-sm mb-4">Permissions Granted Checklist</h4>
                  <div className="flex flex-wrap gap-2.5">
                    {!dashboardData.diagnostics?.permissionsGranted || dashboardData.diagnostics.permissionsGranted.length === 0 ? (
                      <span className="text-zinc-500 text-xs">No permissions scopes registered in token snapshot.</span>
                    ) : (
                      dashboardData.diagnostics.permissionsGranted.map((perm: any, idx: number) => {
                        const name = typeof perm === 'object' ? perm.permission : perm;
                        const status = typeof perm === 'object' ? perm.status : 'granted';
                        return (
                          <span
                            key={idx}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono tracking-tight flex items-center gap-1.5 ${
                              status === 'granted'
                                ? 'bg-zinc-900 border-emerald-500/20 text-emerald-400'
                                : 'bg-zinc-900 border-red-500/20 text-red-400'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${status === 'granted' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {name}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Sync Stats Card */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider pb-3 border-b border-zinc-900">
                    Synchronization Health
                  </h3>

                  <div className="space-y-4 text-xs text-zinc-300">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 font-bold">Failed Sync Jobs</span>
                      <span className="font-extrabold text-white">{dashboardData.diagnostics?.failedJobs || 0}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 font-bold">Dead Letter Queue Count</span>
                      <span className="font-extrabold text-white">{dashboardData.diagnostics?.deadLetterQueueCount || 0}</span>
                    </div>

                    <div className="pt-3 border-t border-zinc-900">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Last Successful Sync</span>
                      <div className="font-semibold text-white">
                        {dashboardData.diagnostics?.lastSuccessfulSync ? new Date(dashboardData.diagnostics.lastSuccessfulSync).toLocaleString() : 'Never'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={loadMetaDashboardData}
                    disabled={loadingDashboard}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 py-3 text-sm font-semibold text-slate-300 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCw size={16} className={loadingDashboard ? 'animate-spin' : ''} />
                    Refresh Meta Data
                  </button>
                  <button
                    onClick={handleMetaConnect}
                    disabled={connectingMeta}
                    className="w-full rounded-lg bg-slate-850 text-slate-300 hover:bg-slate-800 border border-slate-700 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Reconnect Meta Account
                  </button>
                  <button
                    onClick={handleMetaDisconnect}
                    className="w-full rounded-lg bg-red-950/20 text-red-400 hover:bg-red-950/40 border border-red-900/40 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer"
                  >
                    Disconnect Meta Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Real-Time Events Feed Tab */}
          {activeTab === 'Real-Time Feed' && (
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 max-w-3xl mx-auto shadow-xl space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock size={18} className="text-[#3B82F6]" />
                    Live Connection Event Stream
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Real-time callbacks captured via Socket.IO connections</p>
                </div>
                <button
                  onClick={() => setEventsList([])}
                  className="text-xs font-bold text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-lg px-2.5 py-1 hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  Clear Log
                </button>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-none">
                {eventsList.length === 0 ? (
                  <div className="py-12 text-center text-zinc-600 text-xs">
                    No events streamed yet. Trigger webhook submissions or reload telemetry to receive socket payloads.
                  </div>
                ) : (
                  eventsList.map((evt: any) => (
                    <div key={evt.id} className="flex gap-4.5 p-4 rounded-xl border border-zinc-900/60 bg-zinc-950/20 text-xs items-start">
                      <span className="text-zinc-600 font-mono font-bold whitespace-nowrap mt-0.5">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="space-y-0.5">
                        <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-extrabold uppercase bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/25 mr-2">
                          {evt.type}
                        </span>
                        <span className="text-zinc-300 font-medium">{evt.message}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Setup layout when Meta is not connected */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <AppCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Meta Ads Integration</h2>
                  <p className="text-xs text-muted mt-1">
                    Connect this client's Facebook ad account to automatically synchronize Lead Ads data.
                  </p>
                </div>
                <MetaStatusBadge status={client?.metaTokenStatus} />
              </div>

              {metaError && (
                <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-semibold text-red-500">
                  {metaError}
                </div>
              )}

              <button
                onClick={handleMetaConnect}
                disabled={connectingMeta}
                className="w-full rounded-2xl py-3.5 text-xs font-extrabold uppercase tracking-widest transition-premium bg-primary text-white hover:bg-primary/90 cursor-pointer disabled:opacity-50"
              >
                {connectingMeta ? 'Redirecting to Facebook...' : '🔗 Connect Meta Ad Account'}
              </button>
            </AppCard>

            {/* Webhook Routing (Only if not connected) */}
            <AppCard className="p-6">
              <h2 className="text-lg font-bold text-foreground">Webhook Routing</h2>
              <p className="text-xs text-muted mb-4">
                Set the Facebook Page ID so incoming webhook leads are routed to this client automatically.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={metaPageId}
                  onChange={(e) => setMetaPageId(e.target.value)}
                  className="flex-1 rounded-2xl border border-border bg-card text-foreground px-4.5 py-3 text-xs font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-premium"
                  placeholder="e.g. 123456789012345"
                />
                <button
                  onClick={async () => {
                    try {
                      await api.put(`/v1/agency/clients/${clientId}`, { businessName, email });
                      await api.post(`/v1/agency/clients/${clientId}/meta-connect`, { metaPageId });
                      addToast('Page ID saved for webhook routing.', 'success');
                      fetchClient();
                    } catch (err: any) {
                      setClientUpdateError(err.response?.data?.error?.message || 'Failed to save Page ID.');
                      addToast('Failed to save Page ID.', 'error');
                    }
                  }}
                  className="rounded-2xl bg-primary hover:bg-primary/90 px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-white transition-premium cursor-pointer"
                >
                  Save
                </button>
              </div>
            </AppCard>

            {renderGoogleSheetsCard()}
          </div>

          <div>
            {renderClientSettingsCard()}
          </div>
        </div>
      )}

      {/* Leads table at the bottom — shown only when not connected, or when connected and on the Overview tab */}
      {(!isConnected || activeTab === 'Overview') && renderLeadsSection()}

      {/* Slide-over Lead Detail Sidebar Panel */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-900 bg-zinc-950 p-6 flex flex-col justify-between shadow-2xl relative animate-in slide-in-from-right duration-200 text-left">
            <button
              onClick={() => setSelectedLead(null)}
              className="absolute top-4 right-4 p-1 rounded hover:bg-zinc-900 text-zinc-500 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-6 overflow-y-auto pr-1">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                  Lead Summary
                </span>
                <h3 className="text-xl font-bold text-white mt-3">{selectedLead.name}</h3>
                <p className="text-xs text-zinc-500 mt-1">Captured {new Date(selectedLead.createdTime).toLocaleString()}</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3 bg-zinc-900/30 rounded-xl border border-zinc-900 space-y-2.5 text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Email Address</span>
                    <span className="font-semibold">{selectedLead.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Phone Number</span>
                    <span className="font-semibold">{selectedLead.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Campaign</span>
                    <span className="font-semibold text-white truncate max-w-[200px]">{selectedLead.campaign}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Adset Group</span>
                    <span className="font-semibold">{selectedLead.adset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Ad Creative</span>
                    <span className="font-semibold">{selectedLead.ad}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Form ID</span>
                    <span className="font-semibold text-cyan-400 font-mono">{selectedLead.form}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Meta Lead ID</span>
                    <span className="font-semibold font-mono">{selectedLead.metaLeadId}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-900 pt-4 flex gap-3">
              <button
                onClick={() => setSelectedLead(null)}
                className="w-full py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-900 font-bold text-xs transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : toast.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <span className="text-sm font-semibold flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PercentIcon() {
  return (
    <span className="font-bold text-xs flex items-center justify-center h-[18px] w-[18px] select-none">%</span>
  );
}
