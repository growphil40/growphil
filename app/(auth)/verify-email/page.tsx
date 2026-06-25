'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, RotateCw } from 'lucide-react';
import { useTheme } from '../../ThemeProvider';
import { motion } from 'framer-motion';

function VerifyEmailContent() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Verification token is missing. Please click the link in your email again.');
      return;
    }

    const performVerification = async () => {
      try {
        await api.get(`/v1/auth/verify-email?token=${token}`);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(
          err.response?.data?.error?.message ||
            'The verification link is invalid or has expired. Please request a new one below.'
        );
      }
    };

    // Small delay to allow smoother transitions
    const timer = setTimeout(() => {
      performVerification();
    }, 1500);

    return () => clearTimeout(timer);
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendError(null);
    setResendSuccess(false);

    if (!resendEmail.trim()) {
      setResendError('Please enter your email address.');
      return;
    }

    try {
      setResendLoading(true);
      await api.post('/v1/auth/verify-email/resend', {
        email: resendEmail.trim().toLowerCase(),
      });
      setResendSuccess(true);
      setResendEmail('');
    } catch (err: any) {
      setResendError(
        err.response?.data?.error?.message || 'Failed to resend verification. Please verify your email address.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0F1D] relative p-6 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary opacity-10 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary opacity-5 blur-3xl" />

      <div className="w-full max-w-md space-y-8 z-10 text-center">
        {/* Logo header */}
        <div className="flex items-center justify-center gap-3.5 select-none">
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center font-black text-black text-xl shadow-lg shadow-primary/25">
            G
          </div>
          <div className="text-left">
            <span className="text-xl font-black tracking-tight text-white block">GrowPhil</span>
            <span className="text-[10px] text-primary font-bold tracking-widest uppercase block -mt-1">
              Enterprise Suite
            </span>
          </div>
        </div>

        {status === 'verifying' && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-border bg-card/60 backdrop-blur-md p-8 rounded-3xl space-y-6 shadow-xl"
          >
            <div className="mx-auto h-16 w-16 flex items-center justify-center text-primary">
              <RotateCw size={36} className="animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Verifying Account</h3>
              <p className="text-sm text-muted">Confirming your cryptographic token credentials...</p>
            </div>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-border bg-card p-8 rounded-3xl space-y-6 shadow-xl"
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Email Verified!</h3>
              <p className="text-sm text-emerald-400 font-semibold">Your 45-day trial is now active.</p>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Thank you for verifying your email address. You have successfully unlocked full CRM capabilities, Meta integrations, and Google Sheets connectors.
            </p>
            <div className="pt-4 border-t border-border">
              <Link href="/login" className="block">
                <Button className="w-full rounded-xl text-xs py-3.5 font-bold" icon={<ArrowRight size={14} />}>
                  Proceed to Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-border bg-card p-8 rounded-3xl space-y-6 shadow-xl"
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Verification Failed</h3>
              <p className="text-sm text-red-400 font-semibold">{errorMessage}</p>
            </div>

            {/* Resend Card */}
            <div className="pt-6 border-t border-border text-left space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Request New Verification Link</h4>
              
              {resendSuccess && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-400 font-semibold text-center animate-in fade-in zoom-in duration-200">
                  A fresh verification link has been sent to your email.
                </div>
              )}

              {resendError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400 font-semibold text-center animate-in fade-in zoom-in duration-200">
                  {resendError}
                </div>
              )}

              <form onSubmit={handleResend} className="space-y-3">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-[#0E1322] text-foreground px-4 py-2.5 text-xs focus:border-primary focus:outline-none transition-premium"
                  placeholder="admin@agency.com"
                  disabled={resendLoading}
                  required
                />
                <Button
                  type="submit"
                  loading={resendLoading}
                  variant="secondary"
                  className="w-full py-2.5 rounded-xl text-xs"
                >
                  Resend Verification Email
                </Button>
              </form>
            </div>

            <div className="pt-2">
              <Link href="/login" className="text-xs text-primary font-bold hover:underline">
                Return to Sign In
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0F1D] text-white">
        <RotateCw className="animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
