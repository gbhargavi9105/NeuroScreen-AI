import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RefreshCw, Upload, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { HandwritingFeatures } from '../types/neuroscreen';
import {
  DrawingPoint,
  extractSpiralKinematicFeatures,
  extractSpiralFromImage,
  NORMATIVE_BENCHMARKS,
} from '../utils/signalProcessing';

interface SpiralAnalysisCanvasProps {
  features: HandwritingFeatures | null;
  onFeaturesExtracted: (features: HandwritingFeatures) => void;
}

export const SpiralAnalysisCanvas: React.FC<SpiralAnalysisCanvasProps> = ({
  features,
  onFeaturesExtracted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<DrawingPoint[]>([]);
  const [activeMode, setActiveMode] = useState<'interactive' | 'upload'>('interactive');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  // Draw background reference guide (Archimedean spiral faint guide)
  const drawGuide = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Subtle grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const step = 30;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Centered faint Archimedean spiral guide
    const cx = width / 2;
    const cy = height / 2;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    const maxTheta = 6 * Math.PI;
    const b = 10;
    for (let theta = 0; theta < maxTheta; theta += 0.05) {
      const r = b * theta;
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);
      if (theta === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Center start marker
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  // Redraw canvas with guide and existing points
  const redrawPoints = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawGuide(ctx, canvas.width, canvas.height);

    if (points.length < 2) return;

    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }, [points, drawGuide]);

  useEffect(() => {
    redrawPoints();
  }, [redrawPoints]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setProcessingError(null);
    const newPoints = [{ x, y, time: performance.now() }];
    setPoints(newPoints);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pt: DrawingPoint = { x, y, time: performance.now() };
    setPoints(prev => [...prev, pt]);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (points.length > 25) {
      const extracted = extractSpiralKinematicFeatures(points);
      onFeaturesExtracted(extracted);
    }
  };

  const handleReset = () => {
    setPoints([]);
    setProcessingError(null);
    setUploadedPreview(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) drawGuide(ctx, canvas.width, canvas.height);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProcessingError('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    setProcessingError(null);
    const reader = new FileReader();
    reader.onload = async event => {
      const url = event.target?.result as string;
      setUploadedPreview(url);

      const img = new Image();
      img.src = url;
      img.onload = async () => {
        try {
          const feats = await extractSpiralFromImage(img);
          onFeaturesExtracted(feats);
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to analyze uploaded spiral';
          setProcessingError(errorMsg);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  // Preset generator for testing
  const loadSyntheticSpiral = (type: 'healthy' | 'tremor') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const synPoints: DrawingPoint[] = [];
    const maxTheta = 5.8 * Math.PI;
    const b = 10;
    const startTime = performance.now();

    for (let i = 0; i <= 200; i++) {
      const theta = (i / 200) * maxTheta;
      let r = b * theta;

      if (type === 'tremor') {
        // Add 4-7 Hz oscillatory noise and radial deviation
        const tremorOsc = 5.5 * Math.sin(theta * 18);
        const hesitation = (i % 25 === 0) ? 8 : 0;
        r += tremorOsc + hesitation;
      } else {
        // Natural human micro-fluctuation (<1.2px)
        r += (Math.sin(theta * 7) * 0.8);
      }

      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);
      synPoints.push({
        x,
        y,
        time: startTime + i * (type === 'tremor' ? 45 : 30),
      });
    }

    setPoints(synPoints);
    const feats = extractSpiralKinematicFeatures(synPoints);
    onFeaturesExtracted(feats);
  };

  const norm = NORMATIVE_BENCHMARKS.handwriting;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono tracking-wider uppercase text-cyan-400">Modality 01</span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400">Handwriting &amp; Spiral Kinematics</span>
          </div>
          <h3 className="text-base font-semibold text-slate-100 mt-1">
            Archimedean Spiral Trajectory Test
          </h3>
        </div>

        {/* Mode Selector & Action buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveMode('interactive')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeMode === 'interactive'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Draw Live
            </button>
            <button
              onClick={() => setActiveMode('upload')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeMode === 'upload'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upload Image
            </button>
          </div>

          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
            title="Clear and reset canvas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Canvas or Upload Area */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {activeMode === 'interactive' ? (
            <div className="relative w-full max-w-[420px] aspect-square bg-slate-950 rounded-xl border border-slate-800 shadow-inner overflow-hidden flex items-center justify-center touch-none">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="cursor-crosshair w-full h-full block"
              />
              {points.length === 0 && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center bg-slate-950/40">
                  <p className="text-xs text-slate-300 font-medium mb-1">
                    Start from the cyan center dot and trace outwards following the spiral guide.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Use mouse, trackpad, or touch stylus. Kinematic velocity &amp; tremor tracked live.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-[420px] aspect-square bg-slate-950 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              {uploadedPreview ? (
                <img
                  src={uploadedPreview}
                  alt="Uploaded spiral drawing"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-slate-500 mb-3" />
                  <p className="text-xs font-medium text-slate-300 mb-1">
                    Upload a scanned or photographed spiral drawing
                  </p>
                  <p className="text-[11px] text-slate-500 mb-4">
                    Supports HandPD benchmark formats (PNG, JPG)
                  </p>
                  <label className="cursor-pointer text-xs font-semibold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 px-4 py-2 rounded-lg transition-colors">
                    Choose Image File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Synthetic presets shortcut */}
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test Trajectory:</span>
            <button
              onClick={() => loadSyntheticSpiral('healthy')}
              className="text-cyan-400 hover:underline font-medium"
            >
              Smooth Control
            </button>
            <span>·</span>
            <button
              onClick={() => loadSyntheticSpiral('tremor')}
              className="text-amber-400 hover:underline font-medium"
            >
              Tremor Variant
            </button>
          </div>

          {processingError && (
            <div className="mt-3 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-950/40 border border-rose-900/60 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{processingError}</span>
            </div>
          )}
        </div>

        {/* Telemetry Feature Metrics HUD */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="text-xs font-mono tracking-wider uppercase text-slate-400 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>Kinematic Telemetry</span>
            {features && (
              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Extracted
              </span>
            )}
          </div>

          {/* Metric 1: Radial Deviation */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-slate-400">Radial Deviation Mean</span>
              <span className="text-[11px] font-mono text-slate-500">Norm: {norm.radialDeviationMean.healthyRange}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                {features ? features.radialDeviationMean.toFixed(2) : '--'}
              </span>
              <span className="text-xs font-mono text-slate-500">px</span>
            </div>
          </div>

          {/* Metric 2: 4-7 Hz Tremor Index */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-slate-400">4-7 Hz Kinetic Tremor Index</span>
              <span className="text-[11px] font-mono text-slate-500">Norm: {norm.tremorFrequencyIndex.healthyRange}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                {features ? features.tremorFrequencyIndex.toFixed(2) : '--'}
              </span>
              <span className="text-xs font-mono text-slate-500">arb</span>
            </div>
          </div>

          {/* Metric 3: Velocity Variability */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-slate-400">Velocity Coeff. of Variation</span>
              <span className="text-[11px] font-mono text-slate-500">Norm: {norm.velocityVariability.healthyRange}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                {features ? features.velocityVariability.toFixed(3) : '--'}
              </span>
              <span className="text-xs font-mono text-slate-500">CV</span>
            </div>
          </div>

          {/* Metric 4: Normalized Jerk */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-slate-400">Normalized Trajectory Jerk</span>
              <span className="text-[11px] font-mono text-slate-500">Norm: {norm.strokeSmoothnessJerk.healthyRange}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-semibold text-slate-100 tabular-nums">
                {features ? features.strokeSmoothnessJerk.toFixed(1) : '--'}
              </span>
              <span className="text-xs font-mono text-slate-500">jerk</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
            Features calibrated against the HandPD benchmark dataset. Spiral deviations and velocity irregularities represent kinematic motor control stability.
          </p>
        </div>
      </div>
    </div>
  );
};
