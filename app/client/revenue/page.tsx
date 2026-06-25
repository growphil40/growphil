'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/api';

interface AnalyticsData {
  totalRevenue: number;
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  conversionRate: number;
  costPerLead: number;
  ROAS: number | null;
  revenueByMonth: { month: string; revenue: number }[];
}

export default function RevenueDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/v1/sales/analytics');
        setData(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load client revenue intelligence.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <p className="text-slate-400 text-sm">Loading client revenue dashboard...</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Revenue Dashboard</h1>
        <p className="text-slate-400 mt-1">Review marketing effectiveness, conversion ratios, and return on ad spend</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-6">
          <p className="text-xs font-medium text-slate-500 uppercase">Gross Revenue</p>
          <p className="text-3xl font-bold mt-2 text-slate-200">
            ₹{data?.totalRevenue ? data.totalRevenue.toLocaleString() : '0'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-6">
          <p className="text-xs font-medium text-slate-500 uppercase">Conversion Rate</p>
          <p className="text-3xl font-bold mt-2 text-emerald-400">{data?.conversionRate || 0}%</p>
          <span className="text-[10px] text-slate-500">Won leads / total leads</span>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-6">
          <p className="text-xs font-medium text-slate-500 uppercase">Cost Per Lead (CPL)</p>
          <p className="text-3xl font-bold mt-2 text-indigo-400">
            ₹{data?.costPerLead ? data.costPerLead.toLocaleString() : '0'}
          </p>
          <span className="text-[10px] text-slate-500">Ad budget / total leads</span>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-6">
          <p className="text-xs font-medium text-slate-500 uppercase">Return On Ad Spend (ROAS)</p>
          <p className="text-3xl font-bold mt-2 text-teal-400">
            {data?.ROAS !== null && data?.ROAS !== undefined ? `${data.ROAS}x` : 'N/A'}
          </p>
          <span className="text-[10px] text-slate-500">Sales volume / ad spend</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Month-on-Month Trends */}
        <div className="lg:col-span-2 rounded-xl border border-slate-900 bg-slate-900/10 p-6">
          <h2 className="text-xl font-semibold mb-6">Revenue Trends (Last 6 Months)</h2>
          
          <div className="space-y-4">
            {data?.revenueByMonth && data.revenueByMonth.length > 0 ? (
              data.revenueByMonth.map((trend) => {
                // Find max revenue to scale the bars
                const maxRevenue = Math.max(...data.revenueByMonth.map(m => m.revenue), 1);
                const barWidth = Math.round((trend.revenue / maxRevenue) * 100);
                return (
                  <div key={trend.month} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">{trend.month}</span>
                      <span className="font-semibold text-slate-200">₹{trend.revenue.toLocaleString()}</span>
                    </div>
                    <div className="h-4 w-full rounded bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500/80 rounded transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-sm">No sales logs found.</p>
            )}
          </div>
        </div>

        {/* Pipeline conversion summary */}
        <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-6 h-fit">
          <h2 className="text-xl font-semibold mb-6">Conversion Ratios</h2>
          <div className="space-y-4 text-sm text-slate-300">
            <div className="flex justify-between py-2 border-b border-slate-900">
              <span>Total Pipeline Leads</span>
              <span className="font-semibold text-white">{data?.totalLeads}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-900">
              <span>Won Deals</span>
              <span className="font-semibold text-emerald-400">{data?.wonLeads}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-900">
              <span>Lost Deals</span>
              <span className="font-semibold text-red-400">{data?.lostLeads}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Pipeline Health Ratio</span>
              <span className="font-semibold text-teal-400">{data?.conversionRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
