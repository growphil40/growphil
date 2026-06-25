'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { Client } from '../../../types';
import { AppCard, MetricCard } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Search, 
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Users,
  AlertCircle
} from 'lucide-react';

export default function AgencyLeadsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch clients list
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const res = await api.get('/v1/agency/clients');
        setClients(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch agency clients', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Filter clients by search query
  const filteredClients = clients.filter(c => 
    c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute stats
  const totalClients = clients.length;
  const connectedClients = clients.filter(c => c.metaAccessToken).length;
  const pendingClients = totalClients - connectedClients;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-[48px] font-bold text-white tracking-tight leading-none font-display">
          Agency Leads Center
        </h1>
        <p className="text-text-secondary text-sm mt-2">
          Select a partner client account to inspect and manage their leads pipeline and follow-up touchpoints
        </p>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          title="Managed Client Accounts"
          value={totalClients}
          subtext="Active portal links"
          icon={<Users size={18} />}
          accentColor="#3B82F6"
        />
        <MetricCard
          title="Meta Connections Active"
          value={connectedClients}
          subtext="Leads synchronized automatically"
          icon={<ShieldCheck size={18} />}
          accentColor="#10B981"
        />
        <MetricCard
          title="Meta Config Pending"
          value={pendingClients}
          subtext="Awaiting integration"
          icon={<AlertCircle size={18} />}
          accentColor="#F59E0B"
        />
      </div>

      {/* Clients list and search bar */}
      <AppCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-widest">
            Partner Accounts
          </h2>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-card-secondary/30 pl-10 pr-4 py-2.5 text-xs text-white placeholder-text-secondary focus:border-primary focus:outline-none transition-premium"
              placeholder="Search by business name or email..."
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-text-secondary text-xs font-semibold">Loading client directory...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-16 text-text-secondary border border-dashed border-border rounded-2xl">
            <Building2 className="mx-auto h-8 w-8 opacity-20 mb-3" />
            <p className="font-bold text-white text-xs">No client portals found</p>
            <p className="text-[10px] text-text-secondary mt-1">Register client accounts in the CRM page to monitor their leads.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => {
              const hasMeta = !!client.metaAccessToken;
              return (
                <div
                  key={client.id}
                  onClick={() => router.push(`/agency/leads/${client.id}`)}
                  className="group flex items-center justify-between p-4.5 rounded-2xl border border-border/80 bg-muted/5 hover:bg-muted/15 hover:border-primary/45 transition-premium cursor-pointer"
                >
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-white truncate group-hover:text-primary transition-colors">
                      {client.businessName}
                    </h3>
                    <p className="text-[10px] text-text-secondary truncate mt-1">
                      {client.email}
                    </p>
                    <div className="mt-3.5">
                      <Badge variant={hasMeta ? 'success' : 'warning'} dot>
                        {hasMeta ? 'Connected' : 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  <div className="h-8.5 w-8.5 rounded-xl bg-card-secondary border border-border group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 flex items-center justify-center shrink-0 transition-premium ml-4">
                    <ChevronRight size={15} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AppCard>
    </div>
  );
}
