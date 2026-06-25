'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  steps: string[];
  activeStep: number;
}

export function Stepper({ steps, activeStep }: StepperProps) {
  return (
    <div className="w-full select-none py-4">
      <div className="flex items-center justify-between w-full">
        {steps.map((step, idx) => {
          const isCompleted = activeStep > idx;
          const isActive = activeStep === idx;
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={idx}>
              {/* Step indicator */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border font-bold text-sm transition-all duration-300 ${
                    isCompleted
                      ? 'bg-gradient-to-r from-[#079EB7] to-[#14B8A6] border-transparent text-white shadow-md shadow-[#079EB7]/10'
                      : isActive
                      ? 'bg-card border-[#079EB7] text-[#079EB7] shadow-lg shadow-[#079EB7]/5 ring-4 ring-[#079EB7]/10'
                      : 'bg-card border-border text-muted/65'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} className="animate-in zoom-in duration-200" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                
                <span 
                  className={`hidden sm:block text-xs font-bold uppercase tracking-wider ${
                    isActive ? 'text-[#079EB7]' : isCompleted ? 'text-foreground' : 'text-muted/65'
                  }`}
                >
                  {step}
                </span>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div 
                  className={`flex-1 h-0.5 mx-4 rounded-full transition-all duration-500 ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-[#079EB7] to-[#14B8A6]' 
                      : 'bg-border/60'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
