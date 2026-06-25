'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AgencyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Agency section error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-yellow-500 text-3xl font-bold shadow-lg">
          ⚠️
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Agency Portal Error</h1>
          <p className="text-zinc-400 text-sm">
            {error.message || 'An error occurred loading agency details.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-[#3B82F6] text-black hover:bg-[#3B82F6]/90 font-bold transition-all cursor-pointer text-sm"
          >
            Try again
          </button>
          <Link
            href="/agency/clients"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-white font-semibold transition-all text-sm"
          >
            Back to Clients
          </Link>
        </div>
      </div>
    </div>
  );
}

