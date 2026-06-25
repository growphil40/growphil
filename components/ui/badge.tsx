'use client';

import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  children,
  variant = 'secondary',
  dot = false,
  pulse = false,
  className = '',
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border tracking-wide uppercase';
  
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-500 border-red-500/20',
    info: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-muted/10 text-muted border-muted/20',
  };

  const dots = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-primary',
    secondary: 'bg-muted',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {dot && (
        <span 
          className={`w-1.5 h-1.5 rounded-full ${dots[variant]} ${pulse ? 'animate-pulse' : ''}`}
        />
      )}
      {children}
    </span>
  );
}
