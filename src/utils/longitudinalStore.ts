/**
 * NeuroScreen AI - Longitudinal Storage & Temporal Trajectory Engine
 * Persists assessments, tracks trends over time, and computes feature deltas.
 */

import { LongitudinalAssessment, UserProfile, TrendDirection } from '../types/neuroscreen';

const STORAGE_KEY_PROFILES = 'neuroscreen_profiles_v1';
const STORAGE_KEY_CURRENT_USER = 'neuroscreen_active_user_v1';

// Seed profile for research demonstration: Longitudinal tracking across 9 months
const SEED_PROFILES: UserProfile[] = [
  {
    anonymousId: 'NS-8042',
    aliasLabel: 'Research Cohort Participant #8042',
    ageBracket: '65 - 69',
    createdDate: '2025-12-10',
    assessments: [
      {
        sessionId: 'SESS-BASE-8042',
        date: '2026-01-15',
        time: '09:30 AM',
        dayOffset: 0,
        overallScore: 28,
        riskLevel: 'low_indication',
        confidenceScore: 92,
        handwritingScore: 24,
        voiceScore: 31,
        motorScore: 22,
        questionnaireScore: 25,
        keyFeatureMetrics: {
          spiralTremorIndex: 1.18,
          vocalJitterPercent: 0.44,
          tappingIrregularity: 19.2,
        },
        notes: 'Baseline intake screening. Normal motor function observed.',
      },
      {
        sessionId: 'SESS-M3-8042',
        date: '2026-04-18',
        time: '10:15 AM',
        dayOffset: 93,
        overallScore: 36,
        riskLevel: 'mild_variance',
        confidenceScore: 90,
        handwritingScore: 38,
        voiceScore: 35,
        motorScore: 32,
        questionnaireScore: 30,
        keyFeatureMetrics: {
          spiralTremorIndex: 1.52,
          vocalJitterPercent: 0.68,
          tappingIrregularity: 24.5,
        },
        notes: '3-Month follow-up. Subtle hesitation noted on handwriting spiral loop transitions.',
      },
      {
        sessionId: 'SESS-M6-8042',
        date: '2026-07-22',
        time: '11:00 AM',
        dayOffset: 188,
        overallScore: 49,
        riskLevel: 'mild_variance',
        confidenceScore: 93,
        handwritingScore: 54,
        voiceScore: 46,
        motorScore: 42,
        questionnaireScore: 45,
        keyFeatureMetrics: {
          spiralTremorIndex: 2.10,
          vocalJitterPercent: 0.89,
          tappingIrregularity: 32.1,
        },
        notes: '6-Month follow-up. Increase in spiral radial deviation and reported morning finger stiffness.',
      },
      {
        sessionId: 'SESS-M9-8042',
        date: '2026-09-20',
        time: '02:40 PM',
        dayOffset: 248,
        overallScore: 68,
        riskLevel: 'elevated_pattern',
        confidenceScore: 94,
        handwritingScore: 72,
        voiceScore: 64,
        motorScore: 66,
        questionnaireScore: 65,
        keyFeatureMetrics: {
          spiralTremorIndex: 2.88,
          vocalJitterPercent: 1.18,
          tappingIrregularity: 41.5,
        },
        notes: '9-Month longitudinal check. Model-indicated change across multiple modalities. Clinical consultation recommended.',
      },
    ],
  },
  {
    anonymousId: 'NS-9104',
    aliasLabel: 'Research Cohort Participant #9104 (Stable Control)',
    ageBracket: '60 - 64',
    createdDate: '2026-02-01',
    assessments: [
      {
        sessionId: 'SESS-BASE-9104',
        date: '2026-02-05',
        time: '08:45 AM',
        dayOffset: 0,
        overallScore: 18,
        riskLevel: 'low_indication',
        confidenceScore: 94,
        handwritingScore: 16,
        voiceScore: 20,
        motorScore: 17,
        questionnaireScore: 12,
        keyFeatureMetrics: {
          spiralTremorIndex: 0.98,
          vocalJitterPercent: 0.35,
          tappingIrregularity: 15.8,
        },
        notes: 'Normative healthy control volunteer.',
      },
      {
        sessionId: 'SESS-M6-9104',
        date: '2026-08-10',
        time: '09:10 AM',
        dayOffset: 186,
        overallScore: 21,
        riskLevel: 'low_indication',
        confidenceScore: 92,
        handwritingScore: 19,
        voiceScore: 23,
        motorScore: 20,
        questionnaireScore: 15,
        keyFeatureMetrics: {
          spiralTremorIndex: 1.04,
          vocalJitterPercent: 0.38,
          tappingIrregularity: 16.5,
        },
        notes: 'Stable normative trajectory across 6 months.',
      },
    ],
  }
];

export function getStoredProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(SEED_PROFILES));
      return SEED_PROFILES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_PROFILES;
  }
}

export function getActiveUserId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (stored) return stored;
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, 'NS-8042');
    return 'NS-8042';
  } catch {
    return 'NS-8042';
  }
}

export function setActiveUserId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, id);
  } catch (e) {
    console.error(e);
  }
}

export function saveAssessmentToProfile(userId: string, assessment: LongitudinalAssessment): void {
  const profiles = getStoredProfiles();
  let user = profiles.find(p => p.anonymousId === userId);

  if (!user) {
    user = {
      anonymousId: userId,
      aliasLabel: `Research Subject #${userId}`,
      ageBracket: '60 - 69',
      createdDate: new Date().toISOString().split('T')[0],
      assessments: [],
    };
    profiles.push(user);
  }

  // Calculate dayOffset from first assessment
  if (user.assessments.length > 0) {
    const firstDate = new Date(user.assessments[0].date).getTime();
    const curDate = new Date(assessment.date).getTime();
    const diffDays = Math.max(0, Math.round((curDate - firstDate) / (1000 * 60 * 60 * 24)));
    assessment.dayOffset = diffDays;
  } else {
    assessment.dayOffset = 0;
  }

  user.assessments.push(assessment);
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  } catch (e) {
    console.error(e);
  }
}

export function createNewUserProfile(anonymousId: string, aliasLabel: string, ageBracket: string): UserProfile {
  const profiles = getStoredProfiles();
  const newProfile: UserProfile = {
    anonymousId,
    aliasLabel,
    ageBracket,
    createdDate: new Date().toISOString().split('T')[0],
    assessments: [],
  };
  profiles.push(newProfile);
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, anonymousId);
  } catch (e) {
    console.error(e);
  }
  return newProfile;
}

export function analyzeLongitudinalTrend(assessments: LongitudinalAssessment[]): {
  direction: TrendDirection;
  deltaScore: number;
  description: string;
  isSignificantChange: boolean;
} {
  if (!assessments || assessments.length < 2) {
    return {
      direction: 'stable',
      deltaScore: 0,
      description: 'Single baseline assessment recorded. Additional longitudinal sessions required to determine trajectory.',
      isSignificantChange: false,
    };
  }

  const sorted = [...assessments].sort((a, b) => a.dayOffset - b.dayOffset);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const delta = last.overallScore - first.overallScore;

  let direction: TrendDirection = 'stable';
  let desc = 'Scores show minimal variance across observation periods (< ±10 points), indicating a stable pattern.';
  let significant = false;

  if (delta >= 18) {
    direction = 'elevated_trend';
    desc = `Model-indicated upward change (+${delta} points) observed across ${last.dayOffset} days. Elevated variance across motor/acoustic signals detected. Further clinical evaluation is appropriate.`;
    significant = true;
  } else if (delta <= -15) {
    direction = 'improving_trend';
    desc = `Model-indicated attenuation (-${Math.abs(delta)} points) observed. Extracted parameters show improved smoothness and vocal stability.`;
    significant = true;
  } else if (Math.abs(delta) >= 10) {
    direction = 'fluctuating';
    desc = `Moderate variation (delta: ${delta > 0 ? '+' : ''}${delta} points) between assessment intervals. Ongoing periodic monitoring advised.`;
  }

  return {
    direction,
    deltaScore: delta,
    description: desc,
    isSignificantChange: significant,
  };
}
