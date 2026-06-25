'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { Sale, Lead } from '../../../types';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // KPI meta
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Form State
  const [leadId, setLeadId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [closedAt, setClosedAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [salesResponse, leadsResponse] = await Promise.all([
        api.get('/v1/sales'),
        api.get('/v1/leads'),
      ]);

      setSales(salesResponse.data.data);
      if (salesResponse.data.meta) {
        setTotalRevenue(salesResponse.data.meta.totalRevenue || 0);
      }
      
      // Filter out leads that are already won or lost for recording new deals
      const eligibleLeads = leadsResponse.data.data.filter(
        (l: Lead) => l.stage !== 'WON' && l.stage !== 'LOST'
      );
      setLeads(eligibleLeads);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load sales information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const handleRecordDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!leadId || !amount || !closedAt) {
      setError('Please fill in all transaction fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/v1/sales', {
        leadId,
        amount: Number(amount),
        currency,
        closedAt: new Date(closedAt).toISOString(),
      });

      setSuccessMsg('Deal successfully closed and recorded!');
      setLeadId('');
      setAmount('');
      setClosedAt('');
      fetchSalesData(); // Refresh list & totals
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to record deal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
        <p className="text-slate-400 mt-1">Record closed deals and track revenue metrics</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-6">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Revenue (Gross Volume)</p>
          <p className="text-3xl font-bold mt-2 text-emerald-400">
            ₹{totalRevenue ? totalRevenue.toLocaleString() : '0'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-6">
          <p className="text-xs font-medium text-slate-500 uppercase">Deals Closed</p>
          <p className="text-3xl font-bold mt-2 text-slate-200">{sales.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-6">
            <h2 className="text-xl font-semibold mb-6">Sales Log</h2>

            {loading && <p className="text-slate-400 text-sm">Loading closed deals...</p>}
            
            {!loading && sales.length === 0 && (
              <p className="text-slate-500 text-sm">No sales recorded yet.</p>
            )}

            <div className="space-y-3">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-4 rounded-lg border border-slate-800 bg-slate-950 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold text-slate-200">
                      Lead: {sale.lead?.name || 'Unknown Lead'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Closed on: {new Date(sale.closedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">
                      ₹{Number(sale.amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase">{sale.currency}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Record Sale Form */}
        <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-6 h-fit">
          <h2 className="text-xl font-semibold mb-6">Record Closed Deal</h2>

          {(error || successMsg) && (
            <div
              className={`mb-6 rounded-lg p-3 text-sm border text-center ${
                successMsg
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              {error || successMsg}
            </div>
          )}

          <form onSubmit={handleRecordDeal} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Select Lead</label>
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 focus:outline-none"
                disabled={isSubmitting}
              >
                <option value="">-- Choose Won Lead --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.stage.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Transaction Value</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none"
                  placeholder="50000"
                  disabled={isSubmitting}
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 text-sm text-slate-300"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Closure Timestamp</label>
              <input
                type="datetime-local"
                value={closedAt}
                onChange={(e) => setClosedAt(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Recording...' : 'Close & Record Deal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
