'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';
import { Button } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Shield, 
  Database, 
  Bell, 
  Key, 
  Wallet, 
  Copy, 
  Check, 
  Plus, 
  Lock,
  Mail,
  Sliders,
  CheckCircle2,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Info,
  Globe,
  Cpu,
  ChevronRight,
  Sparkles,
  Users,
  Send
} from 'lucide-react';

type TabType = 'general' | 'users' | 'integrations' | 'notifications' | 'security' | 'billing';

// Custom premium toggle component using Framer Motion
const CustomToggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => {
  return (
    <div 
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full p-0.5 cursor-pointer transition-all duration-300 ${
        checked ? 'bg-primary shadow-md shadow-primary/20' : 'bg-slate-800 border border-slate-700/60'
      }`}
    >
      <motion.div 
        className="w-4.5 h-4.5 rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </div>
  );
};

export default function AgencySettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [copiedToken, setCopiedToken] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // States for toggles (Custom switches)
  const [notifySync, setNotifySync] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySMS, setNotifySMS] = useState(false);
  const [notifySlack, setNotifySlack] = useState(true);

  // Integration connect/disconnect simulations
  const [integrations, setIntegrations] = useState({
    meta: true,
    sheets: true,
    whatsapp: false,
  });

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Toast status simulation
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Teammates State
  const [teammates, setTeammates] = useState([
    { name: 'Guna Sekhar', email: 'gunas@growphil.in', role: 'Agency Admin', isOwner: true, status: 'Active Now' },
    { name: 'Support GrowPhil', email: 'support@growphil.in', role: 'Manager', isOwner: false, status: 'Active 10m ago' }
  ]);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Agency Admin');
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Telegram Integration State
  const [telegramStatus, setTelegramStatus] = useState<{
    isConnected: boolean;
    botName?: string;
    botUsername?: string;
    botUrl?: string;
  }>({ isConnected: false });
  const [botTokenInput, setBotTokenInput] = useState('');
  const [connectingBot, setConnectingBot] = useState(false);
  const [loadingTelegram, setLoadingTelegram] = useState(true);

  const fetchTelegramStatus = async () => {
    try {
      setLoadingTelegram(true);
      const res = await api.get('/v1/telegram/status');
      setTelegramStatus(res.data.data);
    } catch (err: any) {
      console.error('Failed to fetch Telegram status:', err);
    } finally {
      setLoadingTelegram(false);
    }
  };

  useEffect(() => {
    fetchTelegramStatus();
  }, []);

  const handleConnectTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botTokenInput.trim()) {
      showToast('Please enter a bot token.', 'info');
      return;
    }
    try {
      setConnectingBot(true);
      const res = await api.post('/v1/telegram/connect', { botToken: botTokenInput });
      setTelegramStatus(res.data.data);
      setBotTokenInput('');
      showToast('Telegram bot connected successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to connect Telegram bot.', 'info');
    } finally {
      setConnectingBot(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    if (!confirm('Are you sure you want to disconnect the Telegram bot? Client workspaces will lose notification delivery.')) {
      return;
    }
    try {
      setLoadingTelegram(true);
      const res = await api.delete('/v1/telegram/disconnect');
      setTelegramStatus(res.data.data);
      showToast('Telegram bot disconnected.', 'info');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Failed to disconnect bot.', 'info');
    } finally {
      setLoadingTelegram(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText('gp_live_d813cb6e1c4021ab5039ea81b0a8cd1a2b');
    setCopiedToken(true);
    showToast('API token copied to clipboard!', 'success');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleInviteTeammate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) {
      showToast('Please fill in name and email', 'info');
      return;
    }
    setTeammates([
      ...teammates,
      { name: inviteName, email: inviteEmail, role: inviteRole, isOwner: false, status: 'Pending Invite' }
    ]);
    setInviteName('');
    setInviteEmail('');
    setShowInviteForm(false);
    showToast(`Invitation sent to ${inviteEmail}!`, 'success');
  };

  const handleRevokeTeammate = (email: string) => {
    setTeammates(teammates.filter(t => t.email !== email));
    showToast('Teammate access revoked.', 'info');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showToast('Please enter password credentials', 'info');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'info');
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password updated successfully!', 'success');
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <User size={15} /> },
    { id: 'users', label: 'Teammates', icon: <Users size={15} /> },
    { id: 'integrations', label: 'Connected Apps', icon: <Database size={15} /> },
    { id: 'notifications', label: 'Alert Channels', icon: <Bell size={15} /> },
    { id: 'security', label: 'Security & Keys', icon: <Key size={15} /> },
    { id: 'billing', label: 'Billing & Plan', icon: <Wallet size={15} /> },
  ];



  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300 relative">
      
      {/* Title */}
      <div className="border-b border-border/80 pb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">System Configurations</span>
        </div>
        <h1 className="text-[44px] font-black text-white tracking-tight leading-none font-display mt-2">
          Agency Settings
        </h1>
        <p className="text-text-secondary text-sm mt-2">Configure profile details, user accesses, and workspace integrations</p>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left: Navigation Sidebar */}
        <div className="lg:col-span-1 bg-card border border-border rounded-3xl p-3.5 space-y-1.5 shadow-premium-card backdrop-blur-md">
          <div className="px-3.5 py-2">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-text-secondary/70">Console Menu</span>
          </div>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-premium cursor-pointer border ${
                  isActive
                    ? 'bg-primary/10 text-primary border-primary/25 shadow-md shadow-primary/5'
                    : 'text-text-secondary border-transparent hover:bg-hover hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
                {isActive && (
                  <motion.div layoutId="activeTabIndicator" className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Tab view area */}
        <div className="lg:col-span-3 min-h-[450px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              
              {/* ───────────────── GENERAL TAB ───────────────── */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Banner Profile Card */}
                  <AppCard className="p-6 overflow-hidden relative" hoverEffect={false}>
                    <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />
                    
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                      <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-black text-3xl text-black shadow-lg shadow-primary/20 shrink-0">
                        {user?.email ? user.email.slice(0, 2).toUpperCase() : 'GP'}
                      </div>
                      
                      <div className="text-center sm:text-left space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h2 className="text-xl font-bold text-white tracking-tight">GrowPhil Workspace Portal</h2>
                          <Badge variant="success" dot className="self-center">Live Node</Badge>
                        </div>
                        <p className="text-xs text-text-secondary font-medium">Primary Agency Platform Identity</p>
                        
                        <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3 text-[10px] text-text-secondary/80 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><Globe size={11} className="text-primary" /> Region: India</span>
                          <span className="flex items-center gap-1.5"><Cpu size={11} className="text-secondary" /> Microservices Active</span>
                        </div>
                      </div>
                    </div>
                  </AppCard>

                  <AppCard className="p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">General Preferences</h3>
                      <p className="text-xs text-text-secondary mt-1">Manage agency profile credentials and details</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border text-xs font-semibold text-text-secondary">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary/70">Authorized Owner Email</span>
                          <div className="relative">
                            <Mail className="absolute left-4 top-3.5 h-4 w-4 text-text-secondary/55" />
                            <input
                              type="text"
                              disabled
                              value={user?.email || 'gunas@growphil.in'}
                              className="w-full rounded-2xl border border-border bg-card-secondary/40 pl-11 pr-4 py-3 text-text-secondary/80 cursor-not-allowed font-medium"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary/70">Security Access Level</span>
                          <div className="relative">
                            <Shield className="absolute left-4 top-3.5 h-4 w-4 text-text-secondary/55" />
                            <input
                              type="text"
                              disabled
                              value={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'AGENCY ADMIN'}
                              className="w-full rounded-2xl border border-border bg-card-secondary/40 pl-11 pr-4 py-3 text-text-secondary/80 cursor-not-allowed font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary/70">Tenant Account Reference ID</span>
                        <input
                          type="text"
                          disabled
                          value={user?.tenantId || '7ba9045-8123-4bb1-a67b-1cb09f984a'}
                          className="w-full rounded-2xl border border-border bg-card-secondary/40 px-4 py-3 text-text-secondary/70 font-mono cursor-not-allowed text-xs"
                        />
                      </div>
                    </div>
                  </AppCard>
                </div>
              )}

              {/* ───────────────── USERS TAB ───────────────── */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <AppCard className="p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Teammates Management</h3>
                        <p className="text-xs text-text-secondary mt-1">Manage team authorizations and permissions</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => setShowInviteForm(!showInviteForm)}
                        icon={showInviteForm ? <ChevronRight size={13} /> : <Plus size={13} />}
                      >
                        {showInviteForm ? 'Close Invite Form' : 'Invite Teammate'}
                      </Button>
                    </div>

                    {/* Invite Form */}
                    {showInviteForm && (
                      <motion.form 
                        onSubmit={handleInviteTeammate}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="bg-card-secondary/40 border border-border rounded-2xl p-4.5 space-y-4 overflow-hidden"
                      >
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Plus size={12} className="text-primary" /> Invite New Member
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">Full Name</label>
                            <input 
                              type="text"
                              value={inviteName}
                              onChange={(e) => setInviteName(e.target.value)}
                              placeholder="e.g. John Doe"
                              className="w-full text-xs text-white bg-card border border-border rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">Email Address</label>
                            <input 
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="e.g. john@growphil.in"
                              className="w-full text-xs text-white bg-card border border-border rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">System Role</label>
                            <select 
                              value={inviteRole}
                              onChange={(e) => setInviteRole(e.target.value)}
                              className="w-full text-xs text-white bg-card border border-border rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none"
                            >
                              <option value="Agency Admin" className="bg-slate-900">Agency Admin</option>
                              <option value="Manager" className="bg-slate-900">Manager</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button type="submit" size="sm">Send System Access</Button>
                        </div>
                      </motion.form>
                    )}

                    <div className="space-y-3 pt-4 border-t border-border">
                      {teammates.map((teammate) => (
                        <div 
                          key={teammate.email}
                          className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card-secondary/15 hover:bg-card-secondary/25 transition-premium"
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0 border border-primary/10">
                              {teammate.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-xs">{teammate.name}</p>
                              <p className="text-text-secondary text-[10px] mt-0.5">{teammate.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="hidden sm:flex flex-col items-end">
                              <span className="text-[9px] uppercase font-black text-text-secondary tracking-wider">{teammate.role}</span>
                              <span className="text-[9px] text-emerald-400 font-semibold mt-0.5">{teammate.status}</span>
                            </div>
                            
                            {teammate.isOwner ? (
                              <Badge variant="success">Primary Owner</Badge>
                            ) : (
                              <button 
                                onClick={() => handleRevokeTeammate(teammate.email)}
                                className="p-2 rounded-lg border border-red-500/10 bg-red-500/5 hover:bg-red-500/15 text-red-400 transition-colors cursor-pointer"
                                title="Revoke access"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AppCard>
                </div>
              )}

              {/* ───────────────── INTEGRATIONS TAB ───────────────── */}
              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <AppCard className="p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Connected Services</h3>
                      <p className="text-xs text-text-secondary mt-1">Telemetry triggers and global API configurations</p>
                    </div>

                    <div className="space-y-4.5 pt-4 border-t border-border">
                      {/* Meta Card */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4.5 rounded-2xl border border-border bg-card-secondary/15 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 border border-primary/15 shadow-sm shadow-primary/5">
                            <Database size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-xs">Meta Lead Graph Webhooks</h4>
                              <Badge variant={integrations.meta ? 'success' : 'warning'}>
                                {integrations.meta ? 'Subscribed' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-[10.5px] text-text-secondary mt-1 max-w-md">Subscribed to Meta Lead Ads form callbacks. Leads are piped instantly.</p>
                          </div>
                        </div>
                        <div className="self-end sm:self-auto flex items-center gap-3">
                          <span className="text-[10px] text-text-secondary font-bold uppercase">
                            {integrations.meta ? 'Connected' : 'Disconnected'}
                          </span>
                          <CustomToggle 
                            checked={integrations.meta} 
                            onChange={(val) => {
                              setIntegrations({...integrations, meta: val});
                              showToast(`Meta Sync ${val ? 'Activated' : 'Paused'}`, val ? 'success' : 'info');
                            }} 
                          />
                        </div>
                      </div>

                      {/* Google Sheets Card */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4.5 rounded-2xl border border-border bg-card-secondary/15 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/15 shadow-sm shadow-emerald-500/5">
                            <Sliders size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-xs">Google Sheets Connector</h4>
                              <Badge variant={integrations.sheets ? 'success' : 'warning'}>
                                {integrations.sheets ? 'Autosync Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-[10.5px] text-text-secondary mt-1 max-w-md">Automated client spreadsheet sync. Appends row for every incoming lead.</p>
                          </div>
                        </div>
                        <div className="self-end sm:self-auto flex items-center gap-3">
                          <span className="text-[10px] text-text-secondary font-bold uppercase">
                            {integrations.sheets ? 'Connected' : 'Disconnected'}
                          </span>
                          <CustomToggle 
                            checked={integrations.sheets} 
                            onChange={(val) => {
                              setIntegrations({...integrations, sheets: val});
                              showToast(`Google Sheets Sync ${val ? 'Activated' : 'Paused'}`, val ? 'success' : 'info');
                            }} 
                          />
                        </div>
                      </div>

                      {/* WhatsApp Card */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4.5 rounded-2xl border border-border bg-card-secondary/15 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 shrink-0 border border-cyan-500/15 shadow-sm shadow-cyan-500/5">
                            <Mail size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-xs">WhatsApp Cloud API</h4>
                              <Badge variant={integrations.whatsapp ? 'success' : 'warning'}>
                                {integrations.whatsapp ? 'Live Node' : 'Config Pending'}
                              </Badge>
                            </div>
                            <p className="text-[10.5px] text-text-secondary mt-1 max-w-md">Immediate chat messages triggered when new leads arrive.</p>
                          </div>
                        </div>
                        <div className="self-end sm:self-auto flex items-center gap-3">
                          <span className="text-[10px] text-text-secondary font-bold uppercase">
                            {integrations.whatsapp ? 'Connected' : 'Disconnected'}
                          </span>
                          <CustomToggle 
                            checked={integrations.whatsapp} 
                            onChange={(val) => {
                              setIntegrations({...integrations, whatsapp: val});
                              showToast(`WhatsApp Sync ${val ? 'Activated' : 'Deactivated'}`, val ? 'success' : 'info');
                            }} 
                          />
                        </div>
                      </div>

                      {/* Telegram Bot Card */}
                      <div className="p-4.5 rounded-2xl border border-border bg-card-secondary/15 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/15 shadow-sm shadow-blue-500/5">
                            <Send size={18} />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs">Telegram Bot Notifications</h4>
                            <p className="text-[10.5px] text-text-secondary mt-1 max-w-md">
                              Telegram bots are now configured and managed individually per client workspace.
                            </p>
                          </div>
                        </div>
                        <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-900/60 text-[11px] text-text-secondary leading-relaxed">
                          ⚠️ <b>Note for Agency Admins:</b> Each client workspace can now connect their own dedicated Telegram Bot. Ask your clients to navigate to their workspace <b>Settings &gt; Integrations &gt; Telegram Alert Bot</b> to configure their tokens and manage chat recipients directly.
                        </div>
                      </div>
                    </div>
                  </AppCard>
                </div>
              )}

              {/* ───────────────── NOTIFICATIONS TAB ───────────────── */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <AppCard className="p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Alert Channels</h3>
                      <p className="text-xs text-text-secondary mt-1">Configure automated routing notifications for pipeline events</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border text-xs text-text-secondary">
                      {/* Item 1 */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card-secondary/10 border border-border/60">
                        <div className="space-y-1 pr-4">
                          <p className="font-bold text-white text-xs">Webhook Sync Failures</p>
                          <p className="text-[10px] text-text-secondary">Receive alert summaries immediately if Meta endpoint callback sync errors occur.</p>
                        </div>
                        <CustomToggle 
                          checked={notifySync} 
                          onChange={(val) => {
                            setNotifySync(val);
                            showToast(`Failure Alerts ${val ? 'Enabled' : 'Disabled'}`, 'info');
                          }} 
                        />
                      </div>

                      {/* Item 2 */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card-secondary/10 border border-border/60">
                        <div className="space-y-1 pr-4">
                          <p className="font-bold text-white text-xs">Daily Lead Email Digests</p>
                          <p className="text-[10px] text-text-secondary">Receive daily summarized PDF analytics reports of new lead counts to owner inbox.</p>
                        </div>
                        <CustomToggle 
                          checked={notifyEmail} 
                          onChange={(val) => {
                            setNotifyEmail(val);
                            showToast(`Email Digests ${val ? 'Enabled' : 'Disabled'}`, 'info');
                          }} 
                        />
                      </div>

                      {/* Item 3 */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card-secondary/10 border border-border/60">
                        <div className="space-y-1 pr-4">
                          <p className="font-bold text-white text-xs">Lead WhatsApp SMS Alerts</p>
                          <p className="text-[10px] text-text-secondary">Fire a custom welcome template ping message on WhatsApp directly to target user phone numbers.</p>
                        </div>
                        <CustomToggle 
                          checked={notifySMS} 
                          onChange={(val) => {
                            setNotifySMS(val);
                            showToast(`WhatsApp Auto-pings ${val ? 'Enabled' : 'Disabled'}`, 'info');
                          }} 
                        />
                      </div>

                      {/* Item 4 */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card-secondary/10 border border-border/60">
                        <div className="space-y-1 pr-4">
                          <p className="font-bold text-white text-xs">Slack Developer Notifications</p>
                          <p className="text-[10px] text-text-secondary">Push live telemetry updates to private Slack engineering channel workspace integrations.</p>
                        </div>
                        <CustomToggle 
                          checked={notifySlack} 
                          onChange={(val) => {
                            setNotifySlack(val);
                            showToast(`Slack notifications ${val ? 'Enabled' : 'Disabled'}`, 'info');
                          }} 
                        />
                      </div>
                    </div>
                  </AppCard>
                </div>
              )}

              {/* ───────────────── SECURITY TAB ───────────────── */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Token access */}
                  <AppCard className="p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">REST API Access Credentials</h3>
                      <p className="text-xs text-text-secondary mt-1">Verify security keys to authorize external software client integrations</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border text-xs font-semibold text-text-secondary">
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary/70">Workspace LIVE Secret Token</span>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={showToken ? 'text' : 'password'}
                              disabled
                              value="gp_live_d813cb6e1c4021ab5039ea81b0a8cd1a2b"
                              className="w-full rounded-2xl border border-border bg-card-secondary/40 pl-4 pr-11 py-3 text-text-secondary font-mono text-xs cursor-not-allowed"
                            />
                            <button
                              type="button"
                              onClick={() => setShowToken(!showToken)}
                              className="absolute right-3 top-3 text-text-secondary/60 hover:text-white transition-colors cursor-pointer"
                            >
                              {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                          
                          <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={handleCopyToken}
                            icon={copiedToken ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                          >
                            {copiedToken ? 'Copied' : 'Copy'}
                          </Button>
                        </div>
                        <p className="text-[10px] text-text-secondary/60 font-semibold flex items-center gap-1.5 mt-1.5"><Info size={11} /> Keep keys confidential. Do not expose this credentials hash token in client-side script code bases.</p>
                      </div>
                    </div>
                  </AppCard>

                  {/* Reset Password Form */}
                  <AppCard className="p-6">
                    <form onSubmit={handleSavePassword} className="space-y-5">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Reset Account Password</h3>
                        <p className="text-xs text-text-secondary mt-1">Update login validation passwords</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 pt-4 border-t border-border text-xs font-semibold text-text-secondary">
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary/70">New Password</span>
                          <div className="relative">
                            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-text-secondary/55" />
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter secure password"
                              className="w-full rounded-2xl border border-border bg-card-secondary pl-11 pr-4 py-3.5 text-white focus:border-primary focus:outline-none font-medium"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary/70">Confirm Password</span>
                          <div className="relative">
                            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-text-secondary/55" />
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Verify secure password"
                              className="w-full rounded-2xl border border-border bg-card-secondary pl-11 pr-4 py-3.5 text-white focus:border-primary focus:outline-none font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-3">
                        <Button type="submit" size="sm">Save Password</Button>
                      </div>
                    </form>
                  </AppCard>
                </div>
              )}

              {/* ───────────────── BILLING TAB ───────────────── */}
              {activeTab === 'billing' && (
                <div className="space-y-6">
                  {/* Subscription card */}
                  <AppCard className="p-6 overflow-hidden relative" hoverEffect={false}>
                    {/* Glow */}
                    <div className="absolute top-0 right-0 h-48 w-48 bg-gradient-to-bl from-primary/15 to-transparent rounded-full blur-3xl" />
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 relative">
                      <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">Billing Subscription</span>
                        <h3 className="text-2xl font-black text-white">GrowPhil Enterprise CRM Plan</h3>
                        <p className="text-xs text-text-secondary">Next monthly billing auto renewal date scheduled on <span className="text-white font-bold">July 24, 2026</span>.</p>
                        
                        <div className="flex items-center gap-3 pt-2">
                          <Badge variant="success" dot>Active Subscription</Badge>
                          <span className="text-xs text-white font-bold">₹7,999.00 / month</span>
                        </div>
                      </div>

                      <Button variant="secondary" size="sm" onClick={() => showToast('Redirecting to payment gateway...', 'info')}>
                        Change Plan
                      </Button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border/80">
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-text-secondary font-bold uppercase tracking-wider text-[9px]">API Sync Calls quota usage</span>
                        <span className="text-white font-bold">1,452 / 5,000 leads</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <motion.div 
                          className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full" 
                          initial={{ width: 0 }}
                          animate={{ width: `${(1452/5000)*100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </AppCard>

                  {/* Payment History */}
                  <AppCard className="p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Payment History</h3>
                      <p className="text-xs text-text-secondary mt-1">Download and verify monthly invoices</p>
                    </div>

                    <div className="pt-4 border-t border-border text-xs">
                      <div className="rounded-2xl border border-border bg-card-secondary/15 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] font-semibold text-text-secondary min-w-[500px]">
                            <thead>
                              <tr className="border-b border-border/80 text-[10px] text-text-secondary/70 uppercase font-extrabold bg-card-secondary/20">
                                <th className="p-4">Invoice Reference</th>
                                <th className="p-4">Issued Date</th>
                                <th className="p-4">Total Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Invoice Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-border/40 hover:bg-hover/10 transition-colors">
                                <td className="p-4 text-white">INV-2026-003</td>
                                <td className="p-4">June 22, 2026</td>
                                <td className="p-4 text-white">₹7,999.00</td>
                                <td className="p-4"><span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">Paid</span></td>
                                <td className="p-4 text-right">
                                  <button 
                                    onClick={() => showToast('Downloading invoice PDF...', 'success')}
                                    className="p-1.5 rounded-lg border border-border hover:border-primary/30 text-text-secondary hover:text-primary transition-all cursor-pointer inline-flex items-center gap-1.5 text-[10px] uppercase font-bold"
                                  >
                                    <Download size={12} />
                                    PDF
                                  </button>
                                </td>
                              </tr>
                              <tr className="hover:bg-hover/10 transition-colors">
                                <td className="p-4 text-white">INV-2026-002</td>
                                <td className="p-4">May 22, 2026</td>
                                <td className="p-4 text-white">₹7,999.00</td>
                                <td className="p-4"><span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">Paid</span></td>
                                <td className="p-4 text-right">
                                  <button 
                                    onClick={() => showToast('Downloading invoice PDF...', 'success')}
                                    className="p-1.5 rounded-lg border border-border hover:border-primary/30 text-text-secondary hover:text-primary transition-all cursor-pointer inline-flex items-center gap-1.5 text-[10px] uppercase font-bold"
                                  >
                                    <Download size={12} />
                                    PDF
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </AppCard>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Floating dynamic status toast component */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl border shadow-xl flex items-center gap-3 backdrop-blur-md max-w-sm ${
              toast.type === 'success' 
                ? 'bg-emerald-950/80 border-emerald-500/25 text-emerald-350' 
                : 'bg-slate-900/80 border-border/80 text-white'
            }`}
          >
            <CheckCircle2 size={16} className={toast.type === 'success' ? 'text-emerald-400' : 'text-primary'} />
            <p className="text-xs font-bold">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
