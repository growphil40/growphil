'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../../lib/api';
import { Database, ArrowLeftRight, Calendar, AlertCircle, CheckCircle2, RotateCw } from 'lucide-react';

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
  const [activeConnection, setActiveConnection] = useState<SpreadsheetConnection | null>(null);

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

  // Sync intervals
  const [syncInterval, setSyncInterval] = useState(900);
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
        const conn = connectionsRes.data.data[0] || null; // Support single connection in UI currently
        setActiveConnection(conn);

        if (conn) {
          // Pre-populate mappings
          const maps: Record<string, string> = {};
          conn.mappings.forEach((m: any) => {
            maps[m.crmField] = m.sheetColumn;
          });
          setFieldMappings(maps);
          // Preload sheet headers
          fetchSheetHeaders(conn.spreadsheetId, conn.sheetName);
        } else {
          // If no connection, fetch spreadsheets list for setup
          fetchSpreadsheets();
        }

        // 3. Load sync logs history
        loadSyncHistory();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to verify connection status.');
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    loadStatusAndConnections();
  }, [loadStatusAndConnections]);

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
      setErrorMsg(err.response?.data?.error?.message || 'Failed to fetch spreadsheet details. Ensure your Google account is connected and the link is correct.');
    } finally {
      setFetchingUrlInfo(false);
    }
  };

  /**
   * Save Spreadsheet Connection & Column mappings in a unified flow
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

    // Verify at least Name column mapped
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

      setSuccessMsg('Google Sheet spreadsheet connection configured and activated successfully!');
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
  const handleRemoveConnection = async () => {
    if (!activeConnection) return;
    if (!confirm('Are you sure you want to disconnect this Google Sheet? Sync logs history will be preserved.')) return;

    try {
      setErrorMsg(null);
      await api.delete(`/v1/google/connections/${activeConnection.id}`);
      setSuccessMsg('Google Sheet disconnected.');
      setActiveConnection(null);
      setFieldMappings({ name: '', email: '', phone: '', source: '', city: '' });
      setSelectedSpreadsheetId('');
      setSelectedSheetName('');
      setHeaders([]);
      fetchSpreadsheets();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to remove connection.');
    }
  };

  /**
   * Toggle background synchronization status
   */
  const handleToggleSync = async () => {
    if (!activeConnection) return;
    try {
      setErrorMsg(null);
      const nextStatus = !activeConnection.syncEnabled;
      const res = await api.patch(`/v1/google/connections/${activeConnection.id}`, {
        syncEnabled: nextStatus,
      });
      setActiveConnection(res.data.data);
      setSuccessMsg(nextStatus ? 'Spreadsheet auto-sync enabled.' : 'Spreadsheet auto-sync disabled.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to toggle sync.');
    }
  };

  /**
   * Trigger Manual sync
   */
  const handleSyncNow = async () => {
    if (!activeConnection) return;
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setSyncStats(null);
      setSyncingNow(true);

      const res = await api.post('/v1/google/sync-now', {
        connectionId: activeConnection.id,
      });

      setSyncStats(res.data.data);
      setSuccessMsg('Manual synchronisation completed successfully!');
      loadSyncHistory();
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
        <h1 className="text-3xl font-bold tracking-tight">Google Sheets Connector</h1>
        <p className="text-slate-400 mt-1">Automatically synchronize leads from spreadsheet rows in real-time</p>
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
          
          {/* Configuration Form / Active Sync Panel */}
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
                  if (confirm('Disconnect Google account? Active spreadsheet connections will be removed.')) {
                    try {
                      await api.delete(`/v1/google/connections/all`); // Disconnect completely or delete conn
                      loadStatusAndConnections();
                    } catch {
                      // fallback: remove spreadsheets and status if api doesn't delete-all
                      await api.get('/v1/google/connect'); // retry status trigger
                      loadStatusAndConnections();
                    }
                  }
                }}
                className="text-xs font-semibold text-red-400 hover:underline cursor-pointer"
              >
                Disconnect Account
              </button>
            </div>

            {/* Config Box */}
            {!activeConnection ? (
              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-[#3B82F6]" />
                  <h2 className="text-xl font-bold">Configure Google Sheet Connection</h2>
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
                      setSuccessMsg(null);
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
                      setSuccessMsg(null);
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
                  {/* Select File via Drive */}
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

                  {/* Select File via URL */}
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
                        <p className="text-[10px] text-zinc-500 mt-1.5">
                          Make sure you have granted permission for the sheet to your connected Google account.
                        </p>
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

                  {/* Spreadsheet Name resolved readout (readonly) */}
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

                  {/* Sync Settings */}
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

                      {/* Header Mapping Section */}
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
                                {headers.length === 0 && (
                                  <option value="" disabled>No columns detected. Save connection to map manually.</option>
                                )}
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
            ) : (
              /* Connected Active Sheet Panel */
              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Active Spreadsheet Integration</h2>
                    <p className="text-xs text-zinc-500 mt-1">Currently synchronising rows from the selected file.</p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                      activeConnection.syncEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}
                  >
                    {activeConnection.syncEnabled ? 'Auto-Sync Active' : 'Auto-Sync Disabled'}
                  </span>
                </div>

                {/* Connection Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-black border border-zinc-900 p-4">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Spreadsheet</p>
                    <p className="text-sm font-bold text-white truncate">{activeConnection.spreadsheetName}</p>
                    <p className="text-[10px] font-mono text-zinc-600 mt-0.5 truncate">{activeConnection.spreadsheetId}</p>
                  </div>
                  <div className="rounded-lg bg-black border border-zinc-900 p-4">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Sheet Tab Name</p>
                    <p className="text-sm font-bold text-white">{activeConnection.sheetName}</p>
                  </div>
                  <div className="rounded-lg bg-black border border-zinc-900 p-4">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Interval</p>
                    <p className="text-sm font-bold text-white">Every {activeConnection.syncInterval} minutes</p>
                  </div>
                </div>

                {/* Last Sync Details */}
                <div className="text-xs text-zinc-400">
                  📅 Last Synchronized:{' '}
                  <span className="text-zinc-200 font-medium">
                    {activeConnection.lastSyncAt ? new Date(activeConnection.lastSyncAt).toLocaleString() : 'Never synced yet.'}
                  </span>
                </div>

                {/* Column mapping details table */}
                <div className="border-t border-zinc-900 pt-6">
                  <h3 className="font-bold text-sm text-zinc-300 mb-3">Field Mappings Map</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {activeConnection.mappings.map((m) => (
                      <div key={m.crmField} className="flex justify-between p-2.5 rounded bg-black/60 border border-zinc-900/60">
                        <span className="text-zinc-500 capitalize">{m.crmField} field</span>
                        <span className="font-semibold text-white">{m.sheetColumn} column</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Integration Actions */}
                <div className="border-t border-zinc-900 pt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSyncNow}
                    disabled={syncingNow}
                    className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className={`h-4.5 w-4.5 ${syncingNow ? 'animate-spin' : ''}`} />
                    {syncingNow ? 'Syncing spreadsheet rows...' : 'Sync Spreadsheet Now'}
                  </button>
                  <button
                    onClick={handleToggleSync}
                    className="flex-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 py-3 text-sm font-semibold text-white border border-zinc-700 transition-all cursor-pointer"
                  >
                    {activeConnection.syncEnabled ? '⏸️ Pause Auto-Sync' : '▶️ Resume Auto-Sync'}
                  </button>
                  <button
                    onClick={handleRemoveConnection}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-5 py-3 text-sm font-semibold transition-all cursor-pointer"
                  >
                    Disconnect Sheet
                  </button>
                </div>

                {/* Statistics Box */}
                {syncStats && (
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-5 mt-4 space-y-3">
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

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {history.map((log) => (
                <div key={log.id} className="p-3.5 rounded-lg border border-zinc-900 bg-black/40 text-xs space-y-2">
                  <div className="flex justify-between font-bold text-zinc-400">
                    <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                    <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Total Rows</span>
                      <span className="font-semibold text-zinc-300">{log.totalRows}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-500/70">Imported</span>
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

