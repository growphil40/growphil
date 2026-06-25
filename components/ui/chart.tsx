'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart as RechartsBarChart,
  Bar,
  Cell,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';

// Client-side mount check wrapper for Recharts (Next.js SSR safety)
function ClientSideOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-56 w-full flex items-center justify-center bg-muted/5 border border-border/40 rounded-2xl animate-pulse">
        <div className="text-xs text-muted font-semibold">Pre-rendering chart metrics...</div>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── AREA CHART COMPONENT ────────────────────────────────────────────────────
interface AreaChartProps {
  data: Array<{ name: string; value: number }>;
  color?: string;
  currencyPrefix?: string;
}

export function AreaChart({ data, color = '#079EB7', currencyPrefix = '' }: AreaChartProps) {
  return (
    <ClientSideOnly>
      <div className="h-56 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
            <XAxis 
              dataKey="name" 
              stroke="var(--muted)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="var(--muted)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `${currencyPrefix}${val.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '12px',
                color: 'var(--foreground)',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
              formatter={(value: any) => [`${currencyPrefix}${Number(value).toLocaleString()}`, 'Revenue']}
              labelStyle={{ color: 'var(--muted)' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#chartGlow)"
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    </ClientSideOnly>
  );
}

// ─── HORIZONTAL FUNNEL BAR CHART ──────────────────────────────────────────────
interface FunnelBarChartProps {
  data: Array<{ name: string; count: number; color?: string }>;
}

export function FunnelBarChart({ data }: FunnelBarChartProps) {
  return (
    <ClientSideOnly>
      <div className="h-56 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
            barSize={16}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              stroke="var(--muted)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '12px',
                color: 'var(--foreground)',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
              formatter={(value: any) => [`${value} Leads`, 'Total']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#079EB7'} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </ClientSideOnly>
  );
}

// ─── RADIAL PROGRESS GAUGE ────────────────────────────────────────────────────
interface RadialProgressGaugeProps {
  value: number;       // actual value, e.g. 3.4
  max?: number;        // target ceiling, e.g. 5.0
  label?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export function RadialProgressGauge({
  value,
  max = 5,
  label = 'Score',
  primaryColor = '#079EB7',
  secondaryColor = '#8b5cf6',
}: RadialProgressGaugeProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const chartData = [{ name: label, value: pct, fill: primaryColor }];

  return (
    <ClientSideOnly>
      <div className="relative flex items-center justify-center" style={{ height: 160, width: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="72%"
            outerRadius="100%"
            barSize={10}
            startAngle={90}
            endAngle={-270}
            data={chartData}
          >
            <defs>
              <linearGradient id="gauge-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={secondaryColor} />
              </linearGradient>
            </defs>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            {/* Background track */}
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: 'var(--muted, #18181b)', opacity: 0.3 }}
              fill="url(#gauge-gradient)"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        {/* Center text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black leading-none" style={{ color: 'var(--foreground, #fff)' }}>
            {value > 0 ? `${value.toFixed(2)}x` : 'N/A'}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--muted-foreground, #71717a)' }}>
            {label}
          </span>
        </div>
      </div>
    </ClientSideOnly>
  );
}
