'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Database, Zap, ArrowRight, Sun, Moon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';

function ResetPasswordContent() {
  const { theme, toggleTheme } = useTheme();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!token) {
      setError('Password reset token is missing. Please click the link in your email again.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/v1/auth/reset-password', {
        token,
        password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to reset password. The link may have expired or is invalid.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background text-foreground transition-premium">
      
      {/* LEFT PANEL - Premium Branding Illustration */}
      <div className="hidden md:flex md:w-1/2 bg-[#0A0F1D] relative flex-col justify-between p-12 overflow-hidden select-none border-r border-border">
        {/* Glow Spheres */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary opacity-15 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary opacity-10 blur-3xl" />
        
        {/* Logo Header */}
        <div className="flex items-center gap-3.5 z-10">
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center font-black text-black text-xl shadow-lg shadow-primary/25">
            G
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white block">GrowPhil</span>
            <span className="text-[10px] text-primary font-bold tracking-widest uppercase block -mt-1">
              Enterprise Suite
            </span>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="my-auto z-10 max-w-lg space-y-8">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white font-display">
            Secure your <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">GrowPhil Workspace</span>.
          </h1>
          <p className="text-slate-450 text-sm leading-relaxed">
            Choose a strong password containing letters, numbers, and special characters to protect your leads, sync sheets, and integrations.
          </p>
 
          <div className="space-y-4 pt-4 text-xs font-semibold text-slate-350">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary">
                <Zap size={14} />
              </div>
              <span>Real-time lead webhook synchronization</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-secondary">
                <Database size={14} />
              </div>
              <span>Automated Google Sheets sync &amp; header mapping</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={14} />
              </div>
              <span>Tenant security and role separation scopes</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="z-10 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
          © 2026 GrowPhil CRM Ltd. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL - Theme-Adaptive Form container */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 relative">
        {/* Top bar controls */}
        <div className="flex justify-end items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted/15 active:scale-95 transition-premium cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Center Form Card */}
        <div className="my-auto mx-auto w-full max-w-md space-y-8 py-10">
          <div className="space-y-2">
            {/* Logo display on mobile */}
            <div className="flex md:hidden items-center gap-3.5 mb-6">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center font-black text-black text-lg">
                G
              </div>
              <span className="text-lg font-black tracking-tight text-foreground">GrowPhil</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight font-display text-foreground">Choose New Password</h2>
            <p className="text-sm text-muted">Create a secure password for your GrowPhil CRM account</p>
          </div>

          {!token && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-500 text-center animate-in fade-in zoom-in duration-200">
              Reset token is missing. Please check your email and click the password reset link again.
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-500 text-center animate-in fade-in zoom-in duration-200">
              {error}
            </div>
          )}

          {success ? (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">Password Reset Successful</h3>
              <p className="text-sm text-muted">
                Your password has been successfully updated. You can now log in using your new credentials.
              </p>
              <div className="pt-2">
                <Link href="/login" className="inline-block w-full py-3.5 bg-primary text-black text-sm font-black rounded-xl transition-premium text-center hover:opacity-90">
                  Proceed to Login
                </Link>
              </div>
            </div>
          ) : (
            token && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card text-foreground px-4 py-3 text-sm focus:border-primary focus:outline-none transition-premium"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card text-foreground px-4 py-3 text-sm focus:border-primary focus:outline-none transition-premium"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full py-3.5 mt-2 rounded-xl text-sm"
                  icon={<ArrowRight size={16} />}
                >
                  Update Password
                </Button>
              </form>
            )
          )}

          {!success && (
            <div className="text-center text-xs text-muted">
              Back to{' '}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Mobile copyrighted text */}
        <div className="block md:hidden text-center text-[10px] text-muted font-semibold tracking-wider uppercase mt-4">
          © 2026 GrowPhil CRM Suite
        </div>
      </div>

    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0F1D] text-white">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
          <p className="text-sm font-semibold">Loading Reset Password Screen...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
