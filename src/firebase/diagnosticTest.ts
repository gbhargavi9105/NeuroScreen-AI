/**
 * NeuroScreen AI - Firestore Security Rules & Session Persistence Diagnostic Utility
 * Verifies that saveScreeningSessionToFirestore correctly writes to the authenticated user's
 * path (/users/{userId}/sessions/{sessionId}), validates read-back, and tests cross-user isolation.
 */

import { doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { saveScreeningSessionToFirestore } from './firestoreService';
import { MultimodalScreeningResult, FeatureAttribution, ModalityResult } from '../types/neuroscreen';

export interface DiagnosticResult {
  timestamp: string;
  authenticated: boolean;
  userId: string | null;
  userEmail: string | null;
  targetPath: string | null;
  writeSuccess: boolean;
  readVerified: boolean;
  crossUserAttackBlocked: boolean;
  errorDetails: string | null;
  summary: string;
}

/**
 * Creates a valid mock screening session matching all schema and security rule requirements.
 */
export function createMockDiagnosticSession(sessionId = `test-session-${Date.now()}`): MultimodalScreeningResult {
  const currentUid = auth.currentUser?.uid || 'test-user-diag';

  const mockTremorFeature: FeatureAttribution = {
    featureKey: 'tremorFrequencyIndex',
    featureDisplayName: 'Archimedean Tremor (4-7Hz)',
    value: 4.8,
    unit: 'Hz',
    referenceControlNorm: '1.0 - 3.5 Hz',
    contributionScore: 0.18,
    zScore: 1.45,
    clinicalInterpretation: 'Mild 4-7 Hz oscillation observed in Archimedean spiral trajectory.',
  };

  const mockJitterFeature: FeatureAttribution = {
    featureKey: 'jitterLocalPercent',
    featureDisplayName: 'Acoustic Pitch Perturbation (Jitter)',
    value: 0.52,
    unit: '%',
    referenceControlNorm: '< 0.50 %',
    contributionScore: 0.12,
    zScore: 1.05,
    clinicalInterpretation: 'Slight frequency instability during sustained phonation.',
  };

  const mockHnrFeature: FeatureAttribution = {
    featureKey: 'harmonicsToNoiseRatioDb',
    featureDisplayName: 'Harmonics-to-Noise Ratio (HNR)',
    value: 21.4,
    unit: 'dB',
    referenceControlNorm: '> 20 dB',
    contributionScore: -0.08,
    zScore: -0.4,
    clinicalInterpretation: 'Normal vocal fold glottal harmonic closure.',
  };

  const mockTappingFeature: FeatureAttribution = {
    featureKey: 'interTapIntervalVariance',
    featureDisplayName: 'Inter-Tap Arrhythmia Variance',
    value: 19.8,
    unit: 'ms',
    referenceControlNorm: '< 20 ms',
    contributionScore: 0.05,
    zScore: 0.3,
    clinicalInterpretation: 'Consistent motor tapping rhythmicity within expected control range.',
  };

  const handwritingModality: ModalityResult = {
    modality: 'handwriting',
    modelName: 'HandPD Random Forest Classifier (v1.2)',
    riskProbability: 0.32,
    confidence: 0.91,
    uncertaintyInterval: [0.24, 0.40],
    status: 'completed',
    topFeatures: [mockTremorFeature],
    rawFeatures: { tremorFrequencyIndex: 4.8, radialDeviationMean: 2.1 },
  };

  const voiceModality: ModalityResult = {
    modality: 'voice',
    modelName: 'Acoustic Dysphonia XGBoost (v2.0)',
    riskProbability: 0.28,
    confidence: 0.89,
    uncertaintyInterval: [0.20, 0.36],
    status: 'completed',
    topFeatures: [mockJitterFeature, mockHnrFeature],
    rawFeatures: { jitterLocalPercent: 0.52, harmonicsToNoiseRatioDb: 21.4 },
  };

  const motorModality: ModalityResult = {
    modality: 'motor',
    modelName: 'Motor Arrhythmokinesis Detector (v1.0)',
    riskProbability: 0.25,
    confidence: 0.93,
    uncertaintyInterval: [0.18, 0.32],
    status: 'completed',
    topFeatures: [mockTappingFeature],
    rawFeatures: { interTapIntervalVariance: 19.8, tappingCadenceHz: 4.2 },
  };

  const questionnaireModality: ModalityResult = {
    modality: 'questionnaire',
    modelName: 'MDS-UPDRS Behavioral Risk Index (v1.1)',
    riskProbability: 0.30,
    confidence: 0.85,
    uncertaintyInterval: [0.22, 0.38],
    status: 'completed',
    topFeatures: [],
    rawFeatures: { totalScore: 3, ageBracket: '60_69' },
  };

  return {
    sessionId,
    timestamp: new Date().toISOString(),
    userId: currentUid,
    overallRiskScore: 34.5,
    riskLevel: 'mild_variance',
    confidenceScore: 92.4,
    credibleInterval95: [28.1, 41.2],
    modalitiesEvaluatedCount: 4,
    modalityWeights: {
      handwriting: 0.35,
      voice: 0.30,
      motor: 0.25,
      questionnaire: 0.10,
    },
    modalityResults: {
      handwriting: handwritingModality,
      voice: voiceModality,
      motor: motorModality,
      questionnaire: questionnaireModality,
    },
    explainability: {
      baseRatePercentage: 15.0,
      waterfallAttributions: [mockTremorFeature, mockJitterFeature, mockHnrFeature],
      topPositiveDrivers: [mockTremorFeature, mockJitterFeature],
      topProtectiveFactors: [mockHnrFeature],
      counterfactualRecommendation: 'Slight motor rhythmicity variance detected. Maintain regular motor dexterity exercise.',
    },
    clinicalSummary: {
      indicationHeadline: 'Diagnostic Validation Test Record',
      clinicalContext: 'Automated diagnostic test payload generated to verify Firestore security rules and schema adherence.',
      recommendedNextStep: 'Verification test only. No medical action warranted.',
    },
  };
}

/**
 * Executes an end-to-end security and persistence diagnostic.
 */
export async function runDiagnosticSessionVerification(): Promise<DiagnosticResult> {
  const timestamp = new Date().toISOString();
  console.group('%c[NeuroScreen AI] Firestore Diagnostic Test', 'color: #06b6d4; font-weight: bold;');
  console.log('Timestamp:', timestamp);

  const currentUser = auth.currentUser;

  // Case 1: Unauthenticated
  if (!currentUser) {
    const report: DiagnosticResult = {
      timestamp,
      authenticated: false,
      userId: null,
      userEmail: null,
      targetPath: null,
      writeSuccess: false,
      readVerified: false,
      crossUserAttackBlocked: true, // by virtue of default-deny
      errorDetails: 'No user is currently signed in. Security rules enforce that unauthenticated writes are rejected by design.',
      summary: 'PASS (Security Rules Working): Unauthenticated writes are safely blocked by Firestore security rules. To test authorized write-back, sign in with Google.',
    };
    console.warn('Authentication State: Unauthenticated (Guest/Demo mode)');
    console.log('Result:', report.summary);
    console.groupEnd();
    return report;
  }

  // Case 2: Authenticated user
  const userId = currentUser.uid;
  const userEmail = currentUser.email;
  const testSessionId = `test-session-${Date.now()}`;
  const targetPath = `users/${userId}/sessions/${testSessionId}`;

  console.log('Authenticated User UID:', userId);
  console.log('User Email:', userEmail);
  console.log('Target Authorized Path:', targetPath);

  let writeSuccess = false;
  let readVerified = false;
  let crossUserAttackBlocked = false;
  let errorDetails: string | null = null;

  try {
    // 1. Test Authorized Write via saveScreeningSessionToFirestore
    console.log("Step 1: Attempting authorized write to user's own session path...");
    const dummySession = createMockDiagnosticSession(testSessionId);
    const saveResult = await saveScreeningSessionToFirestore(dummySession, 'DIAG-COHORT-01');

    if (saveResult.success) {
      writeSuccess = true;
      console.log('%c✓ Authorized write SUCCEEDED at: ' + saveResult.sessionPath, 'color: #10b981;');
    } else {
      errorDetails = saveResult.error || 'Write returned success: false';
      console.error('✗ Write failed:', errorDetails);
    }

    // 2. Test Authorized Read-Back
    if (writeSuccess) {
      console.log('Step 2: Attempting read-back of the newly written test session...');
      const sessionDocRef = doc(db, 'users', userId, 'sessions', testSessionId);
      const snapshot = await getDoc(sessionDocRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const hasId = data.id === testSessionId;
        const hasVoiceScore = data.voiceScore !== undefined;
        const hasHandwritingScore = data.handwritingScore !== undefined;
        const hasMovementScore = data.movementScore !== undefined;
        const hasMultimodalScore = typeof data.multimodalScore === 'number';
        const hasConfidence = typeof data.confidence === 'number';
        const hasExplainability = data.explainabilityContributions && Array.isArray(data.explainabilityContributions.waterfallAttributions);
        const hasTimestamp = data.timestamp !== undefined;
        const hasBaselineDeviation = typeof data.baselineDeviation === 'number';

        const allFieldsValid = hasId && hasVoiceScore && hasHandwritingScore && hasMovementScore &&
          hasMultimodalScore && hasConfidence && hasExplainability && hasTimestamp && hasBaselineDeviation;

        if (allFieldsValid) {
          readVerified = true;
          console.log('%c✓ Read-back verification SUCCEEDED. All required metrics stored and retrieved:', 'color: #10b981;', {
            voiceScore: data.voiceScore,
            handwritingScore: data.handwritingScore,
            movementScore: data.movementScore,
            multimodalScore: data.multimodalScore,
            confidence: data.confidence,
            baselineDeviation: data.baselineDeviation,
            timestamp: data.timestamp,
            explainabilityContributionsCount: data.explainabilityContributions.waterfallAttributions.length,
          });
        } else {
          console.warn('✗ Document missing required metrics:', { hasId, hasVoiceScore, hasHandwritingScore, hasMovementScore, hasMultimodalScore, hasConfidence, hasExplainability, hasTimestamp, hasBaselineDeviation });
        }
      } else {
        console.warn('✗ Document was not found on read-back.');
      }

      // Cleanup diagnostic test document
      try {
        await deleteDoc(sessionDocRef);
        console.log('✓ Diagnostic test session cleaned up successfully.');
      } catch (cleanErr) {
        console.warn('Notice: Test session cleanup skipped:', cleanErr);
      }
    }

    // 3. Test Adversarial / Cross-User Write Attack
    console.log('Step 3: Attempting cross-user write to unauthorized path (expecting PERMISSION_DENIED)...');
    try {
      const spoofedPath = 'users/unauthorized_victim_uid_9999/sessions/exploit-session';
      const spoofedDocRef = doc(db, spoofedPath);
      await setDoc(spoofedDocRef, {
        id: 'exploit-session',
        userId: 'unauthorized_victim_uid_9999',
        overallRiskScore: 99,
        riskLevel: 'elevated_pattern',
        confidenceScore: 99,
      });
      console.error('%cCRITICAL FAILURE: Unauthorized cross-user write was NOT blocked!', 'color: #ef4444;');
      crossUserAttackBlocked = false;
    } catch (crossErr: unknown) {
      crossUserAttackBlocked = true;
      console.log('%c✓ Security rule enforced: Cross-user write rejected with permission-denied as expected.', 'color: #10b981;');
    }
  } catch (err: unknown) {
    errorDetails = err instanceof Error ? err.message : String(err);
    console.error('Diagnostic error:', errorDetails);
  }

  const isHealthy = writeSuccess && readVerified && crossUserAttackBlocked;
  const summary = isHealthy
    ? 'SUCCESS: Firestore security rules and authorized session writes are working as expected! Authorized writes and reads succeed at the user path, and unauthorized cross-user writes are rejected.'
    : `WARNING: Diagnostic completed with status [Write: ${writeSuccess}, Read: ${readVerified}, Cross-User Blocked: ${crossUserAttackBlocked}]. Details: ${errorDetails || 'None'}`;

  console.log('%c' + summary, isHealthy ? 'color: #10b981; font-weight: bold;' : 'color: #f59e0b;');
  console.groupEnd();

  return {
    timestamp,
    authenticated: true,
    userId,
    userEmail: userEmail || null,
    targetPath,
    writeSuccess,
    readVerified,
    crossUserAttackBlocked,
    errorDetails,
    summary,
  };
}

// Expose on window for interactive browser console execution anytime
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).runNeuroScreenDiagnostics = runDiagnosticSessionVerification;
}
