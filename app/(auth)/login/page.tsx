'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Database, Zap, ArrowRight, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';

import { getAccessToken } from '../../../lib/auth';

export default function LoginPage() {
  const { login, user, error: authError, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Unverified email states
  const [isUnverified, setIsUnverified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      const token = getAccessToken();
      if (!token) return; // Do not auto-redirect if access token is missing

      const targetUrl = user.role === 'agency_admin' 
        ? '/agency/dashboard' 
        : (user.role === 'client_owner' || user.role === 'super_admin') 
          ? '/client/leads' 
          : '/';
      if (window.location.pathname !== targetUrl) {
        window.location.href = targetUrl;
      }
    }
  }, [user, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnverified(false);
    setResendSuccess(false);
    setResendError(null);

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      const loggedInUser = await login(email, password, rememberMe);
      const targetUrl = loggedInUser.role === 'agency_admin' 
        ? '/agency/dashboard' 
        : (loggedInUser.role === 'client_owner' || loggedInUser.role === 'super_admin') 
          ? '/client/leads' 
          : '/';
      window.location.href = targetUrl;
    } catch (err: any) {
      const errCode = err.response?.data?.code || err.response?.data?.errorDetails?.code || err.response?.data?.error?.code;
      if (errCode === 'EMAIL_NOT_VERIFIED') {
        setIsUnverified(true);
        setUnverifiedEmail(email);
      }
    }
  };

  const handleResendVerification = async () => {
    setResendError(null);
    setResendSuccess(false);

    try {
      setResendLoading(true);
      await api.post('/v1/auth/verify-email/resend', {
        email: unverifiedEmail,
      });
      setResendSuccess(true);
    } catch (err: any) {
      setResendError(
        err.response?.data?.error?.message || 'Failed to resend verification. Please try again.'
      );
    } finally {
      setResendLoading(false);
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
            The next generation of <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Lead Intelligence</span> is here.
          </h1>
          <p className="text-slate-450 text-sm leading-relaxed">
            Unify your digital agency, synchronize leads across sheets and Meta webhooks, and automate pipelines with military-grade speed.
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
            <h2 className="text-3xl font-black tracking-tight font-display text-foreground">Welcome Back</h2>
            <p className="text-sm text-muted">Sign in to access your dashboard metrics</p>
          </div>

          {(error || authError) && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-500 text-center animate-in fade-in zoom-in duration-200">
              {error || authError}
            </div>
          )}

          {isUnverified && (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-3 animate-in fade-in zoom-in duration-200 text-center">
              <p className="text-xs font-bold text-amber-500">
                Please verify your email before logging in.
              </p>
              {resendSuccess ? (
                <p className="text-[11px] text-emerald-400 font-semibold">
                  A fresh verification email has been sent. Check your inbox!
                </p>
              ) : (
                <div className="space-y-1.5">
                  {resendError && (
                    <p className="text-[10px] text-red-500 font-bold">{resendError}</p>
                  )}
                  <Button
                    onClick={handleResendVerification}
                    loading={resendLoading}
                    variant="secondary"
                    className="w-full py-2.5 rounded-xl text-xs font-bold"
                  >
                    Resend Verification Link
                  </Button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-card text-foreground px-4 py-3 text-sm focus:border-primary focus:outline-none transition-premium"
                placeholder="you@company.com"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[11px] text-primary font-bold hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card text-foreground pl-4 pr-11 py-3 text-sm focus:border-primary focus:outline-none transition-premium"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground active:scale-95 transition-colors p-1"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center py-1">
              <label className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-muted hover:text-foreground cursor-pointer select-none transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4.5 w-4.5 rounded-md border border-border bg-card text-primary focus:ring-primary focus:ring-offset-background transition-premium cursor-pointer accent-primary"
                  disabled={loading}
                />
                Remember me
              </label>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full py-3.5 mt-2 rounded-xl text-sm"
              icon={<ArrowRight size={16} />}
            >
              Sign In to Suite
            </Button>
          </form>

          <div className="text-center text-xs text-muted">
            Don't have an agency?{' '}
            <Link href="/register" className="text-primary font-bold hover:underline">
              Register Here
            </Link>
          </div>


        </div>

        {/* Mobile copyrighted text */}
        <div className="block md:hidden text-center text-[10px] text-muted font-semibold tracking-wider uppercase mt-4">
          © 2026 GrowPhil CRM Suite
        </div>
      </div>

    </div>
  );
}
