'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { 
  Send, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  RotateCw, 
  User, 
  Plus,
  ArrowLeft,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AppCard } from '@/components/ui/card';

interface Recipient {
  id: string;
  chatId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  recipientName: string | null;
  connectionMethod?: string;
  isActive: boolean;
  connectedAt: string;
}

interface TelegramIntegration {
  id: string;
  botName: string;
  botUsername: string;
  botUrl: string;
  isConnected: boolean;
  recipientsCount: number;
  recipients: Recipient[];
}

interface TelegramStatus {
  telegramEnabled: boolean;
  integrations: TelegramIntegration[];
}

export default function ClientTelegramIntegrationPage() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Connection Form states
  const [botTokenInput, setBotTokenInput] = useState('');
  const [chatIdInput, setChatIdInput] = useState('');
  const [recipientNameInput, setRecipientNameInput] = useState('');
  const [connectingBot, setConnectingBot] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [justConnectedBot, setJustConnectedBot] = useState<any | null>(null);

  const loadTelegramStatus = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      setErrorMsg(null);
      const res = await api.get('/v1/client/telegram/status');
      setStatus(res.data.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to fetch Telegram configurations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTelegramStatus();
  }, [loadTelegramStatus]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botTokenInput.trim() || !chatIdInput.trim()) {
      setErrorMsg('Please enter both Bot Token and Chat ID.');
      return;
    }
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setConnectingBot(true);
      
      const res = await api.post('/v1/client/telegram/connect', { 
        botToken: botTokenInput.trim(),
        chatId: chatIdInput.trim(),
        recipientName: recipientNameInput.trim() || undefined
      });
      
      setBotTokenInput('');
      setChatIdInput('');
      setRecipientNameInput('');
      setIsConfiguring(false);
      
      // Store just connected details for success screen
      setJustConnectedBot({
        botName: res.data.integration.botName,
        botUsername: res.data.integration.botUsername,
        recipientName: res.data.recipient.recipientName || 'Unnamed Recipient',
        chatId: res.data.recipient.chatId,
        id: res.data.integration.id
      });
      
      setSuccessMsg('Telegram bot connected successfully!');
      loadTelegramStatus(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to connect Telegram bot.');
    } finally {
      setConnectingBot(false);
    }
  };

  const handleTestConnection = async () => {
    if (!botTokenInput.trim() || !chatIdInput.trim()) {
      setErrorMsg('Please enter both Bot Token and Chat ID to test.');
      return;
    }
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setTestingConnection(true);
      await api.post('/v1/client/telegram/test-connection', {
        botToken: botTokenInput.trim(),
        chatId: chatIdInput.trim(),
      });
      setSuccessMsg('✅ Connection Successful! Test message delivered.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Connection test failed.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDisconnect = async (integrationId: string, botName: string) => {
    if (!confirm(`Are you sure you want to disconnect bot "${botName}"? All registered chat recipients for this bot will be removed.`)) {
      return;
    }
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setLoading(true);
      await api.delete(`/v1/client/telegram/disconnect/${integrationId}`);
      setSuccessMsg(`Telegram bot "${botName}" disconnected successfully.`);
      setJustConnectedBot(null);
      loadTelegramStatus(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to disconnect Telegram bot.');
      setLoading(false);
    }
  };

  const handleRemoveRecipient = async (recipientId: string) => {
    if (!confirm('Remove this recipient from lead notifications?')) {
      return;
    }
    try {
      setErrorMsg(null);
      await api.delete(`/v1/client/telegram/recipients/${recipientId}`);
      setSuccessMsg('Recipient removed successfully.');
      loadTelegramStatus(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to remove recipient.');
    }
  };

  const [sendingTest, setSendingTest] = useState(false);

  const handleSendTestAlert = async () => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setSendingTest(true);
      await api.post('/v1/client/telegram/test-alert');
      setSuccessMsg('Test notification sent successfully to all active Telegram recipients!');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to send test alert.');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSimulateWebhook = async (integrationId: string) => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      await api.post(`/v1/telegram/webhook/${integrationId}`, {
        update_id: 123456789,
        message: {
          message_id: 1,
          from: {
            id: 123456789,
            first_name: "Mock",
            last_name: "User",
            username: "mock_user"
          },
          chat: {
            id: 123456789,
            first_name: "Mock",
            last_name: "User",
            username: "mock_user",
            type: "private"
          },
          date: Math.floor(Date.now() / 1000),
          text: `/start integration_${integrationId}`
        }
      });
      setSuccessMsg('✅ Webhook update simulated successfully!');
      loadTelegramStatus(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to simulate webhook call.');
    }
  };

  if (loading && !status) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading Telegram status...</p>
        </div>
      </div>
    );
  }

  const integrations = status?.integrations || [];
  const totalRecipientsCount = integrations.reduce((acc, curr) => acc + curr.recipientsCount, 0);

  if (justConnectedBot) {
    return (
      <div className="space-y-8 max-w-xl mx-auto py-4">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Connect Telegram Bot</h1>
          <p className="text-slate-400 mt-1">Connect your Telegram bot and register a recipient chat to receive instant lead alerts.</p>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-8 space-y-6 text-center shadow-xl">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">✅ Telegram Bot Connected</h2>
            <p className="text-zinc-400 text-sm">Your bot is configured and ready to deliver real-time notifications.</p>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-black p-5 text-left space-y-3.5 text-sm">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-zinc-500 font-medium">Bot Name</span>
              <span className="text-white font-bold">{justConnectedBot.botName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-zinc-500 font-medium">Bot Username</span>
              <span className="text-blue-400 font-mono">@{justConnectedBot.botUsername}</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-zinc-500 font-medium">Recipient Name</span>
              <span className="text-white font-semibold">{justConnectedBot.recipientName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
              <span className="text-zinc-500 font-medium">Chat ID</span>
              <span className="text-zinc-350 font-mono">{justConnectedBot.chatId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-medium">Status</span>
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-xs">Connected</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            <button
              onClick={handleSendTestAlert}
              disabled={sendingTest}
              className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer animate-pulse-subtle"
            >
              {sendingTest ? 'Sending...' : '🧪 Send Test Alert'}
            </button>
            <button
              onClick={() => handleDisconnect(justConnectedBot.id, justConnectedBot.botName)}
              className="flex-1 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 py-3 text-xs font-bold text-red-400 transition-all cursor-pointer"
            >
              Disconnect Bot
            </button>
            <button
              onClick={() => {
                setJustConnectedBot(null);
                setSuccessMsg(null);
              }}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 py-3 text-xs font-bold text-zinc-300 transition-all cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations Hub</h1>
        <p className="text-slate-400 mt-1">Configure lead triggers and communication channels.</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-3">
        <Link 
          href="/client/integrations/google-sheets"
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all text-zinc-400 hover:text-white"
        >
          📂 Google Sheets
        </Link>
        <Link 
          href="/client/integrations/telegram"
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-primary/10 border border-primary/20 text-primary"
        >
          ✈ Telegram Alert Bot
        </Link>
      </div>

      {/* Notifications */}
      {(errorMsg || successMsg) && (
        <div
          className={`rounded-xl p-4 text-sm border flex items-center gap-3 animate-fade-in ${
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

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Configure new bot panel */}
          {isConfiguring ? (
            <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-400" />
                  <h2 className="text-xl font-bold">Connect New Telegram Bot</h2>
                </div>
                <button
                  onClick={() => setIsConfiguring(false)}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
              </div>

              <form onSubmit={handleConnect} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Telegram Bot Token <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={botTokenInput}
                    onChange={(e) => setBotTokenInput(e.target.value)}
                    placeholder="123456789:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full rounded-lg border border-zinc-900 bg-black px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    disabled={connectingBot || testingConnection}
                    required
                  />
                  <p className="text-[10px] text-zinc-500 mt-1.5">
                    Create a bot using <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">@BotFather</a> and paste the HTTP API token.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Chat ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={chatIdInput}
                    onChange={(e) => setChatIdInput(e.target.value)}
                    placeholder="e.g. 123456789 (Private), -1001234567890 (Group/Channel)"
                    className="w-full rounded-lg border border-zinc-900 bg-black px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    disabled={connectingBot || testingConnection}
                    required
                  />
                  <p className="text-[10px] text-zinc-500 mt-1.5">
                    Enter the Telegram Chat ID where alerts should be delivered. Private, Group, or Channel IDs are supported.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={recipientNameInput}
                    onChange={(e) => setRecipientNameInput(e.target.value)}
                    placeholder="e.g. Owner, Sales Manager, Admin, Branch Manager"
                    className="w-full rounded-lg border border-zinc-900 bg-black px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    disabled={connectingBot || testingConnection}
                  />
                  <p className="text-[10px] text-zinc-500 mt-1.5">
                    A friendly label for this chat recipient (Optional).
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={connectingBot || testingConnection || !botTokenInput.trim() || !chatIdInput.trim()}
                    className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-500 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {connectingBot ? 'Connecting Bot...' : '🔗 Connect Bot & Enable Alerts'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={connectingBot || testingConnection || !botTokenInput.trim() || !chatIdInput.trim()}
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 py-3 text-sm font-semibold text-zinc-300 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {testingConnection ? 'Testing...' : '🧪 Test Connection'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // Bots dashboard lists
            <div className="space-y-6">
              
              {/* Header Status Controls */}
              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-white">Telegram Integration Bots</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Alert recipients via multiple configured Telegram bots.</p>
                </div>
                <div className="flex gap-2">
                  {totalRecipientsCount > 0 && (
                    <button
                      onClick={handleSendTestAlert}
                      disabled={sendingTest}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-black hover:bg-zinc-900 px-3.5 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {sendingTest ? 'Sending...' : '🧪 Send Test Alert'}
                    </button>
                  )}
                  <button
                    onClick={() => loadTelegramStatus(true)}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-black hover:bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCw size={12} className={refreshing ? 'animate-spin' : ''} /> Refresh
                  </button>
                  <button
                    onClick={() => setIsConfiguring(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    <Plus size={14} /> Connect New Bot
                  </button>
                </div>
              </div>

              {integrations.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-zinc-900 bg-zinc-950 space-y-4">
                  <div className="mx-auto w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-650">
                    <Send className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-white text-sm">No Telegram Bots Connected</p>
                    <p className="text-zinc-500 text-xs max-w-sm mx-auto">Sync lead alerts to your private chats or business channels by connecting a custom Telegram bot.</p>
                  </div>
                  <button
                    onClick={() => setIsConfiguring(true)}
                    className="rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Connect a Bot
                  </button>
                </div>
              ) : (
                integrations.map((bot) => (
                  <div key={bot.id} className="rounded-xl border border-zinc-900 bg-zinc-950 overflow-hidden space-y-4 p-6">
                    
                    {/* Bot Title Header Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/10">
                          <Send size={16} />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{bot.botName}</h3>
                          <p className="text-[10px] text-zinc-500 mt-0.5">@{bot.botUsername}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={bot.botUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold transition-all"
                        >
                          Link Recipient <ExternalLink size={10} />
                        </a>
                        <button
                          onClick={() => handleDisconnect(bot.id, bot.botName)}
                          className="text-[10px] font-bold text-red-400 hover:underline px-2.5 py-1.5"
                        >
                          Disconnect Bot
                        </button>
                      </div>
                    </div>

                    {/* Linking instructions block */}
                    <div className="p-3.5 rounded-lg bg-black/40 border border-zinc-900/60 text-[11px] text-zinc-400 leading-normal space-y-1.5">
                      <p className="font-semibold text-zinc-300">To link a recipient (group/chat):</p>
                      <ol className="list-decimal pl-4 space-y-1 text-zinc-400">
                        <li>Click <b>Link Recipient</b> above (or search bot on Telegram).</li>
                        <li>Send the bot a message or click <b>Start</b> (deep links link automatically).</li>
                        <li>Refresh this page, and the recipient chat details will appear below!</li>
                      </ol>
                      <div className="pt-2 border-t border-zinc-900/40 mt-1 flex justify-between items-center">
                        <span className="text-[10px] text-zinc-500">Developing locally?</span>
                        <button
                          onClick={() => handleSimulateWebhook(bot.id)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-zinc-300 rounded transition-all cursor-pointer"
                        >
                          🧪 Simulate /Start Webhook
                        </button>
                      </div>
                    </div>

                    {/* Recipients Section */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-zinc-300">Connected Recipients ({bot.recipientsCount})</h4>
                      
                      {bot.recipients.length === 0 ? (
                        <p className="text-zinc-500 text-xs italic py-2">No active recipients connected to this bot yet.</p>
                      ) : (
                        <div className="divide-y divide-zinc-900 bg-black/25 rounded-lg border border-zinc-900 px-4">
                          {bot.recipients.map((recipient) => (
                            <div key={recipient.id} className="py-3 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-7 w-7 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                  <User size={13} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white text-[11px]">
                                    {recipient.recipientName 
                                      ? recipient.recipientName 
                                      : recipient.firstName 
                                        ? `${recipient.firstName} ${recipient.lastName || ''}` 
                                        : 'Telegram Chat'}
                                  </p>
                                  <p className="text-[9px] text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span>{recipient.username ? `@${recipient.username}` : `Chat ID: ${recipient.chatId}`}</span>
                                    {recipient.connectionMethod && (
                                      <span className="text-[7.5px] font-bold text-zinc-500 px-1 py-0.2 bg-zinc-900 border border-zinc-800 rounded uppercase tracking-wider shrink-0">
                                        {recipient.connectionMethod}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                  Active
                                </span>
                                <button
                                  onClick={() => handleRemoveRecipient(recipient.id)}
                                  className="p-1.5 rounded hover:bg-red-500/10 text-red-400 transition-colors"
                                  title="Remove recipient"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                ))
              )}

            </div>
          )}

        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <AppCard className="p-6 space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-zinc-900 pb-2">Sync Preferences</h3>
            
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Status</span>
                <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Total Bots Connected</span>
                <span className="text-zinc-300 font-bold">{integrations.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Trigger Frequency</span>
                <span className="text-zinc-500 font-semibold">Real-time (0s)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Active Recipients</span>
                <span className="text-zinc-300 font-bold">{totalRecipientsCount} chats</span>
              </div>
            </div>
          </AppCard>

          <AppCard className="p-6 space-y-4 bg-zinc-950/40">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <MessageSquare size={14} className="text-blue-400" /> Lead Alert Style
            </h3>
            <p className="text-[10.5px] text-zinc-500">Messages will be formatted using standard Markdown syntax in Telegram:</p>
            
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900/60 font-mono text-[10px] text-zinc-300 space-y-1">
              <p>🔔 <b>New Lead Received!</b></p>
              <p>👤 <b>Name:</b> John Doe</p>
              <p>📞 <b>Phone:</b> +91 98765 43210</p>
              <p>📧 <b>Email:</b> john@example.com</p>
              <p>📍 <b>Source:</b> Facebook Ads</p>
              <p>🕒 <b>Time:</b> 11/07/2026, 16:30 PM</p>
              <p className="text-blue-400 text-[9px] mt-2 underline">👉 Open in GrowPhil CRM</p>
            </div>
          </AppCard>
        </div>

      </div>
    </div>
  );
}
