import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Lead, LeadStage } from '../types';

export interface LeadsFilter {
  stage?: LeadStage | '' | 'TODAY_DUE' | 'OVERDUE' | 'UPCOMING' | string;
  assignedTo?: string;
  search?: string;
  source?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

export function useLeads(initialFilters: LeadsFilter = { page: 1, limit: 20 }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeadsFilter>(initialFilters);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  /**
   * Fetches leads from the backend using active filters.
   */
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Clean empty string filters and omit frontend-only filters
      const cleanFilters: any = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (key === 'stage') {
            // Stage is handled 100% on the frontend so counts/blinking are preserved
          } else {
            cleanFilters[key] = value;
          }
        }
      });

      const [leadsRes, followUpsRes] = await Promise.allSettled([
        api.get('/v1/leads', { params: cleanFilters }),
        api.get('/v1/follow-ups', { params: { status: 'pending' } })
      ]);
      
      let fetchedLeads: Lead[] = [];
      if (leadsRes.status === 'fulfilled') {
        fetchedLeads = leadsRes.value.data.data || [];
        if (leadsRes.value.data.meta) {
          setMeta(leadsRes.value.data.meta);
        }
      } else {
        throw leadsRes.reason;
      }

      if (followUpsRes.status === 'fulfilled' && Array.isArray(followUpsRes.value.data?.data)) {
        const followUps = followUpsRes.value.data.data;
        const followUpMap = new Map<string, any>();
        followUps.forEach((fu: any) => {
          if (!followUpMap.has(fu.leadId) || new Date(fu.scheduledAt) < new Date(followUpMap.get(fu.leadId).scheduledAt)) {
            followUpMap.set(fu.leadId, fu);
          }
        });
        fetchedLeads = fetchedLeads.map((lead) => ({
          ...lead,
          nextFollowUp: followUpMap.get(lead.id) || null,
        }));
      }

      setLeads(fetchedLeads);
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Failed to fetch leads.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  /**
   * Optimistically updates the pipeline stage of a lead.
   */
  const updateStageOptimistically = async (leadId: string, newStage: LeadStage) => {
    const originalLeads = [...leads];

    // 1. Apply optimistic update to local UI state
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, stage: newStage } : lead))
    );

    try {
      // 2. Perform the update request
      const response = await api.patch(`/v1/leads/${leadId}/stage`, { stage: newStage });
      
      // 3. Re-sync with actual server response
      const updatedServerLead = response.data.data;
      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? updatedServerLead : lead))
      );
    } catch (err: any) {
      // 4. Rollback to original state if failed
      console.error('[Optimistic Update Error] Failed to update lead stage. Rolling back.', err);
      setLeads(originalLeads);
      throw new Error(err.response?.data?.error?.message || 'Failed to update stage.');
    }
  };

  /**
   * Deletes a lead by ID.
   */
  const deleteLead = async (leadId: string) => {
    try {
      await api.delete(`/v1/leads/${leadId}`);
      setLeads((prev) => prev.filter((lead) => lead.id !== leadId));
    } catch (err: any) {
      throw new Error(err.response?.data?.error?.message || 'Failed to delete lead.');
    }
  };

  /**
   * Bulk deletes leads by their IDs.
   */
  const deleteLeads = async (leadIds: string[]) => {
    try {
      await api.post('/v1/leads/bulk-delete', { leadIds });
      setLeads((prev) => prev.filter((lead) => !leadIds.includes(lead.id)));
    } catch (err: any) {
      throw new Error(err.response?.data?.error?.message || 'Failed to delete leads.');
    }
  };

  /**
   * Optimistically prepends a newly arrived lead to the top of the list.
   * Used by the socket event handler to avoid a full re-fetch.
   */
  const prependLead = useCallback((lead: Lead) => {
    setLeads((prev) => {
      // Avoid duplicates if the lead already exists
      if (prev.some((l) => l.id === lead.id)) return prev;
      return [lead, ...prev];
    });
  }, []);

  const attachFollowUpToLead = useCallback((leadId: string, followUp: any) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, nextFollowUp: followUp } : l))
    );
  }, []);

  return {
    leads,
    setLeads,
    loading,
    error,
    meta,
    filters,
    setFilters,
    refreshLeads: fetchLeads,
    prependLead,
    attachFollowUpToLead,
    updateLeadStage: updateStageOptimistically,
    deleteLead,
    deleteLeads,
  };
}
export default useLeads;
