import React, { useState, useRef, useEffect } from 'react';
import { Hand, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { MotorFeatures } from '../types/neuroscreen';
import { extractMotorTappingFeatures, NORMATIVE_BENCHMARKS } from '../utils/signalProcessing';

interface MotorAssessmentProps {
  features: MotorFeatures | null;
  onFeaturesExtracted: (features: MotorFeatures) => void;
}

export const MotorAssessment: React.FC<MotorAssessmentProps> = ({
  features,
  onFeaturesExtracted,
}) => {
  const [isTestActive, setIsTestActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [lastTapInterval, setLastTapInterval] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);

  const startTappingTest = () => {
    setIsTestActive(true);
    setSecondsRemaining(10);
    setTapTimes([]);
    setLastTapInterval(null);

    const startTime = performance.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      const left = Math.max(0, 10 - Math.floor(elapsed));
      setSecondsRemaining(left);

      if (left <= 0) {
        finishTest();
      }
    }, 200);
  };

  const handleTap = () => {
    if (!isTestActive) {
      startTappingTest();
      return;
    }

    const now = performance.now();
    setTapTimes(prev => {
      const updated = [...prev, now];
      if (updated.length > 1) {
        setLastTapInterval(Math.round(now - updated[updated.length - 2]));
      }
      return updated;
    });
  };

  const finishTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTestActive(false);

    setTapTimes(currentTaps => {
      if (currentTaps.length >= 6) {
        const extracted = extractMotorTappingFeatures(currentTaps);
        onFeaturesExtracted(extracted);
      }
      return currentTaps;
    });
  };

  const resetTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTestActive(false);
    setSecondsRemaining(10);
    setTapTimes([]);
    setLastTapInterval(null);
  };

  // Keyboard spacebar listener for tapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        // Prevent page scroll
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const loadSyntheticMotor = (type: 'healthy' | 'bradykinetic') => {
    if (type === 'healthy') {
      onFeaturesExtracted({
        tappingCadenceHz: 4.85,
        interTapIntervalVariance: 16.2,
        amplitudeDecayPercent: 3.5,
        facialSymmetryIndex: 0.95,
        blinkRatePerMinute: 17,
        sourceType: 'benchmark_sample',
      });
    } else {
      onFeaturesExtracted({
        tappingCadenceHz: 3.42,
        interTapIntervalVariance: 42.8,
        amplitudeDecayPercent: 21.5,
        facialSymmetryIndex: 0.86,
        blinkRatePerMinute: 11,
        sourceType: 'benchmark_sample',
      });
    }
  };

  const norm = NORMATIVE_BENCHMARKS.motor;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono tracking-wider uppercase text-cyan-400">Modality 03</span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400">Motor Kinematics &amp; Rhythmicity</span>
          </div>
          <h3 className="text-base font-semibold text-slate-100 mt-1">
            Rapid Alternating Finger Tapping Test (MDS-UPDRS Item 3.4)
          </h3>
        </div>

        <button
          onClick={resetTest}
          className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors self-start sm:self-auto"
          title="Reset motor trial"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Tapping Target */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[420px] aspect-video bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-6 relative select-none">
            {/* Countdown / Status Tag */}
            <div className="absolute top-3 right-3 flex items-center gap-2 text-xs font-mono text-slate-400">
              {isTestActive ? (
                <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  {secondsRemaining}s remaining
                </span>
              ) : (
                <span>10s Trial Duration</span>
              )}
            </div>

            {/* Giant Tap Button */}
            <button
              onClick={handleTap}
              className={`w-36 h-36 rounded-full border-2 flex flex-col items-center justify-center transition-all transform active:scale-95 cursor-pointer shadow-lg ${
                isTestActive
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-4 ring-cyan-500/20'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-300'
              }`}
            >
              <Hand className="w-8 h-8 mb-1.5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {isTestActive ? 'TAP FAST!' : 'CLICK TO START'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {isTestActive ? `${tapTimes.length} Taps` : 'or press Space'}
              </span>
            </button>

            {lastTapInterval && (
              <div className="mt-3 text-xs font-mono text-slate-400">
                Interval: <span className="text-cyan-300 font-semibold">{lastTapInterval} ms</span>
              </div>
            )}
          </div>

          {/* Preset generator shortcut */}
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Synthetic Motor Trajectory:</span>
            <button
              onClick={() => loadSyntheticMotor('healthy')}
              className="text-cyan-400 hover:underline font-medium"
            >
              Control Rhythm
            </button>
            <span>·</span>
            <button
              onClick={() => loadSyntheticMotor('bradykinetic')}
              className="text-amber-400 hover:underline font-medium"
            >
              Bradykinetic Arrhythmia
            </button>
          </div>
        </div>

        {/* Telemetry Feature Metrics HUD */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="text-xs font-mono tracking-wider uppercase text-slate-400 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>Motor Telemetry</span>
            {features && (
              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Extracted
              </span>
            )}
          </div>

          {/* Metric 1: Tapping Cadence */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-slate-400">Tapping Strike Frequency</span>
              <span className="text-[11px] font-mono text-slate-500">Norm: {norm.tappingCadenceHz.healthyRange}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                {features ? features.tappingCadenceHz.toFixed(2) : '--'}
              </span>
              <span className="text-xs font-mono text-slate-500">Hz (taps/sec)</span>
            </div>
          </div>

          {/* Metric 2: Inter-Tap Interval Variance */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-slate-400">Inter-Tap Interval Arrhythmokinesis</span>
              <span className="text-[11px] font-mono text-slate-500">Norm: {norm.interTapIntervalVariance.healthyRange}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                {features ? features.interTapIntervalVariance.toFixed(1) : '--'}
              </span>
              <span className="text-xs font-mono text-slate-500">ms (std dev)</span>
            </div>
          </div>

          {/* Metric 3: Progressive Fatigue Decay */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-slate-400">Tapping Tempo Decay (Fatigue)</span>
              <span className="text-[11px] font-mono text-slate-500">Norm: &lt; 10%</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                {features ? features.amplitudeDecayPercent.toFixed(1) : '--'}
              </span>
              <span className="text-xs font-mono text-slate-500">% decay</span>
            </div>
          </div>

          {/* Metric 4: Facial Symmetry Index */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-slate-400">Facial Symmetry &amp; Blink Ratio</span>
              <span className="text-[11px] font-mono text-slate-500">Norm: {norm.facialSymmetryIndex.healthyRange}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                {features ? features.facialSymmetryIndex.toFixed(2) : '--'}
              </span>
              <span className="text-xs font-mono text-slate-500">ratio</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
            Measures voluntary motor timing precision and progressive cadence decay, reflecting basal ganglia timing circuits without invasive instrumentation.
          </p>
        </div>
      </div>
    </div>
  );
};
