'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { Client } from '../../../types';
import { Trash2 } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create Client Form state
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delete Client state
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Tabs state
  const [showArchived, setShowArchived] = useState(false);

  const fetchClients = async (archived = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/v1/agency/clients', {
        params: { isDeleted: archived },
      });
      setClients(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch clients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(showArchived);
  }, []);

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setDeleteError(null);
    try {
      setIsDeleting(true);
      await api.delete(`/v1/agency/clients/${clientToDelete.id}`);
      setSuccessMsg(`Client "${clientToDelete.businessName}" deleted successfully!`);
      setClientToDelete(null);
      fetchClients(showArchived);
    } catch (err: any) {
      setDeleteError(err.response?.data?.error?.message || 'Failed to delete client.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    
    if (!businessName || !email || !password) {
      setError('Please fill in all client registration fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/v1/agency/clients', {
        businessName,
        email,
        password,
      });

      setSuccessMsg('Client account successfully registered!');
      setBusinessName('');
      setEmail('');
      setPassword('');
      setShowArchived(false);
      fetchClients(false); // Refresh active list
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Client Accounts</h1>
        <p className="text-text-secondary mt-1">Manage partner accounts and Meta OAuth integrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Clients List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card backdrop-blur-xl p-6">
            {/* Tabs for Active/Archived */}
            <div className="flex gap-4 mb-6 border-b border-border pb-3">
              <button
                type="button"
                onClick={() => {
                  setShowArchived(false);
                  fetchClients(false);
                }}
                className={`text-sm font-semibold pb-2 border-b-2 transition-colors cursor-pointer ${
                  !showArchived ? 'text-primary border-primary' : 'text-text-secondary border-transparent hover:text-text-primary'
                }`}
              >
                Active Clients
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowArchived(true);
                  fetchClients(true);
                }}
                className={`text-sm font-semibold pb-2 border-b-2 transition-colors cursor-pointer ${
                  showArchived ? 'text-primary border-primary' : 'text-text-secondary border-transparent hover:text-text-primary'
                }`}
              >
                Archived Clients
              </button>
            </div>

            {loading && <p className="text-text-secondary text-sm">Loading client accounts...</p>}
            
            {!loading && clients.length === 0 && (
              <p className="text-text-secondary text-sm">
                {showArchived ? 'No archived clients found.' : 'No active clients registered yet. Use the form on the right to register one.'}
              </p>
            )}

            <div className="space-y-3">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-border/60 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-foreground">{client.businessName}</h3>
                    <p className="text-xs text-text-secondary">{client.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${
                        client.metaAccessToken
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {client.metaAccessToken ? 'Meta Connected' : 'Meta Pending'}
                    </span>
                    <Link
                      href={`/agency/clients/${client.id}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {showArchived ? 'View Leads & Details' : 'Manage'}
                    </Link>
                    {!showArchived && (
                      <Link
                        href={`/agency/clients/${client.id}/analytics`}
                        className="text-xs font-semibold text-[#3B82F6] hover:underline"
                      >
                        Analytics
                      </Link>
                    )}
                    {!showArchived && (
                      <button
                        type="button"
                        onClick={() => setClientToDelete(client)}
                        className="text-text-secondary hover:text-rose-600 dark:hover:text-rose-450 transition-colors p-1 rounded hover:bg-hover cursor-pointer"
                        title="Delete Client"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Client Form */}
        <div className="rounded-xl border border-border bg-card backdrop-blur-xl p-6 h-fit">
          <h2 className="text-xl font-semibold mb-6">Register Client</h2>

          {(error || successMsg) && (
            <div
              className={`mb-6 rounded-lg p-3 text-sm border text-center ${
                successMsg
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-650'
                  : 'bg-red-500/10 border-red-500/20 text-red-650'
              }`}
            >
              {error || successMsg}
            </div>
          )}

          <form onSubmit={handleCreateClient} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                placeholder="Acme Corp"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Login Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                placeholder="owner@acme.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Owner Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Registering...' : 'Register Account'}
            </button>
          </form>
        </div>
      </div>

      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl relative">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Client Account</h3>
            <p className="text-sm text-text-secondary mb-6">
              Are you sure you want to delete <span className="font-semibold text-foreground">{clientToDelete.businessName}</span>?
              This action will revoke all user login access and integrations for this client, but <span className="font-semibold text-primary">all leads and historical data will be kept</span>.
            </p>

            {deleteError && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setClientToDelete(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-hover transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-sm font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

