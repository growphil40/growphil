'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Database, Zap, ArrowRight, Sun, Moon, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegisterPage() {
  const { theme, toggleTheme } = useTheme();

  const [agencyName, setAgencyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agencyName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all the required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/v1/auth/register', {
        agencyName: agencyName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Failed to complete registration. Please try again.'
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
            Start your <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">45-Day Free Trial</span>.
          </h1>
          <p className="text-slate-450 text-sm leading-relaxed">
            Create an agency profile, provision client workflows, connect Meta Lead Ads webhooks, and map Google Sheets dynamically. No credit card required.
          </p>

          <div className="space-y-4 pt-4 text-xs font-semibold text-slate-350">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary">
                <Zap size={14} />
              </div>
              <span>Full Access to Partner Command Portal</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-secondary">
                <Database size={14} />
              </div>
              <span>Google Sheets &amp; Meta integrations included</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={14} />
              </div>
              <span>Robust multi-tenant isolation borders</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="z-10 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
          © 2026 GrowPhil CRM Ltd. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL - Theme-Adaptive Form Container */}
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
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  {/* Logo display on mobile */}
                  <div className="flex md:hidden items-center gap-3.5 mb-6">
                    <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center font-black text-black text-lg">
                      G
                    </div>
                    <span className="text-lg font-black tracking-tight text-foreground">GrowPhil</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight font-display text-foreground">
                    Get Started Free
                  </h2>
                  <p className="text-sm text-muted">Register your agency and deploy dashboards</p>
                </div>

                {error && (
                  <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-500 flex items-center gap-3 animate-in fade-in zoom-in duration-200">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                      Agency / Company Name
                    </label>
                    <input
                      type="text"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card text-foreground px-4 py-3 text-sm focus:border-primary focus:outline-none transition-premium"
                      placeholder="GrowPhil Agency"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                      Admin Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card text-foreground px-4 py-3 text-sm focus:border-primary focus:outline-none transition-premium"
                      placeholder="admin@agency.com"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                      Secure Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card text-foreground px-4 py-3 text-sm focus:border-primary focus:outline-none transition-premium"
                      placeholder="••••••••"
                      disabled={loading}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    loading={loading}
                    className="w-full py-3.5 mt-2 rounded-xl text-sm"
                    icon={<ArrowRight size={16} />}
                  >
                    Start Free Trial
                  </Button>
                </form>

                <div className="text-center text-xs text-muted">
                  Already have an agency?{' '}
                  <Link href="/login" className="text-primary font-bold hover:underline">
                    Sign In
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="space-y-6 text-center border border-border bg-card p-8 rounded-3xl shadow-xl shadow-black/5"
              >
                <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-foreground">Verify Your Email</h3>
                  <p className="text-sm text-muted">
                    We sent a verification link to <strong className="text-foreground">{email}</strong>.
                  </p>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Please click the link in the email to verify your email address and unlock your 45-day free trial. If you don't receive it within a few minutes, check your spam folder.
                </p>
                <div className="pt-4 border-t border-border space-y-3">
                  <Link href="/login" className="block">
                    <Button variant="secondary" className="w-full rounded-xl text-xs py-3">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile copyrighted text */}
        <div className="block md:hidden text-center text-[10px] text-muted font-semibold tracking-wider uppercase mt-4">
          © 2026 GrowPhil CRM Suite
        </div>
      </div>
    </div>
  );
}
