'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Client section error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center text-yellow-500 text-3xl font-bold shadow-lg">
          ⚠️
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Client Portal Error</h1>
          <p className="text-text-secondary text-sm">
            {error.message || 'An error occurred loading client details.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-primary text-white hover:brightness-105 font-bold transition-all cursor-pointer text-sm shadow-md shadow-primary/20"
          >
            Try again
          </button>
          <Link
            href="/client/leads"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-border hover:bg-hover text-white font-semibold transition-all text-sm"
          >
            Back to Leads
          </Link>
        </div>
      </div>
    </div>
  );
}
