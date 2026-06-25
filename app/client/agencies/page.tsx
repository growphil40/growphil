'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Shield, ShieldAlert, Users, Layers, CheckCircle2, AlertTriangle, Search, RotateCw } from 'lucide-react';

interface AgencyCount {
  clients: number;
  users: number;
}

interface Agency {
  id: string;
  name: string;
  email: string;
  plan: string;
  trialEndsAt: string | null;
  isActive: boolean;
  createdAt: string;
  _count: AgencyCount;
}

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'warning' | 'error' }>>([]);

  const addToast = React.useCallback((message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/v1/agencies');
      setAgencies(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch agencies list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const toggleAgencyStatus = async (agencyId: string, currentStatus: boolean) => {
    try {
      setUpdatingId(agencyId);
      const nextStatus = !currentStatus;
      await api.patch(`/v1/agencies/${agencyId}/status`, { isActive: nextStatus });
      
      setAgencies((prev) =>
        prev.map((a) => (a.id === agencyId ? { ...a, isActive: nextStatus } : a))
      );
      
      addToast(
        `Agency status updated to ${nextStatus ? 'ACTIVE' : 'SUSPENDED'} successfully`,
        nextStatus ? 'success' : 'warning'
      );
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to change agency status';
      addToast(errMsg, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter agencies
  const filteredAgencies = agencies.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats helper
  const totalAgencies = agencies.length;
  const activeAgencies = agencies.filter((a) => a.isActive).length;
  const suspendedAgencies = totalAgencies - activeAgencies;
  const totalClients = agencies.reduce((acc, a) => acc + (a._count?.clients || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agencies Management</h1>
          <p className="text-slate-400 mt-1">Suspend, activate, and manage all partner agencies</p>
        </div>
        <button
          onClick={fetchAgencies}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Agencies</p>
            <p className="text-2xl font-black mt-2 text-white">{totalAgencies}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Shield className="h-5 w-5 text-indigo-400" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Agencies</p>
            <p className="text-2xl font-black mt-2 text-emerald-400">{activeAgencies}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Suspended</p>
            <p className="text-2xl font-black mt-2 text-amber-500">{suspendedAgencies}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Clients</p>
            <p className="text-2xl font-black mt-2 text-sky-400">{totalClients}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
            <Layers className="h-5 w-5 text-sky-400" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-zinc-900 bg-zinc-950 pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#3B82F6] focus:outline-none placeholder-zinc-500"
          placeholder="Search agencies by business name or contact email..."
        />
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 overflow-x-auto">
        {loading && agencies.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-6 text-sm text-red-400 m-6">
            {error}
          </div>
        ) : filteredAgencies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-2 m-6 border border-dashed border-zinc-900 rounded-xl">
            <Shield className="h-8 w-8 text-zinc-600 opacity-60" />
            <p className="text-sm font-medium">No agencies found matching your search</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-900 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-6">Agency Details</th>
                <th className="p-6">Plan Tier</th>
                <th className="p-6 text-center">Connected Clients</th>
                <th className="p-6 text-center">Teammates</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgencies.map((agency) => {
                const isUpdating = updatingId === agency.id;
                return (
                  <tr key={agency.id} className="border-b border-zinc-900/60 hover:bg-zinc-950/40 text-zinc-300">
                    <td className="p-6 font-semibold text-white">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{agency.name}</span>
                          {!agency.isActive && (
                            <span className="text-[9px] font-black uppercase bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full shrink-0">
                              Suspended
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500 block font-medium">{agency.email}</span>
                        <span className="text-[9px] text-zinc-600 block">Created: {new Date(agency.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`text-[10px] font-bold uppercase border px-2.5 py-1 rounded-full ${
                        agency.plan === 'pro'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : agency.plan === 'starter'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {agency.plan.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-6 text-center font-bold text-sm text-zinc-100">
                      {agency._count?.clients || 0}
                    </td>
                    <td className="p-6 text-center font-bold text-sm text-zinc-100">
                      {agency._count?.users || 0}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${agency.isActive ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                        <span className={`font-semibold ${agency.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {agency.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => toggleAgencyStatus(agency.id, agency.isActive)}
                        disabled={isUpdating}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          agency.isActive
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                        } cursor-pointer disabled:opacity-50`}
                      >
                        {isUpdating && <RotateCw className="h-3 w-3 animate-spin" />}
                        {agency.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

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

