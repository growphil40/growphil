'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { Database, ArrowLeftRight, Calendar, AlertCircle, CheckCircle2, RotateCw, Plus, ArrowLeft, Eye, Trash2 } from 'lucide-react';

interface GoogleConnection {
  googleEmail: string;
  createdAt: string;
}

interface SpreadsheetConnection {
  id: string;
  spreadsheetId: string;
  spreadsheetName: string;
  sheetName: string;
  syncInterval: number;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  mappings: { crmField: string; sheetColumn: string }[];
}

interface HistoryLog {
  id: string;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  failedRows: number;
  spreadsheetName?: string | null;
  sheetTabName?: string | null;
  createdAt: string;
}

const CRM_FIELDS = [
  { value: 'name', label: 'Customer Name (name)' },
  { value: 'email', label: 'Email Address (email)' },
  { value: 'phone', label: 'Phone Number (phone)' },
  { value: 'source', label: 'Campaign / Source (source)' },
  { value: 'city', label: 'City (city)' },
];

export default function GoogleSheetsIntegrationPage() {
  // Connections and integrations state
  const [googleConn, setGoogleConn] = useState<GoogleConnection | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [connections, setConnections] = useState<SpreadsheetConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<SpreadsheetConnection | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);

  // Selector dropdowns state
  const [spreadsheets, setSpreadsheets] = useState<{ id: string; name: string }[]>([]);
  const [loadingSpreadsheets, setLoadingSpreadsheets] = useState(false);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState('');
  
  const [sheets, setSheets] = useState<{ name: string }[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [selectedSheetName, setSelectedSheetName] = useState('');

  // Headers list for mappings
  const [headers, setHeaders] = useState<string[]>([]);
  const [loadingHeaders, setLoadingHeaders] = useState(false);

  // Mapping state
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({
    name: '',
    email: '',
    phone: '',
    source: '',
    city: '',
  });

  // Sync intervals (default is 15 mins)
  const [syncInterval, setSyncInterval] = useState(15);
  const [savingConnection, setSavingConnection] = useState(false);

  // Manual sync and stats
  const [syncingNow, setSyncingNow] = useState(false);
  const [syncStats, setSyncStats] = useState<{
    totalRows: number;
    importedRows: number;
    duplicateRows: number;
    failedRows: number;
  } | null>(null);

  // Logs state
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Alert notices
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Link by URL state
  const [connectMode, setConnectMode] = useState<'drive' | 'url'>('drive');
  const [sheetUrl, setSheetUrl] = useState('');
  const [fetchingUrlInfo, setFetchingUrlInfo] = useState(false);
  const [resolvedSpreadsheetName, setResolvedSpreadsheetName] = useState('');

  /**
   * Load current statuses
   */
  const loadStatusAndConnections = useCallback(async () => {
    try {
      setCheckingStatus(true);
      setErrorMsg(null);

      // 1. Fetch Google auth connection status
      const googleRes = await api.get('/v1/google/status');
      setGoogleConn(googleRes.data.data);

      if (googleRes.data.data) {
        // 2. Load client connections
        const connectionsRes = await api.get('/v1/google/connections');
        const conns = connectionsRes.data.data || [];
        setConnections(conns);

        // Update active connection if currently viewing details
        if (activeConnection) {
          const updated = conns.find((c: any) => c.id === activeConnection.id);
          setActiveConnection(updated || null);
        }

        // Fetch spreadsheets for selector dropdown list
        fetchSpreadsheets();

        // 3. Load sync logs history
        loadSyncHistory();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to verify connection status.');
    } finally {
      setCheckingStatus(false);
    }
  }, [activeConnection]);

  useEffect(() => {
    loadStatusAndConnections();
  }, []);

  /**
   * Triggers Google account connection OAuth handshake.
   */
  const handleConnectGoogle = async () => {
    try {
      setErrorMsg(null);
      const res = await api.get('/v1/google/connect');
      const { oauthUrl } = res.data.data;
      if (oauthUrl) {
        window.location.href = oauthUrl;
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to initiate Google OAuth.');
    }
  };

  /**
   * Fetch spreadsheets from Google Drive
   */
  async function fetchSpreadsheets() {
    try {
      setLoadingSpreadsheets(true);
      const res = await api.get('/v1/google/spreadsheets');
      setSpreadsheets(res.data.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingSpreadsheets(false);
    }
  }

  /**
   * Fetch sheet tabs inside a spreadsheet
   */
  const handleSpreadsheetChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedSpreadsheetId(id);
    setSelectedSheetName('');
    setSheets([]);
    setHeaders([]);

    if (!id) return;

    try {
      setLoadingSheets(true);
      const res = await api.get(`/v1/google/spreadsheets/${id}/sheets`);
      setSheets(res.data.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to fetch spreadsheet tabs.');
    } finally {
      setLoadingSheets(false);
    }
  };

  /**
   * Fetch sheet headers
   */
  async function fetchSheetHeaders(spreadsheetId: string, sheetName: string) {
    try {
      setLoadingHeaders(true);
      const res = await api.get(`/v1/google/spreadsheets/${spreadsheetId}/sheets/${encodeURIComponent(sheetName)}/headers`);
      setHeaders(res.data.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingHeaders(false);
    }
  }

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedSheetName(name);
    if (name && selectedSpreadsheetId) {
      fetchSheetHeaders(selectedSpreadsheetId, name);
    }
  };

  const handleFetchSpreadsheetByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setResolvedSpreadsheetName('');
    setSelectedSpreadsheetId('');
    setSelectedSheetName('');
    setSheets([]);
    setHeaders([]);

    if (!sheetUrl) {
      setErrorMsg('Please enter a Google Sheet URL.');
      return;
    }

    try {
      setFetchingUrlInfo(true);
      const res = await api.post('/v1/google/connect-by-url', { sheetUrl });
      const { spreadsheetId, spreadsheetName, sheets } = res.data.data;

      setSelectedSpreadsheetId(spreadsheetId);
      setResolvedSpreadsheetName(spreadsheetName);
      setSheets(sheets);
      setSuccessMsg(`Successfully loaded spreadsheet: "${spreadsheetName}"`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to fetch spreadsheet details. Ensure your Google account is connected.');
    } finally {
      setFetchingUrlInfo(false);
    }
  };

  /**
   * Save Spreadsheet Connection & Column mappings
   */
  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    let spreadsheetName = '';
    if (connectMode === 'url') {
      spreadsheetName = resolvedSpreadsheetName;
    } else {
      const spreadsheet = spreadsheets.find((s) => s.id === selectedSpreadsheetId);
      spreadsheetName = spreadsheet?.name || '';
    }

    if (!selectedSpreadsheetId || !selectedSheetName || !spreadsheetName) {
      setErrorMsg('Please select a spreadsheet and sheet name.');
      return;
    }

    if (!fieldMappings.name) {
      setErrorMsg('CRM Field "Customer Name" must be mapped to a spreadsheet column.');
      return;
    }

    try {
      setSavingConnection(true);

      // 1. Create connection config
      const connRes = await api.post('/v1/google/connections', {
        spreadsheetId: selectedSpreadsheetId,
        spreadsheetName,
        sheetName: selectedSheetName,
        syncInterval: Number(syncInterval),
        sheetUrl: connectMode === 'url' ? sheetUrl : null,
      });

      const connectionId = connRes.data.data.id;

      // 2. Save column mapping rows
      const mappingsArray = Object.entries(fieldMappings)
        .filter(([_, sheetColumn]) => sheetColumn !== '')
        .map(([crmField, sheetColumn]) => ({ crmField, sheetColumn }));

      await api.post('/v1/google/mappings', {
        connectionId,
        mappings: mappingsArray,
      });

      setSuccessMsg(`Spreadsheet "${spreadsheetName}" connected and mapping saved!`);
      
      // Reset form variables
      setSelectedSpreadsheetId('');
      setSelectedSheetName('');
      setSheetUrl('');
      setResolvedSpreadsheetName('');
      setFieldMappings({ name: '', email: '', phone: '', source: '', city: '' });
      setIsConfiguring(false);

      loadStatusAndConnections();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to save configuration.');
    } finally {
      setSavingConnection(false);
    }
  };

  /**
   * Remove Connection config
   */
  const handleRemoveConnection = async (connectionId: string, sheetName: string) => {
    if (!confirm(`Are you sure you want to disconnect Google Sheet "${sheetName}"? Sync history logs will be preserved.`)) return;

    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      await api.delete(`/v1/google/connections/${connectionId}`);
      setSuccessMsg(`Spreadsheet "${sheetName}" disconnected successfully.`);
      
      if (activeConnection?.id === connectionId) {
        setActiveConnection(null);
      }
      loadStatusAndConnections();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to remove connection.');
    }
  };

  /**
   * Toggle background synchronization status
   */
  const handleToggleSync = async (connection: SpreadsheetConnection) => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      const nextStatus = !connection.syncEnabled;
      const res = await api.patch(`/v1/google/connections/${connection.id}`, {
        syncEnabled: nextStatus,
      });
      
      if (activeConnection?.id === connection.id) {
        setActiveConnection(res.data.data);
      }
      setSuccessMsg(nextStatus ? `Spreadsheet auto-sync enabled.` : `Spreadsheet auto-sync disabled.`);
      loadStatusAndConnections();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to toggle sync.');
    }
  };

  /**
   * Trigger Manual sync
   */
  const handleSyncNow = async (connectionId: string) => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setSyncStats(null);
      setSyncingNow(true);

      const res = await api.post('/v1/google/sync-now', {
        connectionId,
      });

      setSyncStats(res.data.data);
      setSuccessMsg('Spreadsheet sync execution completed successfully!');
      loadStatusAndConnections();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Manual synchronization execution failed.');
    } finally {
      setSyncingNow(false);
    }
  };

  /**
   * Load import logs history
   */
  async function loadSyncHistory() {
    try {
      setLoadingHistory(true);
      const res = await api.get('/v1/google/history');
      setHistory(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleMappingChange = (crmField: string, value: string) => {
    setFieldMappings((prev) => ({
      ...prev,
      [crmField]: value,
    }));
  };

  const startConfigureNew = () => {
    // Reset Form states
    setSelectedSpreadsheetId('');
    setSelectedSheetName('');
    setSheetUrl('');
    setResolvedSpreadsheetName('');
    setHeaders([]);
    setFieldMappings({ name: '', email: '', phone: '', source: '', city: '' });
    
    setIsConfiguring(true);
    setActiveConnection(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    fetchSpreadsheets();
  };

  const handleSelectConnection = (conn: SpreadsheetConnection) => {
    setActiveConnection(conn);
    setIsConfiguring(false);
    
    // Populate form mappings for preview
    const maps: Record<string, string> = {};
    conn.mappings.forEach((m: any) => {
      maps[m.crmField] = m.sheetColumn;
    });
    setFieldMappings(maps);
    fetchSheetHeaders(conn.spreadsheetId, conn.sheetName);
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Checking connector status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations Hub</h1>
        <p className="text-slate-400 mt-1">Configure lead triggers and communication channels.</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-3">
        <Link 
          href="/client/integrations/google-sheets"
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-primary/10 border border-primary/20 text-primary"
        >
          📂 Google Sheets
        </Link>
        <Link 
          href="/client/integrations/telegram"
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all text-zinc-400 hover:text-white"
        >
          ✈ Telegram Alert Bot
        </Link>
      </div>

      {/* Notifications */}
      {(errorMsg || successMsg) && (
        <div
          className={`rounded-xl p-4 text-sm border flex items-center gap-3 ${
            successMsg
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {successMsg ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span className="flex-1">{errorMsg || successMsg}</span>
          <button
            onClick={() => {
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-lg font-bold hover:opacity-60"
          >
            ×
          </button>
        </div>
      )}

      {/* Connect Box */}
      {!googleConn ? (
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-8 space-y-6 max-w-2xl mx-auto text-left">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] mb-2">
              <Database className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Google Sheets Integration</h2>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              Sync marketing leads gathered on Google Sheets rows into the GrowPhil CRM database automatically.
            </p>
          </div>

          <div className="text-center py-6 border-t border-zinc-900/60 space-y-4">
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              To start synchronising leads, you must first connect your Google Account to grant the CRM permissions to read your spreadsheets.
            </p>
            <button
              onClick={handleConnectGoogle}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              🔗 Connect Google Account
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Workspace Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Connection Status Card */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold">Google Account Synced</h3>
                  <p className="text-xs text-zinc-500">{googleConn.googleEmail}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (confirm('Disconnect Google account? All spreadsheet connections and mappings will be removed.')) {
                    try {
                      await api.delete(`/v1/google/connections/all`);
                      loadStatusAndConnections();
                    } catch {
                      await api.get('/v1/google/connect');
                      loadStatusAndConnections();
                    }
                  }
                }}
                className="text-xs font-semibold text-red-400 hover:underline cursor-pointer"
              >
                Disconnect Account
              </button>
            </div>

            {/* Sub-Panel 1: Add/Configure Connection Form */}
            {isConfiguring && (
              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-[#3B82F6]" />
                    <h2 className="text-xl font-bold">Configure Google Sheet Connection</h2>
                  </div>
                  <button
                    onClick={() => setIsConfiguring(false)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                </div>

                {/* Connection Mode Selection Toggle */}
                <div className="flex border-b border-zinc-900">
                  <button
                    onClick={() => {
                      setConnectMode('drive');
                      setSelectedSpreadsheetId('');
                      setSelectedSheetName('');
                      setSheets([]);
                      setHeaders([]);
                      setErrorMsg(null);
                    }}
                    type="button"
                    className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 cursor-pointer transition-colors ${
                      connectMode === 'drive'
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    📂 Choose from Drive
                  </button>
                  <button
                    onClick={() => {
                      setConnectMode('url');
                      setSelectedSpreadsheetId('');
                      setSelectedSheetName('');
                      setSheets([]);
                      setHeaders([]);
                      setErrorMsg(null);
                    }}
                    type="button"
                    className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 cursor-pointer transition-colors ${
                      connectMode === 'url'
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    🔗 Connect via Link
                  </button>
                </div>

                <form onSubmit={handleSaveConnection} className="space-y-6">
                  {connectMode === 'drive' && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        Select Google Spreadsheet
                        {loadingSpreadsheets && <span className="text-zinc-500 lowercase ml-2">(loading files...)</span>}
                      </label>
                      <select
                        value={selectedSpreadsheetId}
                        onChange={handleSpreadsheetChange}
                        className="w-full rounded-lg border border-zinc-900 bg-black px-3 py-2.5 text-sm text-white focus:outline-none"
                        disabled={loadingSpreadsheets}
                      >
                        <option value="">-- Select Spreadsheet --</option>
                        {spreadsheets.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {connectMode === 'url' && !selectedSpreadsheetId && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                          Paste Google Sheet URL
                        </label>
                        <input
                          type="text"
                          value={sheetUrl}
                          onChange={(e) => setSheetUrl(e.target.value)}
                          placeholder="e.g. https://docs.google.com/spreadsheets/d/1abcXYZ123456/edit#gid=0"
                          className="w-full rounded-lg border border-zinc-900 bg-black px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                          disabled={fetchingUrlInfo}
                        />
                      </div>
                      <button
                        onClick={handleFetchSpreadsheetByUrl}
                        disabled={fetchingUrlInfo || !sheetUrl}
                        type="button"
                        className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {fetchingUrlInfo ? 'Fetching Spreadsheet Metadata...' : 'Fetch Spreadsheet & Load Tabs'}
                      </button>
                    </div>
                  )}

                  {connectMode === 'url' && selectedSpreadsheetId && (
                    <div className="p-3.5 rounded-lg border border-zinc-900 bg-black/40 flex justify-between items-center text-xs">
                      <div>
                        <p className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Resolved Spreadsheet Name</p>
                        <p className="font-bold text-white mt-0.5">{resolvedSpreadsheetName}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSpreadsheetId('');
                          setSelectedSheetName('');
                          setSheets([]);
                          setHeaders([]);
                        }}
                        type="button"
                        className="text-[10px] text-indigo-400 hover:underline"
                      >
                        Change URL
                      </button>
                    </div>
                  )}

                  {selectedSpreadsheetId && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        Select Sheet Tab
                        {loadingSheets && <span className="text-zinc-500 lowercase ml-2">(loading tabs...)</span>}
                      </label>
                      <select
                        value={selectedSheetName}
                        onChange={handleSheetChange}
                        className="w-full rounded-lg border border-zinc-900 bg-black px-3 py-2.5 text-sm text-white focus:outline-none"
                        disabled={loadingSheets}
                      >
                        <option value="">-- Select Sheet Name --</option>
                        {sheets.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedSheetName && (
                    <div className="space-y-6 border-t border-zinc-900/60 pt-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-[#3B82F6]" />
                        <h3 className="font-bold">Sync Schedule</h3>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                          Background Auto-Sync Interval
                        </label>
                        <select
                          value={syncInterval}
                          onChange={(e) => setSyncInterval(Number(e.target.value))}
                          className="w-full rounded-lg border border-zinc-900 bg-black px-3 py-2.5 text-sm text-white focus:outline-none"
                        >
                          <option value="5">Every 5 minutes</option>
                          <option value="15">Every 15 minutes</option>
                          <option value="30">Every 30 minutes</option>
                          <option value="60">Every 1 hour</option>
                        </select>
                      </div>

                      <div className="space-y-4 border-t border-zinc-900/60 pt-6">
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="h-5 w-5 text-[#3B82F6]" />
                          <h3 className="font-bold">Lead Fields Column Mapping</h3>
                        </div>
                        <p className="text-xs text-zinc-400">
                          Map columns in your sheet to matching lead fields in the CRM database.
                          {loadingHeaders && <span className="text-zinc-500 ml-2 animate-pulse">(fetching headers...)</span>}
                        </p>

                        <div className="space-y-3">
                          {CRM_FIELDS.map((field) => (
                            <div key={field.value} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-3 rounded-lg border border-zinc-900 bg-black/40">
                              <span className="text-sm font-semibold text-zinc-300">
                                {field.label} {field.value === 'name' && <span className="text-red-500">*</span>}
                              </span>
                              <select
                                value={fieldMappings[field.value] || ''}
                                onChange={(e) => handleMappingChange(field.value, e.target.value)}
                                className="w-full rounded-lg border border-zinc-900 bg-black px-3 py-1.5 text-xs text-white focus:outline-none"
                              >
                                <option value="">-- Not Mapped --</option>
                                {headers.map((h) => (
                                  <option key={h} value={h}>
                                    {h}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={savingConnection || !fieldMappings.name}
                        className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 cursor-pointer"
                      >
                        {savingConnection ? 'Registering Connection...' : 'Save Settings & Activate Connector'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Sub-Panel 2: Active Connection Details View */}
            {activeConnection && (
              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                  <div className="flex items-center gap-3">
                    <Database className="h-5.5 w-5.5 text-[#3B82F6]" />
                    <div>
                      <h2 className="text-xl font-bold text-white truncate max-w-sm sm:max-w-md">{activeConnection.spreadsheetName}</h2>
                      <p className="text-xs text-zinc-500 mt-0.5">Tab: {activeConnection.sheetName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveConnection(null)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
                  </button>
                </div>

                {/* Connection Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-black border border-zinc-900 p-4">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Status</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold border inline-block ${
                        activeConnection.syncEnabled
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}
                    >
                      {activeConnection.syncEnabled ? 'Auto-Sync Active' : 'Auto-Sync Paused'}
                    </span>
                  </div>
                  <div className="rounded-lg bg-black border border-zinc-900 p-4">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Sync Interval</p>
                    <p className="text-sm font-bold text-white">Every {activeConnection.syncInterval} mins</p>
                  </div>
                  <div className="rounded-lg bg-black border border-zinc-900 p-4">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Last Synced</p>
                    <p className="text-xs font-bold text-zinc-300">
                      {activeConnection.lastSyncAt ? new Date(activeConnection.lastSyncAt).toLocaleString() : 'Never synced yet.'}
                    </p>
                  </div>
                </div>

                {/* Column mapping details table */}
                <div className="border-t border-zinc-900 pt-6">
                  <h3 className="font-bold text-sm text-zinc-300 mb-3">CRM Field Mappings Map</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {activeConnection.mappings.map((m) => (
                      <div key={m.crmField} className="flex justify-between p-2.5 rounded bg-black/60 border border-zinc-900/60">
                        <span className="text-zinc-500 capitalize">{m.crmField} field</span>
                        <span className="font-semibold text-white">{m.sheetColumn} column</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-zinc-900 pt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleSyncNow(activeConnection.id)}
                    disabled={syncingNow}
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className={`h-4.5 w-4.5 ${syncingNow ? 'animate-spin' : ''}`} />
                    {syncingNow ? 'Syncing...' : 'Sync Spreadsheet Now'}
                  </button>
                  <button
                    onClick={() => handleToggleSync(activeConnection)}
                    className="flex-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 py-3 text-sm font-semibold text-white border border-zinc-700 transition-all cursor-pointer"
                  >
                    {activeConnection.syncEnabled ? '⏸ Pause Auto-Sync' : '▶ Resume Auto-Sync'}
                  </button>
                  <button
                    onClick={() => handleRemoveConnection(activeConnection.id, activeConnection.spreadsheetName)}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-5 py-3 text-sm font-semibold transition-all cursor-pointer"
                  >
                    Disconnect Sheet
                  </button>
                </div>

                {/* Statistics Box */}
                {syncStats && (
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Import Statistics</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase">Rows Evaluated</p>
                        <p className="text-lg font-bold text-zinc-200 mt-1">{syncStats.totalRows}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase">New Leads</p>
                        <p className="text-lg font-bold text-emerald-400 mt-1">+{syncStats.importedRows}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase">Duplicates</p>
                        <p className="text-lg font-bold text-amber-500 mt-1">{syncStats.duplicateRows}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase">Errors</p>
                        <p className="text-lg font-bold text-red-500 mt-1">{syncStats.failedRows}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Panel 3: Connections Dashboard List */}
            {!isConfiguring && !activeConnection && (
              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Google Spreadsheet Connections</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Manage connected sheet sources for syncing leads.</p>
                  </div>
                  <button
                    onClick={startConfigureNew}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    <Plus size={14} /> Add Spreadsheet Connection
                  </button>
                </div>

                {connections.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-650">
                      <Database className="h-6 w-6" />
                    </div>
                    <p className="text-zinc-500 text-sm italic">No Google spreadsheets connected yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider font-semibold">
                          <th className="pb-3 pr-4">Spreadsheet / Tab</th>
                          <th className="pb-3 px-4">Interval</th>
                          <th className="pb-3 px-4">Status</th>
                          <th className="pb-3 px-4">Last Synced</th>
                          <th className="pb-3 pl-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {connections.map((conn) => (
                          <tr key={conn.id} className="border-b border-zinc-900/60 hover:bg-zinc-900/10 transition-colors">
                            <td className="py-4 pr-4">
                              <span className="font-bold text-white block text-sm max-w-[200px] truncate">{conn.spreadsheetName}</span>
                              <span className="text-[10px] text-zinc-500 block mt-0.5 font-medium">Tab: {conn.sheetName}</span>
                            </td>
                            <td className="py-4 px-4 text-zinc-300 font-medium">Every {conn.syncInterval}m</td>
                            <td className="py-4 px-4">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                  conn.syncEnabled
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                }`}
                              >
                                {conn.syncEnabled ? 'Active' : 'Paused'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-zinc-500 font-mono text-[10px]">
                              {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleDateString() + ' ' + new Date(conn.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                            </td>
                            <td className="py-4 pl-4 text-right flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSelectConnection(conn)}
                                className="p-2 rounded hover:bg-zinc-900 text-zinc-400 hover:text-white"
                                title="View details & mappings"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handleToggleSync(conn)}
                                className="text-[10px] font-bold px-2 py-1.5 rounded border border-zinc-800 bg-black hover:bg-zinc-900 text-zinc-400 hover:text-white"
                              >
                                {conn.syncEnabled ? 'Pause' : 'Resume'}
                              </button>
                              <button
                                onClick={() => handleSyncNow(conn.id)}
                                className="p-2 rounded hover:bg-zinc-900 text-emerald-400"
                                title="Sync now"
                              >
                                <RotateCw size={14} />
                              </button>
                              <button
                                onClick={() => handleRemoveConnection(conn.id, conn.spreadsheetName)}
                                className="p-2 rounded hover:bg-red-500/10 text-red-400/80 hover:text-red-400"
                                title="Disconnect"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sync History Logs Panel */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 h-fit space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Import History Logs</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Summary logs of past data transfers</p>
            </div>

            {loadingHistory && <p className="text-zinc-500 text-xs animate-pulse">Loading import history logs...</p>}

            {!loadingHistory && history.length === 0 && (
              <p className="text-zinc-500 text-xs italic">No import sync logs recorded yet.</p>
            )}

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {history.map((log) => (
                <div key={log.id} className="p-3.5 rounded-lg border border-zinc-900 bg-black/40 text-xs space-y-2">
                  <div className="flex justify-between font-bold text-zinc-400">
                    <span className="text-zinc-300 truncate max-w-[120px]">{log.spreadsheetName || 'Spreadsheet'}</span>
                    <span className="text-zinc-500">{new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-zinc-900/60 pt-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Evaluated</span>
                      <span className="font-semibold text-zinc-300">{log.totalRows}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-500/70">New Leads</span>
                      <span className="font-bold text-emerald-400">+{log.importedRows}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-500/70">Duplicates</span>
                      <span className="font-semibold text-amber-500">{log.duplicateRows}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-500/70">Failed</span>
                      <span className="font-semibold text-red-400">{log.failedRows}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
