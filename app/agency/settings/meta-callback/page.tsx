'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function MetaCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const success = searchParams.get('success') === 'true';
  const clientId = searchParams.get('clientId');

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-900/10 p-8 backdrop-blur-xl text-center space-y-6">
        {success ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <svg
                className="h-8 w-8 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                Meta Connected Successfully!
              </h1>
              <p className="text-sm text-slate-400">
                Your client's Facebook Ads account has been linked to the GrowPhil CRM database.
              </p>
            </div>

            {clientId && (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-left">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Linked Client Reference</span>
                <span className="font-mono text-xs text-slate-300 mt-1 block truncate">{clientId}</span>
              </div>
            )}

            <div className="pt-4 flex flex-col gap-2">
              {clientId ? (
                <Link
                  href={`/agency/clients/${clientId}`}
                  className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  Return to Client Details
                </Link>
              ) : (
                <Link
                  href="/agency/clients"
                  className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  Return to Clients List
                </Link>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 border border-red-500/30">
              <svg
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent">
                Connection Failed
              </h1>
              <p className="text-sm text-slate-400">
                Something went wrong during the Meta OAuth handshake. Please verify your permissions and try again.
              </p>
            </div>

            <div className="pt-4">
              <Link
                href="/agency/clients"
                className="w-full block rounded-lg bg-slate-800 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                Return to Clients List
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function MetaCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-slate-950 text-white">
          <p className="text-slate-400 text-sm">Verifying Meta connection parameters...</p>
        </div>
      }
    >
      <MetaCallbackContent />
    </Suspense>
  );
}
