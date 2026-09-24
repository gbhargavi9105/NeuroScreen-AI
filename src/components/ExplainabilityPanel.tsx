import React from 'react';
import { HelpCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { MultimodalScreeningResult } from '../types/neuroscreen';

interface ExplainabilityPanelProps {
  result: MultimodalScreeningResult;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({ result }) => {
  const { explainability } = result;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono tracking-wider uppercase text-cyan-400">Explainable AI (XAI)</span>
          <span className="text-slate-500">·</span>
          <span className="text-xs text-slate-400">SHAP-Calibrated Feature Attributions</span>
        </div>
        <h3 className="text-base font-semibold text-slate-100 mt-1">
          Why Did The Multimodal Model Produce This Screening Result?
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Every behavioral and motor measurement is evaluated against normative healthy control cohort distributions. Below is the exact additive attribution showing how each parameter shifted the screening score.
        </p>
      </div>

      {/* SHAP Waterfall Attribution Bar Chart */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs font-semibold text-slate-200">
            Biomarker Attribution Waterfall Plot (Deviation from Baseline)
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm" />
              Elevates Risk Indication
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
              Normative / Protective
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {explainability.waterfallAttributions.map(feat => {
            const isElevating = feat.contributionScore > 0;
            const magnitude = Math.min(100, Math.abs(feat.contributionScore) * 350);

            return (
              <div key={feat.featureKey} className="flex flex-col gap-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-medium text-slate-300 truncate max-w-[280px]">
                    {feat.featureDisplayName}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-400">
                      Observed: <strong className="text-slate-200">{feat.value} {feat.unit}</strong>
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-500">
                      Norm: {feat.referenceControlNorm}
                    </span>
                    <span
                      className={`font-semibold ml-1 ${
                        isElevating ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {isElevating ? '+' : ''}{(feat.contributionScore * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Bar representation */}
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex">
                  {isElevating ? (
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(6, magnitude)}%` }}
                    />
                  ) : (
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(6, magnitude)}%` }}
                    />
                  )}
                </div>

                <div className="text-[11px] text-slate-400 italic">
                  {feat.clinicalInterpretation}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Counterfactual Insight Card */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <div className="text-xs font-semibold text-cyan-300">
            Counterfactual Sensitivity Analysis
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            {explainability.counterfactualRecommendation}
          </div>
        </div>
      </div>

      {/* Medical Safety Disclaimer Guardrail */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200 font-semibold">Important Methodology Note: </strong>
          Feature attributions quantify mathematical contributions within a statistical ensemble. They do not constitute diagnostic causality or confirm pathology. Only a qualified medical specialist with neurological imaging (e.g. DaTscan) and physical exam can determine clinical significance.
        </div>
      </div>
    </div>
  );
};
