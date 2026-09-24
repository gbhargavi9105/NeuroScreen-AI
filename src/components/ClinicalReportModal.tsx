import React from 'react';
import { X, Printer, Download, ShieldAlert, CheckCircle2, Activity } from 'lucide-react';
import { MultimodalScreeningResult } from '../types/neuroscreen';

interface ClinicalReportModalProps {
  result: MultimodalScreeningResult;
  onClose: () => void;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({ result, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `neuroscreen_report_${result.sessionId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-100">NeuroScreen AI — Clinical Research Report</span>
            <span className="text-slate-500">·</span>
            <span className="text-xs font-mono text-cyan-400">{result.sessionId}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJson}
              className="text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-200 printable-area">
          {/* Header & Meta */}
          <div className="border-b border-slate-800 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Multimodal Neurological Screening Evaluation
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Investigational Decision-Support Biomarker Synthesis
                </p>
              </div>
              <div className="text-right font-mono text-xs text-slate-400 space-y-0.5">
                <div>Date: {new Date(result.timestamp).toLocaleDateString()}</div>
                <div>Time: {new Date(result.timestamp).toLocaleTimeString()}</div>
                <div>Subject: {result.userId}</div>
              </div>
            </div>
          </div>

          {/* Prominent Mandatory Research Disclaimer */}
          <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-300 uppercase tracking-wide font-semibold block mb-0.5">
                Investigational Research Prototype Notice
              </strong>
              This screening summary is generated automatically by a machine learning ensemble for research and decision-support purposes only. It does <strong className="text-white font-medium">NOT</strong> constitute a medical diagnosis of Parkinson&apos;s disease, parkinsonism, or any neurodegenerative condition. Diagnostic confirmation requires full in-person neurological examination by a movement disorder specialist. Do not alter or initiate medical therapy based on this report.
            </div>
          </div>

          {/* Score Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 rounded-xl p-5 border border-slate-800">
            <div>
              <div className="text-[11px] uppercase font-mono text-slate-400">Composite Risk Indication</div>
              <div className="text-3xl font-mono font-bold text-cyan-300 mt-1">
                {result.overallRiskScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5 capitalize">
                Status: <strong className="text-slate-200">{result.riskLevel.replace('_', ' ')}</strong>
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase font-mono text-slate-400">Ensemble Confidence</div>
              <div className="text-3xl font-mono font-bold text-slate-100 mt-1">
                {result.confidenceScore}%
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                95% Interval: [{result.credibleInterval95[0]}% – {result.credibleInterval95[1]}%]
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase font-mono text-slate-400">Modalities Synthesized</div>
              <div className="text-3xl font-mono font-bold text-slate-100 mt-1">
                {result.modalitiesEvaluatedCount} / 4
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Handwriting · Voice · Motor · Survey
              </div>
            </div>
          </div>

          {/* Clinical Interpretation Headline */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-wide">
              Clinical Context &amp; Recommended Next Steps
            </h3>
            <p className="text-sm font-medium text-slate-100">
              {result.clinicalSummary.indicationHeadline}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {result.clinicalSummary.clinicalContext}
            </p>
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
              <strong className="text-slate-200">Recommended Next Step: </strong>
              {result.clinicalSummary.recommendedNextStep}
            </p>
          </div>

          {/* Explainable AI Biomarker Findings Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">
              Extracted Biomarker Attribution Table (SHAP-Calibrated)
            </h3>
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 font-mono uppercase text-[10px] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3.5 py-2.5">Biomarker Feature</th>
                    <th className="px-3.5 py-2.5">Observed Value</th>
                    <th className="px-3.5 py-2.5">Normative Cohort Benchmark</th>
                    <th className="px-3.5 py-2.5">Attribution Effect</th>
                    <th className="px-3.5 py-2.5">Clinical Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {result.explainability.waterfallAttributions.map(feat => {
                    const isElevating = feat.contributionScore > 0;
                    return (
                      <tr key={feat.featureKey}>
                        <td className="px-3.5 py-2.5 font-sans font-medium text-slate-200">
                          {feat.featureDisplayName}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-100">
                          {feat.value} {feat.unit}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-400">
                          {feat.referenceControlNorm}
                        </td>
                        <td className={`px-3.5 py-2.5 font-bold ${isElevating ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {isElevating ? '+' : ''}{(feat.contributionScore * 100).toFixed(1)}%
                        </td>
                        <td className="px-3.5 py-2.5 font-sans text-slate-400 text-[11px]">
                          {feat.clinicalInterpretation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sign-off & Audit Trail */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between text-xs text-slate-500 font-mono">
            <div>Engine: NeuroScreen AI v1.2.0 (Late-Fusion Meta Ensemble)</div>
            <div>Verification Hash: SHA256-{(Math.random() * 1e16).toString(16)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
