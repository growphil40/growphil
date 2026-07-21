'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, UserPlus, Upload, Camera, X } from 'lucide-react';

interface MobileFABProps {
  onAddLeadClick: () => void;
  onScanCardClick?: () => void;
}

export const MobileFAB: React.FC<MobileFABProps> = ({
  onAddLeadClick,
  onScanCardClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-5 z-40 md:hidden flex flex-col items-end gap-3 pointer-events-auto">
      {/* Expanded Speed-Dial Options */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2.5 animate-in slide-in-from-bottom-3 fade-in duration-200">
          {/* Scan Visiting Card Placeholder */}
          <button
            onClick={() => {
              setIsOpen(false);
              if (onScanCardClick) onScanCardClick();
              else alert('📸 Visiting Card AI Scanner coming soon!');
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold shadow-xl active:scale-95 transition-all"
          >
            <span>Scan Card (AI)</span>
            <div className="h-8 w-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Camera className="h-4 w-4" />
            </div>
          </button>

          {/* Import Lead */}
          <Link
            href="/client/integrations/google-sheets"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold shadow-xl active:scale-95 transition-all"
          >
            <span>Import Leads</span>
            <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <Upload className="h-4 w-4" />
            </div>
          </Link>

          {/* Add Lead */}
          <button
            onClick={() => {
              setIsOpen(false);
              onAddLeadClick();
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold shadow-xl active:scale-95 transition-all"
          >
            <span>Add Manual Lead</span>
            <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
              <UserPlus className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-13 w-13 rounded-full border flex items-center justify-center shadow-2xl transition-all cursor-pointer active:scale-90 ${
          isOpen
            ? 'bg-slate-800 border-slate-700 text-white rotate-45'
            : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400/40 text-white shadow-indigo-600/40'
        }`}
        aria-label="Toggle Quick Actions"
      >
        <Plus className="h-6 w-6 transition-transform duration-200" />
      </button>
    </div>
  );
};
