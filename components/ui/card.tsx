'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
  glass?: boolean;
}

export function AppCard({
  children,
  hoverEffect = true,
  glass = false,
  className = '',
  ...props
}: AppCardProps) {
  return (
    <div
      className={`rounded-3xl border transition-all duration-300 ${
        glass
          ? 'glass-card border-border'
          : 'bg-card text-card-foreground border-border shadow-[0_10px_40px_rgba(0,0,0,0.4)]'
      } ${
        hoverEffect
          ? 'hover:shadow-[0_20px_50px_rgba(0,0,0,0.6)] dark:hover:shadow-black/60 hover:-translate-y-1 hover:border-border/30'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: number | string;
    isPositive: boolean;
  };
  sparkline?: number[];
  icon?: React.ReactNode;
  accentColor?: string;
}

export function MetricCard({
  title,
  value,
  subtext,
  trend,
  sparkline,
  icon,
  accentColor = '#3B82F6',
}: MetricCardProps) {
  // SVG Sparkline drawing helper
  const drawSparkline = (data: number[]) => {
    if (!data || data.length < 2) return null;
    const width = 80;
    const height = 28;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min === 0 ? 1 : max - min;
    
    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');
      
    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <AppCard className="p-6 relative overflow-hidden group">
      {/* Background soft glow decoration */}
      <div 
        className="absolute top-0 right-0 h-28 w-28 rounded-full blur-3xl -translate-y-8 translate-x-8 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted/80 uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-black tracking-tight mt-1 text-foreground">{value}</h3>
        </div>
        {icon && (
          <div 
            className="p-3 rounded-2xl border transition-colors duration-300"
            style={{ 
              backgroundColor: `${accentColor}10`, 
              borderColor: `${accentColor}20`,
              color: accentColor 
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          {trend ? (
            <div className="flex items-center gap-1.5 text-xs font-extrabold">
              <span 
                className={`inline-flex items-center px-2 py-0.5 rounded-full border ${
                  trend.isPositive
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}
              >
                {trend.isPositive ? (
                  <ArrowUpRight size={12} className="mr-0.5 shrink-0" />
                ) : (
                  <ArrowDownRight size={12} className="mr-0.5 shrink-0" />
                )}
                {trend.value}%
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-muted font-bold tracking-wider uppercase">Overview</span>
          )}
          {subtext && <p className="text-[11px] text-muted mt-1.5 font-medium">{subtext}</p>}
        </div>

        {sparkline && sparkline.length > 0 && (
          <div className="shrink-0 p-1 bg-background/40 dark:bg-black/10 rounded-xl border border-border/50">
            {drawSparkline(sparkline)}
          </div>
        )}
      </div>
    </AppCard>
  );
}
