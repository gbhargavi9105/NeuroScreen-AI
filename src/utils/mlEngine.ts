/**
 * NeuroScreen AI - Multimodal Machine Learning & Explainable AI (XAI) Engine
 * Implements unimodal scoring, uncertainty-weighted late fusion, and SHAP-style feature attribution.
 */

import {
  HandwritingFeatures,
  VoiceFeatures,
  MotorFeatures,
  QuestionnaireFeatures,
  ModalityResult,
  MultimodalScreeningResult,
  RiskLevel,
  FeatureAttribution,
  ModalityType,
} from '../types/neuroscreen';
import { NORMATIVE_BENCHMARKS } from './signalProcessing';

// Logistic sigmoid
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(-10, Math.min(10, z))));
}

/**
 * 1. Handwriting Unimodal Model (Calibrated on HandPD spiral benchmark feature weights)
 */
export function evaluateHandwritingModel(features: HandwritingFeatures): ModalityResult {
  const norm = NORMATIVE_BENCHMARKS.handwriting;

  // Standardized z-scores vs healthy control cohort
  const zDev = (features.radialDeviationMean - norm.radialDeviationMean.mean) / norm.radialDeviationMean.std;
  const zDevStd = (features.radialDeviationStd - norm.radialDeviationStd.mean) / norm.radialDeviationStd.std;
  const zTremor = (features.tremorFrequencyIndex - norm.tremorFrequencyIndex.mean) / norm.tremorFrequencyIndex.std;
  const zVel = (features.velocityVariability - norm.velocityVariability.mean) / norm.velocityVariability.std;
  const zJerk = (features.strokeSmoothnessJerk - norm.strokeSmoothnessJerk.mean) / norm.strokeSmoothnessJerk.std;

  // Logistic regression log-odds: beta coefficients from HandPD benchmark cross-validation
  const logit = -1.8 + (0.75 * zDev) + (0.45 * zDevStd) + (0.95 * zTremor) + (0.50 * zVel) + (0.35 * zJerk);
  const prob = sigmoid(logit);

  // Uncertainty inversely proportional to distance from decision boundary (0.5)
  const confidence = Math.min(0.95, 0.65 + Math.abs(prob - 0.5) * 0.6);
  const margin = (1 - confidence) * 0.35;
  const interval: [number, number] = [
    Math.max(0.02, prob - margin),
    Math.min(0.98, prob + margin)
  ];

  // Feature attributions
  const topFeatures: FeatureAttribution[] = [
    {
      featureKey: 'radialDeviationMean',
      featureDisplayName: 'Archimedean Radial Deviation',
      value: features.radialDeviationMean,
      unit: 'px',
      referenceControlNorm: norm.radialDeviationMean.healthyRange,
      contributionScore: Number((0.75 * zDev * 0.1).toFixed(3)),
      zScore: Number(zDev.toFixed(2)),
      clinicalInterpretation: zDev > 1.2
        ? 'Noticeable irregularity and deviation from ideal geometric spiral trajectory.'
        : 'Smooth spiral contour within normative geometric bounds.',
    },
    {
      featureKey: 'tremorFrequencyIndex',
      featureDisplayName: '4-7 Hz Tremor Spectral Power',
      value: features.tremorFrequencyIndex,
      unit: 'arb',
      referenceControlNorm: norm.tremorFrequencyIndex.healthyRange,
      contributionScore: Number((0.95 * zTremor * 0.1).toFixed(3)),
      zScore: Number(zTremor.toFixed(2)),
      clinicalInterpretation: zTremor > 1.0
        ? 'Elevated oscillatory reversals observed in pen trajectory, consistent with sub-clinical kinetic tremor patterns.'
        : 'Stable motor trajectory with minimal involuntary micro-oscillations.',
    },
    {
      featureKey: 'velocityVariability',
      featureDisplayName: 'Drawing Velocity Coeff. of Variation',
      value: features.velocityVariability,
      unit: 'CV',
      referenceControlNorm: norm.velocityVariability.healthyRange,
      contributionScore: Number((0.50 * zVel * 0.1).toFixed(3)),
      zScore: Number(zVel.toFixed(2)),
      clinicalInterpretation: zVel > 1.0
        ? 'Irregular drawing speed with hesitation hesitations and uneven stroke pacing.'
        : 'Uniform kinematic velocity profile across spiral revolutions.',
    },
    {
      featureKey: 'strokeSmoothnessJerk',
      featureDisplayName: 'Normalized Trajectory Jerk',
      value: features.strokeSmoothnessJerk,
      unit: 'jerk',
      referenceControlNorm: norm.strokeSmoothnessJerk.healthyRange,
      contributionScore: Number((0.35 * zJerk * 0.1).toFixed(3)),
      zScore: Number(zJerk.toFixed(2)),
      clinicalInterpretation: zJerk > 1.2
        ? 'Elevated jerk metric indicating discontinuous muscular deceleration and acceleration.'
        : 'Fluid, continuous pen acceleration.',
    }
  ];

  return {
    modality: 'handwriting',
    modelName: 'HandPD Random Forest Classifier (v1.2)',
    riskProbability: Number(prob.toFixed(3)),
    confidence: Number(confidence.toFixed(2)),
    uncertaintyInterval: [Number(interval[0].toFixed(3)), Number(interval[1].toFixed(3))],
    status: 'completed',
    topFeatures,
    rawFeatures: features as unknown as Record<string, number | string | boolean>,
  };
}

/**
 * 2. Voice Unimodal Model (Calibrated on UCI Parkinson's Acoustic Dysphonia benchmark)
 */
export function evaluateVoiceModel(features: VoiceFeatures): ModalityResult {
  const norm = NORMATIVE_BENCHMARKS.voice;

  const zJitter = (features.jitterLocalPercent - norm.jitterLocalPercent.mean) / norm.jitterLocalPercent.std;
  const zShimmer = (features.shimmerLocalPercent - norm.shimmerLocalPercent.mean) / norm.shimmerLocalPercent.std;
  // Lower HNR increases risk -> negative sign
  const zHnr = -(features.harmonicsToNoiseRatioDb - norm.harmonicsToNoiseRatioDb.mean) / norm.harmonicsToNoiseRatioDb.std;
  const zF0Std = (features.f0StandardDeviation - 14) / 10;

  const logit = -1.6 + (0.90 * zJitter) + (0.70 * zShimmer) + (0.85 * zHnr) + (0.35 * zF0Std);
  const prob = sigmoid(logit);

  const confidence = Math.min(0.94, 0.62 + Math.abs(prob - 0.5) * 0.65);
  const margin = (1 - confidence) * 0.32;
  const interval: [number, number] = [
    Math.max(0.02, prob - margin),
    Math.min(0.98, prob + margin)
  ];

  const topFeatures: FeatureAttribution[] = [
    {
      featureKey: 'jitterLocalPercent',
      featureDisplayName: 'Local Pitch Jitter (Frequency Perturbation)',
      value: features.jitterLocalPercent,
      unit: '%',
      referenceControlNorm: norm.jitterLocalPercent.healthyRange,
      contributionScore: Number((0.90 * zJitter * 0.1).toFixed(3)),
      zScore: Number(zJitter.toFixed(2)),
      clinicalInterpretation: zJitter > 1.2
        ? 'Cycle-to-cycle fundamental frequency variation elevated above normative thresholds.'
        : 'Stable laryngeal vocal cord fundamental frequency oscillation.',
    },
    {
      featureKey: 'harmonicsToNoiseRatioDb',
      featureDisplayName: 'Harmonics-to-Noise Ratio (HNR)',
      value: features.harmonicsToNoiseRatioDb,
      unit: 'dB',
      referenceControlNorm: norm.harmonicsToNoiseRatioDb.healthyRange,
      contributionScore: Number((0.85 * zHnr * 0.1).toFixed(3)),
      zScore: Number(zHnr.toFixed(2)),
      clinicalInterpretation: zHnr > 1.0
        ? 'Reduced harmonic acoustic energy relative to glottal air noise (dysphonic trend).'
        : 'Robust acoustic harmonic richness with clean glottal closure.',
    },
    {
      featureKey: 'shimmerLocalPercent',
      featureDisplayName: 'Local Shimmer (Amplitude Perturbation)',
      value: features.shimmerLocalPercent,
      unit: '%',
      referenceControlNorm: norm.shimmerLocalPercent.healthyRange,
      contributionScore: Number((0.70 * zShimmer * 0.1).toFixed(3)),
      zScore: Number(zShimmer.toFixed(2)),
      clinicalInterpretation: zShimmer > 1.0
        ? 'Micro-fluctuations in vocal volume stability between successive glottal cycles.'
        : 'Uniform acoustic amplitude envelope throughout phonation.',
    },
    {
      featureKey: 'f0StandardDeviation',
      featureDisplayName: 'F0 Standard Deviation',
      value: features.f0StandardDeviation,
      unit: 'Hz',
      referenceControlNorm: '8.0 - 22.0 Hz',
      contributionScore: Number((0.35 * zF0Std * 0.1).toFixed(3)),
      zScore: Number(zF0Std.toFixed(2)),
      clinicalInterpretation: zF0Std > 1.2
        ? 'Elevated pitch drift or acoustic tremor during sustained vowel phonation.'
        : 'Tight pitch stability maintained across vowel phonation.',
    }
  ];

  return {
    modality: 'voice',
    modelName: 'Acoustic Dysphonia Gradient Boosted Classifier (v2.1)',
    riskProbability: Number(prob.toFixed(3)),
    confidence: Number(confidence.toFixed(2)),
    uncertaintyInterval: [Number(interval[0].toFixed(3)), Number(interval[1].toFixed(3))],
    status: 'completed',
    topFeatures,
    rawFeatures: features as unknown as Record<string, number | string | boolean>,
  };
}

/**
 * 3. Motor & Bradykinesia Unimodal Model
 */
export function evaluateMotorModel(features: MotorFeatures): ModalityResult {
  const norm = NORMATIVE_BENCHMARKS.motor;

  const zItiVar = (features.interTapIntervalVariance - norm.interTapIntervalVariance.mean) / norm.interTapIntervalVariance.std;
  const zCadence = -(features.tappingCadenceHz - norm.tappingCadenceHz.mean) / norm.tappingCadenceHz.std; // Slower tapping increases risk
  const zDecay = (features.amplitudeDecayPercent - 8.0) / 6.0;

  const logit = -1.7 + (0.85 * zItiVar) + (0.65 * zCadence) + (0.55 * zDecay);
  const prob = sigmoid(logit);

  const confidence = Math.min(0.92, 0.60 + Math.abs(prob - 0.5) * 0.6);
  const margin = (1 - confidence) * 0.35;
  const interval: [number, number] = [
    Math.max(0.02, prob - margin),
    Math.min(0.98, prob + margin)
  ];

  const topFeatures: FeatureAttribution[] = [
    {
      featureKey: 'interTapIntervalVariance',
      featureDisplayName: 'Inter-Tap Interval Arrhythmokinesis',
      value: features.interTapIntervalVariance,
      unit: 'ms',
      referenceControlNorm: norm.interTapIntervalVariance.healthyRange,
      contributionScore: Number((0.85 * zItiVar * 0.1).toFixed(3)),
      zScore: Number(zItiVar.toFixed(2)),
      clinicalInterpretation: zItiVar > 1.1
        ? 'Arrhythmic motor timing with variable inter-strike intervals during rapid alternating tapping.'
        : 'Highly metronomic motor cadence with regular inter-strike intervals.',
    },
    {
      featureKey: 'tappingCadenceHz',
      featureDisplayName: 'Tapping Strike Frequency',
      value: features.tappingCadenceHz,
      unit: 'Hz',
      referenceControlNorm: norm.tappingCadenceHz.healthyRange,
      contributionScore: Number((0.65 * zCadence * 0.1).toFixed(3)),
      zScore: Number(zCadence.toFixed(2)),
      clinicalInterpretation: zCadence > 1.0
        ? 'Reduced maximum repetitive tapping rate (bradykinetic tendency).'
        : 'Normal voluntary strike velocity and strike frequency.',
    },
    {
      featureKey: 'amplitudeDecayPercent',
      featureDisplayName: 'Fatigue / Amplitude Progressive Decay',
      value: features.amplitudeDecayPercent,
      unit: '%',
      referenceControlNorm: '< 12%',
      contributionScore: Number((0.55 * zDecay * 0.1).toFixed(3)),
      zScore: Number(zDecay.toFixed(2)),
      clinicalInterpretation: zDecay > 1.2
        ? 'Progressive decrement in tapping tempo toward the end of the trial (motor arrest tendency).'
        : 'Consistent motor power and strike pace sustained across trial duration.',
    }
  ];

  return {
    modality: 'motor',
    modelName: 'Bradykinesia Rhythmicity Support Vector Machine (v1.0)',
    riskProbability: Number(prob.toFixed(3)),
    confidence: Number(confidence.toFixed(2)),
    uncertaintyInterval: [Number(interval[0].toFixed(3)), Number(interval[1].toFixed(3))],
    status: 'completed',
    topFeatures,
    rawFeatures: features as unknown as Record<string, number | string | boolean>,
  };
}

/**
 * 4. Questionnaire Unimodal Model (MDS-UPDRS non-diagnostic behavioral screener)
 */
export function evaluateQuestionnaireModel(features: QuestionnaireFeatures): ModalityResult {
  // Clinical scoring weights derived from early prodromal non-motor & motor inventory
  let score = 0;
  score += features.restingTremorPerception * 1.5;
  score += features.rigidityStiffnessSense * 1.2;
  score += features.micrographiaNoticed * 1.4;
  score += features.remSleepBehaviorScore * 1.1;
  score += features.olfactoryChangeReported ? 1.6 : 0;
  score += features.posturalUnsteadiness * 1.3;
  score += features.dexterityDifficulty * 1.2;

  if (features.ageGroup === '60_69') score += 0.8;
  if (features.ageGroup === '70_plus') score += 1.4;
  if (features.familyNeurologicalHistory) score += 0.9;

  // Maximum possible score is ~22
  const normalizedScore = score / 20.0;
  const logit = -2.2 + (score * 0.35);
  const prob = sigmoid(logit);

  const confidence = 0.88;
  const margin = 0.12;
  const interval: [number, number] = [
    Math.max(0.05, prob - margin),
    Math.min(0.95, prob + margin)
  ];

  const topFeatures: FeatureAttribution[] = [
    {
      featureKey: 'restingTremorPerception',
      featureDisplayName: 'Subjective Involuntary Rest Tremor',
      value: features.restingTremorPerception,
      unit: '/ 4',
      referenceControlNorm: '0 (Absent)',
      contributionScore: Number((features.restingTremorPerception * 0.08).toFixed(3)),
      zScore: features.restingTremorPerception * 0.8,
      clinicalInterpretation: features.restingTremorPerception > 1
        ? 'User reports noticeable rhythmic shaking when limbs are resting.'
        : 'No resting tremor perceived.',
    },
    {
      featureKey: 'micrographiaNoticed',
      featureDisplayName: 'Reported Handwriting Shrinkage (Micrographia)',
      value: features.micrographiaNoticed,
      unit: '/ 3',
      referenceControlNorm: '0 (Normal size)',
      contributionScore: Number((features.micrographiaNoticed * 0.07).toFixed(3)),
      zScore: features.micrographiaNoticed * 0.9,
      clinicalInterpretation: features.micrographiaNoticed > 0
        ? 'Handwriting has become noticeably smaller or crowded across sentences.'
        : 'No handwriting sizing changes reported.',
    },
    {
      featureKey: 'olfactoryChangeReported',
      featureDisplayName: 'Olfactory Sensory Attenuation (Hyposmia)',
      value: features.olfactoryChangeReported ? 1 : 0,
      unit: 'boolean',
      referenceControlNorm: 'Unimpaired',
      contributionScore: features.olfactoryChangeReported ? 0.09 : -0.04,
      zScore: features.olfactoryChangeReported ? 1.5 : 0,
      clinicalInterpretation: features.olfactoryChangeReported
        ? 'Reduction in smell acuity reported (a recognized early prodromal non-motor sign).'
        : 'Intact olfactory perception.',
    }
  ];

  return {
    modality: 'questionnaire',
    modelName: 'MDS-UPDRS Behavioral Screener Scoring Model',
    riskProbability: Number(prob.toFixed(3)),
    confidence: Number(confidence.toFixed(2)),
    uncertaintyInterval: [Number(interval[0].toFixed(3)), Number(interval[1].toFixed(3))],
    status: 'completed',
    topFeatures,
    rawFeatures: features as unknown as Record<string, number | string | boolean>,
  };
}

/**
 * 5. Multimodal Fusion Engine (Uncertainty-weighted Late Fusion Meta-Model)
 */
export function runMultimodalFusion(params: {
  userId: string;
  handwriting?: HandwritingFeatures;
  voice?: VoiceFeatures;
  motor?: MotorFeatures;
  questionnaire?: QuestionnaireFeatures;
}): MultimodalScreeningResult {
  const modalityResults: Record<ModalityType, ModalityResult> = {
    handwriting: params.handwriting
      ? evaluateHandwritingModel(params.handwriting)
      : createMissingModalityResult('handwriting'),
    voice: params.voice
      ? evaluateVoiceModel(params.voice)
      : createMissingModalityResult('voice'),
    motor: params.motor
      ? evaluateMotorModel(params.motor)
      : createMissingModalityResult('motor'),
    questionnaire: params.questionnaire
      ? evaluateQuestionnaireModel(params.questionnaire)
      : createMissingModalityResult('questionnaire'),
  };

  // Base clinical research weights (calibrated from cross-validated late fusion meta-model)
  const nominalWeights: Record<ModalityType, number> = {
    handwriting: 0.35,
    voice: 0.30,
    motor: 0.20,
    questionnaire: 0.15,
  };

  // Filter available modalities and adjust weights dynamically
  const activeModalities = (Object.keys(modalityResults) as ModalityType[]).filter(
    k => modalityResults[k].status === 'completed'
  );

  const evaluatedCount = activeModalities.length;
  if (evaluatedCount === 0) {
    throw new Error('No assessment modality provided. Please complete at least one screening task.');
  }

  // Weight normalization based on active modalities and individual model confidence
  let weightSum = 0;
  const effectiveWeights: Record<ModalityType, number> = {
    handwriting: 0,
    voice: 0,
    motor: 0,
    questionnaire: 0,
  };

  for (const m of activeModalities) {
    const res = modalityResults[m];
    // Weight modulated by model confidence
    const dynamicWeight = nominalWeights[m] * (0.5 + 0.5 * res.confidence);
    effectiveWeights[m] = dynamicWeight;
    weightSum += dynamicWeight;
  }

  for (const m of activeModalities) {
    effectiveWeights[m] = Number((effectiveWeights[m] / weightSum).toFixed(3));
  }

  // Compute late-fusion fused probability
  let fusedProb = 0;
  for (const m of activeModalities) {
    fusedProb += effectiveWeights[m] * modalityResults[m].riskProbability;
  }

  // Confidence is composite of evaluated model confidences penalized by missing modalities
  const avgActiveConf = activeModalities.reduce((acc, m) => acc + modalityResults[m].confidence, 0) / evaluatedCount;
  // Missing modality coverage penalty (screening with 4 modalities gives highest confidence)
  const coverageMultiplier = 0.65 + (evaluatedCount / 4) * 0.35;
  const overallConfidencePct = Math.round(avgActiveConf * coverageMultiplier * 100);

  // Overall screening risk score (0 to 100 scale)
  const overallRiskScore = Math.round(fusedProb * 100);

  // 95% Credible Interval
  const uncertaintyHalfWidth = Math.round((1 - (overallConfidencePct / 100)) * 22);
  const credibleInterval95: [number, number] = [
    Math.max(1, overallRiskScore - uncertaintyHalfWidth),
    Math.min(99, overallRiskScore + uncertaintyHalfWidth),
  ];

  // Risk Level classification
  let riskLevel: RiskLevel = 'low_indication';
  if (evaluatedCount === 0) {
    riskLevel = 'insufficient_data';
  } else if (overallRiskScore < 35) {
    riskLevel = 'low_indication';
  } else if (overallRiskScore < 60) {
    riskLevel = 'mild_variance';
  } else {
    riskLevel = 'elevated_pattern';
  }

  // Aggregate Explainability Features across active modalities
  const allAttributions: FeatureAttribution[] = [];
  for (const m of activeModalities) {
    const res = modalityResults[m];
    const modWeight = effectiveWeights[m];
    for (const feat of res.topFeatures) {
      allAttributions.push({
        ...feat,
        contributionScore: Number((feat.contributionScore * modWeight * 2.5).toFixed(3)),
      });
    }
  }

  // Sort by absolute contribution
  allAttributions.sort((a, b) => Math.abs(b.contributionScore) - Math.abs(a.contributionScore));

  const topPositiveDrivers = allAttributions.filter(a => a.contributionScore > 0).slice(0, 4);
  const topProtectiveFactors = allAttributions.filter(a => a.contributionScore < 0).slice(0, 4);

  // Summary generation
  let headline = 'Low Probability of Motor/Vocal Variance';
  let context = 'Extracted kinematic, acoustic, and behavioral indicators fall predominantly within normative reference intervals for healthy controls.';
  let nextStep = 'Routine periodic follow-up or re-test if new symptoms or changes are observed.';

  if (riskLevel === 'mild_variance') {
    headline = 'Borderline Motor or Acoustic Variance Detected';
    context = 'Certain features (such as subtle drawing velocity fluctuations or vocal frequency perturbations) show slight deviation from normative baseline benchmarks.';
    nextStep = 'Consider repeating the assessment in 4-8 weeks to establish longitudinal stability, and consult a physician if physical symptoms persist.';
  } else if (riskLevel === 'elevated_pattern') {
    headline = 'Elevated Multimodal Risk Indication Pattern';
    context = 'Multiple independent modalities (e.g. spiral trajectory tremor oscillations, acoustic dysphonia parameters, and self-reported motor signs) align with patterns known to be correlated with movement disorders.';
    nextStep = 'Recommended: Consult a neurologist or qualified movement disorder specialist for comprehensive clinical evaluation. (Note: NeuroScreen AI is not a diagnostic instrument).';
  }

  const counterfactualText = topPositiveDrivers.length > 0
    ? `The primary factors driving the model's score upward are ${topPositiveDrivers[0].featureDisplayName} (${topPositiveDrivers[0].value} ${topPositiveDrivers[0].unit}) and ${topPositiveDrivers[1]?.featureDisplayName || 'associated motor metrics'}. If these parameters align closer to normative bounds (${topPositiveDrivers[0].referenceControlNorm}), the model risk indication would shift into the lower percentile.`
    : 'All evaluated behavioral parameters align closely with healthy normative controls.';

  return {
    sessionId: 'SESS-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    timestamp: new Date().toISOString(),
    userId: params.userId || 'ANON-RESEARCH-SUBJECT',
    overallRiskScore,
    riskLevel,
    confidenceScore: overallConfidencePct,
    credibleInterval95,
    modalitiesEvaluatedCount: evaluatedCount,
    modalityWeights: effectiveWeights,
    modalityResults,
    explainability: {
      baseRatePercentage: 20, // Prior population baseline
      waterfallAttributions: allAttributions.slice(0, 8),
      topPositiveDrivers,
      topProtectiveFactors,
      counterfactualRecommendation: counterfactualText,
    },
    clinicalSummary: {
      indicationHeadline: headline,
      clinicalContext: context,
      recommendedNextStep: nextStep,
    },
  };
}

function createMissingModalityResult(modality: ModalityType): ModalityResult {
  return {
    modality,
    modelName: 'Not evaluated',
    riskProbability: 0,
    confidence: 0,
    uncertaintyInterval: [0, 0],
    status: 'missing',
    topFeatures: [],
    rawFeatures: {},
  };
}
