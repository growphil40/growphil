'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  // Read growphil_user from cookies to determine dashboard route client-side
  let dashboardUrl = '/login';
  if (typeof window !== 'undefined') {
    const userCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('growphil_user='));
    if (userCookie) {
      try {
        const user = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
        if (user?.role === 'agency_admin') {
          dashboardUrl = '/agency/clients';
        } else if (user?.role === 'client_owner') {
          dashboardUrl = '/client/leads';
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-card border border-border flex items-center justify-center text-yellow-500 text-3xl font-bold shadow-lg">
          ⚠️
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-white">Something went wrong</h1>
          <p className="text-text-secondary text-sm">
            {error.message || 'An unexpected application error occurred.'}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full px-5 py-3 rounded-xl bg-primary text-white hover:brightness-105 font-bold transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            Try again
          </button>
          <Link
            href={dashboardUrl}
            className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl border border-border hover:bg-hover text-white font-semibold transition-all"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
