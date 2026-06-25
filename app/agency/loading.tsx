import React from 'react';

export default function AgencyLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-zinc-800 animate-pulse" />
          <div className="h-4 w-32 rounded bg-zinc-800 animate-pulse" />
        </div>
        <div className="h-10 w-28 rounded bg-zinc-800 animate-pulse" />
      </div>

      {/* Grid of Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 space-y-4">
            <div className="h-4 w-1/3 rounded bg-zinc-800 animate-pulse" />
            <div className="h-8 w-2/3 rounded bg-zinc-800 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-zinc-800 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Large Table/List Skeleton */}
      <div className="border border-zinc-900 bg-zinc-950/20 rounded-2xl p-6 space-y-4">
        <div className="h-6 w-32 rounded bg-zinc-800 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between py-2 border-b border-zinc-900/50">
              <div className="h-4 w-1/4 rounded bg-zinc-800 animate-pulse" />
              <div className="h-4 w-1/6 rounded bg-zinc-800 animate-pulse" />
              <div className="h-4 w-12 rounded bg-zinc-800 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
