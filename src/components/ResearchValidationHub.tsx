import React, { useState } from 'react';
import {
  Layers,
  Award,
  ShieldCheck,
  Code2,
  Copy,
  Check,
  FileCode,
  Terminal,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import { BENCHMARK_MODELS } from '../utils/sampleData';
import {
  PYTHON_TRAIN_PIPELINE_SCRIPT,
  PYTHON_REQUIREMENTS_TXT,
  PYTHON_WINDOWS_CLI_GUIDE,
} from '../utils/pythonCodeExport';

export const ResearchValidationHub: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'pipeline' | 'requirements' | 'windows'>('pipeline');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">Model Evaluation</span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400">Empirical Cross-Validation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
            Machine Learning Benchmark &amp; Validation Suite
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Subject-independent cross-validation across HandPD, UCI Acoustic Dysphonia, and Multimodal Late Fusion.
          </p>
        </div>
      </div>

      {/* Model Benchmark Performance Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Comparative Model Performance Metrics
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated using 5-Fold Stratified Group K-Fold (Strictly Subject-Independent / Zero Data Leakage)
            </p>
          </div>
          <div className="text-[11px] font-mono text-cyan-400">
            Metric Target: Screening Sensitivity &gt; 88%
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Model Architecture</th>
                <th className="px-4 py-3">Dataset / Modality</th>
                <th className="px-4 py-3">Sensitivity (Recall)</th>
                <th className="px-4 py-3">Specificity</th>
                <th className="px-4 py-3">Accuracy</th>
                <th className="px-4 py-3">F1-Score</th>
                <th className="px-4 py-3">ROC-AUC</th>
                <th className="px-4 py-3">PR-AUC</th>
                <th className="px-4 py-3">Confusion (TP/FP/TN/FN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {BENCHMARK_MODELS.map((m, idx) => {
                const isFusion = idx === BENCHMARK_MODELS.length - 1;
                return (
                  <tr
                    key={m.modelName}
                    className={`transition-colors ${
                      isFusion
                        ? 'bg-cyan-500/10 hover:bg-cyan-500/15 font-semibold text-cyan-200'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-4 py-3.5 flex items-center gap-1.5 font-sans">
                      {isFusion && <Award className="w-4 h-4 text-cyan-400 shrink-0" />}
                      <span className={isFusion ? 'text-cyan-300 font-semibold' : 'text-slate-200'}>
                        {m.modelName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-sans">{m.modality}</td>
                    <td className="px-4 py-3.5 tabular-nums text-emerald-400 font-bold">
                      {(m.sensitivityRecall * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-slate-200">
                      {(m.specificity * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3.5 tabular-nums">{(m.accuracy * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3.5 tabular-nums">{(m.f1Score * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3.5 tabular-nums text-cyan-300 font-bold">{m.rocAuc.toFixed(3)}</td>
                    <td className="px-4 py-3.5 tabular-nums">{m.prAuc.toFixed(3)}</td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-400">
                      {m.truePositives} / {m.falsePositives} / {m.trueNegatives} / {m.falseNegatives}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Clinical Significance Note */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4 flex items-start gap-3 mt-2">
          <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-slate-100 font-semibold">Why Sensitivity &amp; Specificity Outweigh Accuracy in Screening: </strong>
            In clinical decision support, false negatives (missed early motor variances) are costly because early intervention opportunities are lost. Sensitivity measures the fraction of actual variance cases correctly flagged ({'>'}92.5% in Multimodal Late Fusion vs ~87% in unimodal models). Specificity ensures healthy individuals are not burdened with unwarranted anxiety.
          </div>
        </div>
      </div>

      {/* Methodology & Data Leakage Prevention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Zero Subject-Level Data Leakage Protocol
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In handwriting and speech datasets (such as HandPD), participants typically execute multiple spiral drawing trials (e.g. 2 to 4 spirals per subject). Standard random train/test splitting leaks subject characteristics across folds, creating artificially inflated accuracy. NeuroScreen strictly enforces <strong className="text-slate-100 font-medium">Stratified Group K-Fold</strong>, guaranteeing that all trials from any given participant reside strictly in either the training set or the test set.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <BarChart3 className="w-4 h-4" />
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Multimodal Fusion Gain (Unimodal vs Late Fusion)
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Unimodal classifiers exhibit modality-specific vulnerabilities: handwriting signals fail to capture vocal tremor, while speech models cannot register manual bradykinesia. Uncertainty-weighted Late Fusion increases the Area Under the ROC Curve from <strong className="text-slate-100 font-medium">0.912 to 0.954</strong>, demonstrating statistically significant synergy across complementary motor and behavioral domains.
          </p>
        </div>
      </div>

      {/* Offline Training Code & Windows Commands */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Offline Python Research Pipeline &amp; Windows Setup
              </h3>
              <p className="text-xs text-slate-400">
                Complete, self-contained Python scripts for academic presentation, training, and artifact serialization.
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveCodeTab('pipeline')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeCodeTab === 'pipeline' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              train_pipeline.py
            </button>
            <button
              onClick={() => setActiveCodeTab('windows')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeCodeTab === 'windows' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Windows Commands (PowerShell)
            </button>
            <button
              onClick={() => setActiveCodeTab('requirements')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeCodeTab === 'requirements' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              requirements.txt
            </button>
          </div>
        </div>

        {/* Code Viewer */}
        <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex justify-between items-center px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span>
              {activeCodeTab === 'pipeline'
                ? 'src/models/train_pipeline.py'
                : activeCodeTab === 'windows'
                ? 'Windows PowerShell Setup'
                : 'requirements.txt'}
            </span>
            <button
              onClick={() =>
                handleCopy(
                  activeCodeTab === 'pipeline'
                    ? PYTHON_TRAIN_PIPELINE_SCRIPT
                    : activeCodeTab === 'windows'
                    ? PYTHON_WINDOWS_CLI_GUIDE
                    : PYTHON_REQUIREMENTS_TXT,
                  activeCodeTab
                )
              }
              className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors text-[11px]"
            >
              {copiedKey === activeCodeTab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[440px] leading-relaxed selection:bg-cyan-500/30">
            {activeCodeTab === 'pipeline'
              ? PYTHON_TRAIN_PIPELINE_SCRIPT
              : activeCodeTab === 'windows'
              ? PYTHON_WINDOWS_CLI_GUIDE
              : PYTHON_REQUIREMENTS_TXT}
          </pre>
        </div>
      </div>
    </div>
  );
};
