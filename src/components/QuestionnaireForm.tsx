import React from 'react';
import { QuestionnaireFeatures } from '../types/neuroscreen';

interface QuestionnaireFormProps {
  features: QuestionnaireFeatures;
  onChange: (updated: QuestionnaireFeatures) => void;
}

export const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({
  features,
  onChange,
}) => {
  const update = <K extends keyof QuestionnaireFeatures>(key: K, value: QuestionnaireFeatures[K]) => {
    onChange({ ...features, [key]: value });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono tracking-wider uppercase text-cyan-400">Modality 04</span>
          <span className="text-slate-500">·</span>
          <span className="text-xs text-slate-400">Behavioral Inventory</span>
        </div>
        <h3 className="text-base font-semibold text-slate-100 mt-1">
          Non-Diagnostic Prodromal Behavioral Screener (MDS-UPDRS Inventory)
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Standardized self-reported inventory capturing motor stiffness, handwriting alterations, and recognized non-motor indicators.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Q1: Resting Tremor */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-200">
            1. Involuntary Tremor or Shaking at Rest
          </label>
          <p className="text-[11px] text-slate-400">
            Do you notice rhythmic shaking in hands, arms, or legs when limbs are fully relaxed?
          </p>
          <div className="grid grid-cols-5 gap-1.5 mt-2">
            {[
              { val: 0, label: 'Never' },
              { val: 1, label: 'Rare' },
              { val: 2, label: 'Mild' },
              { val: 3, label: 'Moderate' },
              { val: 4, label: 'Severe' },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => update('restingTremorPerception', opt.val)}
                className={`py-2 px-1 text-center rounded border text-xs font-medium transition-colors ${
                  features.restingTremorPerception === opt.val
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-mono text-sm">{opt.val}</div>
                <div className="text-[10px] truncate">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Q2: Muscle Stiffness / Rigidity */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-200">
            2. Muscle Stiffness or Rigidity
          </label>
          <p className="text-[11px] text-slate-400">
            Sensation of stiffness, tightness, or resistance when moving arms, shoulders, or legs?
          </p>
          <div className="grid grid-cols-5 gap-1.5 mt-2">
            {[
              { val: 0, label: 'None' },
              { val: 1, label: 'Slight' },
              { val: 2, label: 'Mild' },
              { val: 3, label: 'Moderate' },
              { val: 4, label: 'Severe' },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => update('rigidityStiffnessSense', opt.val)}
                className={`py-2 px-1 text-center rounded border text-xs font-medium transition-colors ${
                  features.rigidityStiffnessSense === opt.val
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-mono text-sm">{opt.val}</div>
                <div className="text-[10px] truncate">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Q3: Micrographia (Handwriting shrinkage) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-200">
            3. Micrographia (Handwriting Changes)
          </label>
          <p className="text-[11px] text-slate-400">
            Has your handwriting become noticeably smaller, crowded, or harder to read across a page?
          </p>
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {[
              { val: 0, label: 'Normal size' },
              { val: 1, label: 'Slightly smaller' },
              { val: 2, label: 'Noticeably cramped' },
              { val: 3, label: 'Severely shrunk' },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => update('micrographiaNoticed', opt.val)}
                className={`py-2 px-1 text-center rounded border text-xs font-medium transition-colors ${
                  features.micrographiaNoticed === opt.val
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-mono text-sm">{opt.val}</div>
                <div className="text-[10px] truncate">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Q4: Olfactory Change (Smell) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-200">
            4. Olfactory Sensation (Sense of Smell)
          </label>
          <p className="text-[11px] text-slate-400">
            Have you noticed a persistent loss or marked reduction in your sense of smell (e.g., coffee, flowers)?
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => update('olfactoryChangeReported', false)}
              className={`py-2 px-3 text-center rounded border text-xs font-medium transition-colors ${
                !features.olfactoryChangeReported
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              Normal Smell Acuity
            </button>
            <button
              type="button"
              onClick={() => update('olfactoryChangeReported', true)}
              className={`py-2 px-3 text-center rounded border text-xs font-medium transition-colors ${
                features.olfactoryChangeReported
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              Reduced Smell (Hyposmia)
            </button>
          </div>
        </div>

        {/* Q5: REM Sleep Behavior */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-200">
            5. REM Sleep Dream Enactment
          </label>
          <p className="text-[11px] text-slate-400">
            Do you or your bed partner observe physical flailing, talking, or acting out vivid dreams while asleep?
          </p>
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {[
              { val: 0, label: 'Never' },
              { val: 1, label: 'Occasionally' },
              { val: 2, label: 'Frequently' },
              { val: 3, label: 'Severe / nightly' },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => update('remSleepBehaviorScore', opt.val)}
                className={`py-2 px-1 text-center rounded border text-xs font-medium transition-colors ${
                  features.remSleepBehaviorScore === opt.val
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-mono text-sm">{opt.val}</div>
                <div className="text-[10px] truncate">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Demographic Covariate (Non-sensitive) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-200">
            6. Age Bracket (Epidemiological Covariate)
          </label>
          <p className="text-[11px] text-slate-400">
            Age is an epidemiological baseline covariate in neurological risk modeling.
          </p>
          <div className="grid grid-cols-5 gap-1 mt-2">
            {[
              { val: 'under_40', label: '< 40' },
              { val: '40_49', label: '40 - 49' },
              { val: '50_59', label: '50 - 59' },
              { val: '60_69', label: '60 - 69' },
              { val: '70_plus', label: '70+' },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => update('ageGroup', opt.val as QuestionnaireFeatures['ageGroup'])}
                className={`py-2 px-1 text-center rounded border text-xs font-medium transition-colors ${
                  features.ageGroup === opt.val
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-mono text-xs">{opt.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
