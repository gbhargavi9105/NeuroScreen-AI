/**
 * NeuroScreen AI - Domain Types & Data Contracts
 * Strict typing for multimodal signals, feature vectors, models, and XAI
 */

export type ModalityType = 'handwriting' | 'voice' | 'motor' | 'questionnaire';

export type RiskLevel = 'low_indication' | 'mild_variance' | 'elevated_pattern' | 'insufficient_data';

export type TrendDirection = 'stable' | 'elevated_trend' | 'improving_trend' | 'fluctuating';

// Handwriting / Spiral Features
export interface HandwritingFeatures {
  radialDeviationMean: number;      // pixels deviation from ideal Archimedean spiral
  radialDeviationStd: number;       // variability of deviation
  tremorFrequencyIndex: number;     // spectral energy in 4-7 Hz tremor band
  velocityVariability: number;      // coefficient of variation in stroke drawing speed
  strokeSmoothnessJerk: number;     // normalized jerk metric of pen trajectory
  spiralTightnessUniformity: number;// regularity of distance between loops
  micrographiaRatio: number;        // progressive reduction in stroke amplitude
  totalDrawingTimeSec: number;      // duration of task
  sourceType: 'live_interactive' | 'image_uploaded' | 'benchmark_sample';
}

// Voice / Acoustic Features
export interface VoiceFeatures {
  fundamentalFrequencyF0: number;   // Mean pitch in Hz (typical 100-250 Hz)
  f0StandardDeviation: number;       // Pitch variability in Hz
  jitterLocalPercent: number;        // Short-term cycle-to-cycle frequency perturbation (%)
  shimmerLocalPercent: number;       // Short-term cycle-to-cycle amplitude perturbation (%)
  shimmerDb: number;                 // Amplitude perturbation in decibels
  harmonicsToNoiseRatioDb: number;  // HNR (normative > 20 dB; dysphonia < 18 dB)
  spectralCentroidHz: number;        // Center of mass of the spectrum
  spectralRollOffHz: number;         // 85% energy frequency cutoff
  silenceRatioPercent: number;       // Pause/silence ratio in sustained speech
  sourceType: 'microphone_live' | 'audio_uploaded' | 'benchmark_sample';
}

// Motor / Bradykinesia Features
export interface MotorFeatures {
  tappingCadenceHz: number;         // Finger tapping frequency (typical 3.5 - 5.5 Hz)
  interTapIntervalVariance: number;  // Cadence irregularity (arrhythmokinesis)
  amplitudeDecayPercent: number;     // Progressive amplitude attenuation (bradykinesia sign)
  facialSymmetryIndex: number;       // Bilateral symmetry score (0 to 1)
  blinkRatePerMinute: number;        // Spontaneous blink rate (typical 12-20/min)
  sourceType: 'interactive_tap' | 'webcam_motor' | 'benchmark_sample';
}

// Questionnaire Features (MDS-UPDRS non-diagnostic behavioral screener)
export interface QuestionnaireFeatures {
  restingTremorPerception: number;   // 0 (never) to 4 (severe)
  rigidityStiffnessSense: number;    // 0 to 4
  micrographiaNoticed: number;       // 0 (normal handwriting) to 3 (pronounced shrinkage)
  remSleepBehaviorScore: number;     // 0 (none) to 3 (frequent acting out dreams)
  olfactoryChangeReported: boolean;  // loss of smell / hyposmia
  posturalUnsteadiness: number;      // 0 to 4
  dexterityDifficulty: number;       // 0 to 4 (buttoning, typing)
  ageGroup: 'under_40' | '40_49' | '50_59' | '60_69' | '70_plus';
  familyNeurologicalHistory: boolean;
}

// Individual Modality Output
export interface ModalityResult {
  modality: ModalityType;
  modelName: string;
  riskProbability: number;          // 0.0 to 1.0
  confidence: number;               // 0.0 to 1.0
  uncertaintyInterval: [number, number]; // [lower, upper] 95% interval
  status: 'completed' | 'missing' | 'insufficient_signal';
  topFeatures: FeatureAttribution[];
  rawFeatures: Record<string, number | string | boolean>;
}

// Explainable AI Feature Attribution
export interface FeatureAttribution {
  featureKey: string;
  featureDisplayName: string;
  value: number;
  unit: string;
  referenceControlNorm: string;
  contributionScore: number;        // Positive increases risk, negative decreases
  zScore: number;                   // Standardized deviation from healthy control cohort
  clinicalInterpretation: string;
}

// Multimodal Fusion Screening Result
export interface MultimodalScreeningResult {
  sessionId: string;
  timestamp: string;
  userId: string;
  overallRiskScore: number;         // 0 to 100 percentage scale
  riskLevel: RiskLevel;
  confidenceScore: number;          // 0 to 100 percentage
  credibleInterval95: [number, number];
  modalitiesEvaluatedCount: number;
  modalityWeights: Record<ModalityType, number>;
  modalityResults: Record<ModalityType, ModalityResult>;
  explainability: {
    baseRatePercentage: number;
    waterfallAttributions: FeatureAttribution[];
    topPositiveDrivers: FeatureAttribution[];
    topProtectiveFactors: FeatureAttribution[];
    counterfactualRecommendation: string;
  };
  clinicalSummary: {
    indicationHeadline: string;
    clinicalContext: string;
    recommendedNextStep: string;
  };
}

// Longitudinal Historical Entry
export interface LongitudinalAssessment {
  sessionId: string;
  date: string;
  time: string;
  dayOffset: number;
  overallScore: number;
  riskLevel: RiskLevel;
  confidenceScore: number;
  handwritingScore?: number;
  voiceScore?: number;
  motorScore?: number;
  questionnaireScore?: number;
  keyFeatureMetrics: {
    spiralTremorIndex: number;
    vocalJitterPercent: number;
    tappingIrregularity: number;
  };
  notes?: string;
}

export interface UserProfile {
  anonymousId: string;
  aliasLabel: string;
  ageBracket: string;
  createdDate: string;
  assessments: LongitudinalAssessment[];
}

export interface MLModelBenchmark {
  modelName: string;
  datasetName: string;
  modality: string;
  accuracy: number;
  sensitivityRecall: number;
  specificity: number;
  precision: number;
  f1Score: number;
  rocAuc: number;
  prAuc: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
}
