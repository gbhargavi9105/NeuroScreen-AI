import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

export const MedicalSafetyBanner: React.FC = () => {
  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 text-xs text-slate-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-cyan-400">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="font-semibold tracking-wide uppercase text-[11px]">Research Prototype & Decision Support Only</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 text-slate-500" />
          <span>
            NeuroScreen AI is an investigational screening prototype. It does <strong className="text-slate-300 font-medium">NOT diagnose</strong> Parkinson&apos;s disease or any neurological condition. Results reflect statistical model correlations and must not guide medication or clinical therapy.
          </span>
        </div>
      </div>
    </div>
  );
};
