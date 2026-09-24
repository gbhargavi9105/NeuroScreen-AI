import React from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Share2,
  FileText,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Cloud,
} from 'lucide-react';
import { MultimodalScreeningResult, ModalityType } from '../types/neuroscreen';
import { ExplainabilityPanel } from './ExplainabilityPanel';

interface ResultsDashboardProps {
  result: MultimodalScreeningResult;
  onOpenReport: () => void;
  firestorePath?: string | null;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  result,
  onOpenReport,
  firestorePath,
}) => {
  const { overallRiskScore, riskLevel, confidenceScore, credibleInterval95, modalityResults, modalityWeights, clinicalSummary } = result;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low_indication':
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Low Variance Indication' };
      case 'mild_variance':
        return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Mild Motor/Acoustic Variance' };
      case 'elevated_pattern':
        return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', label: 'Elevated Risk Indication Pattern' };
      default:
        return { text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', label: 'Insufficient Data' };
    }
  };

  const riskStyle = getRiskColor(riskLevel);

  const modalitiesList: { type: ModalityType; name: string; desc: string }[] = [
    { type: 'handwriting', name: 'Spiral Kinematics', desc: 'HandPD Random Forest' },
    { type: 'voice', name: 'Acoustic Dysphonia', desc: 'UCI Speech XGBoost' },
    { type: 'motor', name: 'Motor Rhythmicity', desc: 'Finger Tapping SVM' },
    { type: 'questionnaire', name: 'Behavioral Screener', desc: 'MDS-UPDRS Scoring' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Screening Result Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:p-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">Session Evaluation</span>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-mono text-slate-400">{result.sessionId}</span>
              {firestorePath && (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1.5">
                  <Cloud className="w-3 h-3" />
                  <span>Firestore Saved: {firestorePath}</span>
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
              Multimodal Neurological Screening Output
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenReport}
              className="text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Full Clinical Report</span>
            </button>
          </div>
        </div>

        {/* Core Metric Visualizer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Main Risk Gauge Scoreboard */}
          <div className="md:col-span-6 bg-slate-950/80 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Composite Multimodal Screening Indicator
            </div>

            {/* Score Ring */}
            <div className="relative flex items-center justify-center w-40 h-40 my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className={`${
                    overallRiskScore < 35
                      ? 'stroke-emerald-400'
                      : overallRiskScore < 60
                      ? 'stroke-amber-400'
                      : 'stroke-rose-400'
                  } transition-all duration-1000 ease-out`}
                  strokeWidth="8"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * overallRiskScore) / 100}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-mono font-bold text-slate-100 tabular-nums">
                  {overallRiskScore}
                </span>
                <span className="text-[10px] uppercase font-mono text-slate-400">/ 100 Score</span>
              </div>
            </div>

            {/* Status Badge */}
            <div className={`mt-2 px-3 py-1 rounded border text-xs font-semibold ${riskStyle.bg} ${riskStyle.border} ${riskStyle.text}`}>
              {riskStyle.label}
            </div>

            <div className="text-[11px] text-slate-400 font-mono mt-3">
              95% Credible Interval: [{credibleInterval95[0]}% – {credibleInterval95[1]}%]
            </div>
          </div>

          {/* Clinical Interpretation & Uncertainty */}
          <div className="md:col-span-6 flex flex-col gap-4">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Model Context &amp; Significance
                </span>
              </div>
              <h4 className="text-base font-semibold text-slate-100 mb-1">
                {clinicalSummary.indicationHeadline}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {clinicalSummary.clinicalContext}
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 font-medium">Recommended Follow-up: </strong>
                  {clinicalSummary.recommendedNextStep}
                </div>
              </div>
            </div>

            {/* Uncertainty & Coverage Telemetry */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] text-slate-400 mb-1">Ensemble Confidence</div>
                <div className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                  {confidenceScore}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Coverage-weighted certainty</div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] text-slate-400 mb-1">Modalities Active</div>
                <div className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                  {result.modalitiesEvaluatedCount} / 4
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Late-fusion ensemble</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modality Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modalitiesList.map(({ type, name, desc }) => {
          const modRes = modalityResults[type];
          const weight = modalityWeights[type];
          const isCompleted = modRes.status === 'completed';
          const prob = Math.round(modRes.riskProbability * 100);

          return (
            <div
              key={type}
              className={`bg-slate-900 border rounded-xl p-5 flex flex-col justify-between transition-all ${
                isCompleted ? 'border-slate-800' : 'border-slate-800/40 opacity-60'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                    {name}
                  </span>
                  {isCompleted ? (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      Weight: {(weight * 100).toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">Omitted</span>
                  )}
                </div>

                <div className="text-sm font-semibold text-slate-200">{desc}</div>

                {isCompleted ? (
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-slate-100 tabular-nums">
                      {prob}%
                    </span>
                    <span className="text-xs text-slate-400">modality risk</span>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-slate-500 italic">No input provided</div>
                )}
              </div>

              {isCompleted && modRes.topFeatures.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="text-slate-500 font-mono mb-1">Key Indicator:</div>
                  <div className="truncate text-slate-300 font-medium">
                    {modRes.topFeatures[0].featureDisplayName}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                    {modRes.topFeatures[0].value} {modRes.topFeatures[0].unit}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Explainable AI (XAI) Component */}
      <ExplainabilityPanel result={result} />
    </div>
  );
};
