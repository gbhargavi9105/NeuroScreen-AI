/**
 * NeuroScreen AI - Cloud Firestore Repository Service
 * Provides typed persistence for user profiles, screening sessions, and longitudinal trajectories.
 */

import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errors';
import {
  MultimodalScreeningResult,
  LongitudinalAssessment,
  UserProfile,
} from '../types/neuroscreen';

// Save or sync user profile
export async function syncUserProfileToFirestore(profile: {
  anonymousCohortId: string;
  aliasLabel?: string;
  ageBracket?: string;
}): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const path = `users/${currentUser.uid}`;
  try {
    const userDocRef = doc(db, 'users', currentUser.uid);
    const existing = await getDoc(userDocRef);

    const now = new Date().toISOString();
    const dataToSave: Record<string, unknown> = {
      id: currentUser.uid,
      anonymousCohortId: profile.anonymousCohortId || 'NS-8042',
      updatedAt: now,
    };

    if (currentUser.email) dataToSave.email = currentUser.email;
    if (currentUser.displayName) dataToSave.displayName = currentUser.displayName;
    if (profile.aliasLabel) dataToSave.aliasLabel = profile.aliasLabel;
    if (profile.ageBracket) dataToSave.ageBracket = profile.ageBracket;
    if (!existing.exists()) {
      dataToSave.createdAt = now;
    }

    await setDoc(userDocRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save complete multimodal screening session to Firestore
export async function saveScreeningSessionToFirestore(
  result: MultimodalScreeningResult,
  anonymousCohortId: string
): Promise<{ success: boolean; sessionPath: string; error?: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { success: false, sessionPath: '', error: 'User is not authenticated' };
  }

  const sessionPath = `users/${currentUser.uid}/sessions/${result.sessionId}`;
  const historyPath = `users/${currentUser.uid}/longitudinal_history/${result.sessionId}`;

  try {
    const nowIso = new Date().toISOString();
    const dateStr = result.timestamp ? new Date(result.timestamp).toISOString().split('T')[0] : nowIso.split('T')[0];
    const timeStr = result.timestamp ? new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM';

    // 1. Detailed multimodal screening session record
    const sessionData = {
      id: result.sessionId,
      userId: currentUser.uid,
      anonymousCohortId: anonymousCohortId || 'NS-8042',
      date: dateStr,
      time: timeStr,
      timestamp: result.timestamp || Date.now(),
      dayOffset: 0,
      overallRiskScore: Number(result.overallRiskScore),
      riskLevel: String(result.riskLevel),
      confidenceScore: Number(result.confidenceScore),
      credibleInterval95: result.credibleInterval95,
      modalitiesEvaluatedCount: Number(result.modalitiesEvaluatedCount),

      // Explicit modality risk scores and composite metrics
      voiceScore: result.modalityResults.voice?.status === 'completed'
        ? Math.round((result.modalityResults.voice?.riskProbability ?? 0) * 100)
        : null,
      handwritingScore: result.modalityResults.handwriting?.status === 'completed'
        ? Math.round((result.modalityResults.handwriting?.riskProbability ?? 0) * 100)
        : null,
      movementScore: result.modalityResults.motor?.status === 'completed'
        ? Math.round((result.modalityResults.motor?.riskProbability ?? 0) * 100)
        : null,
      multimodalScore: Number(result.overallRiskScore),
      confidence: Number(result.confidenceScore),
      baselineDeviation: Number(
        (
          (result.explainability.waterfallAttributions?.[0]?.zScore ?? 0) ||
          (result.modalityResults.handwriting?.topFeatures?.[0]?.zScore ?? 0) ||
          1.15
        )
      ),

      // Modality-specific extracted physiological biomarkers
      handwritingResults: result.modalityResults.handwriting || {},
      voiceResults: result.modalityResults.voice || {},
      movementResults: result.modalityResults.motor || {},
      questionnaireResults: result.modalityResults.questionnaire || {},

      // Multimodal fusion scores & dynamic late-fusion allocation
      multimodalScores: {
        overallRiskScore: result.overallRiskScore,
        confidenceScore: result.confidenceScore,
        credibleInterval95: result.credibleInterval95,
        weights: result.modalityWeights,
        modalityProbabilities: {
          handwriting: result.modalityResults.handwriting?.riskProbability ?? null,
          voice: result.modalityResults.voice?.riskProbability ?? null,
          motor: result.modalityResults.motor?.riskProbability ?? null,
          questionnaire: result.modalityResults.questionnaire?.riskProbability ?? null,
        },
      },

      // Explainable AI (XAI) feature attributions & SHAP contributions
      explainabilityContributions: {
        waterfallAttributions: result.explainability.waterfallAttributions || [],
        topRiskFactors: result.explainability.topPositiveDrivers || [],
        protectiveFactors: result.explainability.topProtectiveFactors || [],
        counterfactualRecommendation: result.explainability.counterfactualRecommendation || '',
      },

      // Longitudinal baseline information & cohort referencing
      longitudinalBaseline: {
        baselineCohortId: anonymousCohortId || 'NS-8042',
        baselineDayOffset: 0,
        recordedAt: nowIso,
        sessionType: 'screening_intake',
        priorSessionsCount: 0,
      },

      // Clinical decision-support summary (strictly non-diagnostic)
      clinicalSummary: {
        indicationHeadline: result.clinicalSummary.indicationHeadline,
        clinicalContext: result.clinicalSummary.clinicalContext,
        recommendedNextStep: result.clinicalSummary.recommendedNextStep,
        medicalDisclaimer: 'Research prototype only. Does not replace clinical diagnosis.',
      },

      createdAt: nowIso,
    };

    const sessionDocRef = doc(db, 'users', currentUser.uid, 'sessions', result.sessionId);
    await setDoc(sessionDocRef, sessionData);

    // 2. Also save to longitudinal_history subcollection for rapid timeline trajectory indexing
    const spiralTremor = result.modalityResults.handwriting?.topFeatures?.find(f => f.featureKey === 'tremorFrequencyIndex')?.value || 1.1;
    const vocalJitter = result.modalityResults.voice?.topFeatures?.find(f => f.featureKey === 'jitterLocalPercent')?.value || 0.4;
    const tappingArrhythmia = result.modalityResults.motor?.topFeatures?.find(f => f.featureKey === 'interTapIntervalVariance')?.value || 18.0;

    const historyData = {
      id: result.sessionId,
      userId: currentUser.uid,
      sessionId: result.sessionId,
      date: dateStr,
      dayOffset: 0,
      overallScore: Number(result.overallRiskScore),
      riskLevel: String(result.riskLevel),
      confidenceScore: Number(result.confidenceScore),
      spiralTremorIndex: Number(spiralTremor),
      vocalJitterPercent: Number(vocalJitter),
      tappingIrregularity: Number(tappingArrhythmia),
      notes: `Screening assessment via NeuroScreen AI (${result.modalitiesEvaluatedCount} modalities active).`,
      createdAt: nowIso,
    };

    const historyDocRef = doc(db, 'users', currentUser.uid, 'longitudinal_history', result.sessionId);
    await setDoc(historyDocRef, historyData);

    return { success: true, sessionPath };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, sessionPath);
    return { success: false, sessionPath, error: String(error) };
  }
}

// Fetch user's longitudinal sessions from Firestore
export async function getLongitudinalHistoryFromFirestore(): Promise<LongitudinalAssessment[] | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const path = `users/${currentUser.uid}/longitudinal_history`;
  try {
    const historyColRef = collection(db, 'users', currentUser.uid, 'longitudinal_history');
    const q = query(historyColRef, orderBy('createdAt', 'asc'), limit(50));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const list: LongitudinalAssessment[] = [];
    let baseTime: number | null = null;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const docDate = new Date(data.date || data.createdAt).getTime();
      if (baseTime === null) baseTime = docDate;
      const computedDayOffset = Math.max(0, Math.round((docDate - baseTime) / (1000 * 60 * 60 * 24)));

      list.push({
        sessionId: data.sessionId || docSnap.id,
        date: data.date,
        time: '10:00 AM',
        dayOffset: typeof data.dayOffset === 'number' && data.dayOffset > 0 ? data.dayOffset : computedDayOffset,
        overallScore: data.overallScore,
        riskLevel: data.riskLevel,
        confidenceScore: data.confidenceScore || 90,
        keyFeatureMetrics: {
          spiralTremorIndex: data.spiralTremorIndex || 1.1,
          vocalJitterPercent: data.vocalJitterPercent || 0.4,
          tappingIrregularity: data.tappingIrregularity || 18.0,
        },
        notes: data.notes || '',
      });
    });

    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return null;
  }
}
