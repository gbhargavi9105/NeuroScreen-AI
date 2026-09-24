import React, { useState } from 'react';
import { Sparkles, FileText, Activity, Layers, LineChart, Cpu, ShieldCheck, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../firebase/AuthContext';
import { AuthButton } from './AuthButton';
import { runDiagnosticSessionVerification, DiagnosticResult } from '../firebase/diagnosticTest';

export type NavTab = 'screening' | 'results' | 'longitudinal' | 'validation' | 'code';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenReport?: () => void;
  hasResults: boolean;
  onLoadPreset: (presetId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenReport,
  hasResults,
  onLoadPreset,
}) => {
  const { authError } = useAuth();
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);

  const handleRunDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    setDiagnosticResult(null);
    try {
      const res = await runDiagnosticSessionVerification();
      setDiagnosticResult(res);
    } catch (e) {
      console.error('Diagnostic error:', e);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('screening')}
          className="text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
        >
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
            NeuroScreen <span className="text-cyan-400 font-light">AI</span>
          </span>
        </button>

        {/* Zone 2: 4-6 clean text navigation links with subtle hover states */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onSelectTab('screening')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
              activeTab === 'screening'
                ? 'text-cyan-400 border-cyan-400 font-semibold'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Multimodal Intake
          </button>
          <button
            onClick={() => onSelectTab('results')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'results'
                ? 'text-cyan-400 border-cyan-400 font-semibold'
                : hasResults
                ? 'text-slate-400 border-transparent hover:text-slate-200'
                : 'text-slate-600 border-transparent cursor-not-allowed'
            }`}
            disabled={!hasResults}
          >
            <Activity className="w-3.5 h-3.5" />
            Screening &amp; XAI
          </button>
          <button
            onClick={() => onSelectTab('longitudinal')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'longitudinal'
                ? 'text-cyan-400 border-cyan-400 font-semibold'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            Longitudinal Tracking
          </button>
          <button
            onClick={() => onSelectTab('validation')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'validation'
                ? 'text-cyan-400 border-cyan-400 font-semibold'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Benchmark Validation
          </button>
          <button
            onClick={() => onSelectTab('code')}
            className={`transition-colors whitespace-nowrap py-1 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'text-cyan-400 border-cyan-400 font-semibold'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Python ML Pipeline
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button className="text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Cohort Preset</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-1.5 hidden group-hover:block z-50">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 px-2 py-1">
                Clinical Research Presets
              </div>
              <button
                onClick={() => onLoadPreset('preset_control')}
                className="w-full text-left px-2.5 py-2 text-xs rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 transition-colors"
              >
                <div className="font-medium">Healthy Control (Age 62)</div>
                <div className="text-[11px] text-slate-400">Normative baseline parameters</div>
              </button>
              <button
                onClick={() => onLoadPreset('preset_early_variance')}
                className="w-full text-left px-2.5 py-2 text-xs rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 transition-colors"
              >
                <div className="font-medium">Early Prodromal Variance (Age 67)</div>
                <div className="text-[11px] text-slate-400">Mild jitter &amp; trajectory hesitation</div>
              </button>
              <button
                onClick={() => onLoadPreset('preset_tremor_dominant')}
                className="w-full text-left px-2.5 py-2 text-xs rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 transition-colors"
              >
                <div className="font-medium">Tremor-Dominant Motor Pattern</div>
                <div className="text-[11px] text-slate-400">4-7 Hz spiral oscillations</div>
              </button>
              <button
                onClick={() => onLoadPreset('preset_dysphonia_dominant')}
                className="w-full text-left px-2.5 py-2 text-xs rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 transition-colors"
              >
                <div className="font-medium">Acoustic Dysphonia Dominant</div>
                <div className="text-[11px] text-slate-400">Elevated shimmer &amp; reduced HNR</div>
              </button>
            </div>
          </div>

          {hasResults && onOpenReport && (
            <button
              onClick={onOpenReport}
              className="text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 px-3.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Research Report</span>
            </button>
          )}

          {/* Dedicated AuthButton Component with Google Sign-In */}
          <AuthButton
            onRunDiagnostic={handleRunDiagnostic}
            isRunningDiagnostic={isRunningDiagnostic}
          />
        </div>
      </div>

      {/* Auth Error Toast */}
      {authError && (
        <div className="bg-amber-950/90 border-b border-amber-800 text-amber-200 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Google Sign-In Notice: {authError}</span>
          </div>
        </div>
      )}

      {/* Security Diagnostic Results Modal */}
      {diagnosticResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Firestore Security Diagnostic</h3>
              </div>
              <button
                onClick={() => setDiagnosticResult(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold px-2 py-0.5 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded p-3 font-mono space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Auth Status:</span>
                  <span className={diagnosticResult.authenticated ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                    {diagnosticResult.authenticated ? 'Authenticated User' : 'Unauthenticated (Guest)'}
                  </span>
                </div>
                {diagnosticResult.userEmail && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">User Email:</span>
                    <span className="text-slate-300 truncate max-w-[240px]">{diagnosticResult.userEmail}</span>
                  </div>
                )}
                {diagnosticResult.targetPath && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Authorized Path:</span>
                    <span className="text-cyan-400 truncate max-w-[240px]">{diagnosticResult.targetPath}</span>
                  </div>
                )}
              </div>

              {/* Step checks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-750">
                  <span className="text-slate-200">1. Authorized Path Session Write:</span>
                  <span className={diagnosticResult.writeSuccess ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-amber-400 font-bold'}>
                    {diagnosticResult.writeSuccess ? <><CheckCircle2 className="w-3.5 h-3.5" /> PASS</> : (diagnosticResult.authenticated ? 'FAIL' : 'BLOCKED (By Rule)')}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-750">
                  <span className="text-slate-200">2. Authorized Read-Back Verification:</span>
                  <span className={diagnosticResult.readVerified ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-slate-400'}>
                    {diagnosticResult.readVerified ? <><CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED</> : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-750">
                  <span className="text-slate-200">3. Cross-User Unauthorized Write Guard:</span>
                  <span className={diagnosticResult.crossUserAttackBlocked ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-rose-400 font-bold'}>
                    {diagnosticResult.crossUserAttackBlocked ? <><CheckCircle2 className="w-3.5 h-3.5" /> PROTECTED (Denied)</> : 'SECURITY BREACH'}
                  </span>
                </div>
              </div>

              {/* Conclusion narrative */}
              <div className={`p-3 rounded border text-xs leading-relaxed ${
                diagnosticResult.writeSuccess && diagnosticResult.readVerified && diagnosticResult.crossUserAttackBlocked
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  : 'bg-cyan-950/40 border-cyan-800/60 text-cyan-200'
              }`}>
                {diagnosticResult.summary}
              </div>

              {diagnosticResult.errorDetails && (
                <div className="p-2.5 rounded bg-amber-950/40 border border-amber-900/60 text-amber-300 text-[11px] font-mono">
                  {diagnosticResult.errorDetails}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setDiagnosticResult(null)}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
