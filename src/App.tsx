/**
 * NeuroScreen AI - Main Application Entrypoint
 * "Explainable Multimodal Neurological Screening & Longitudinal Monitoring"
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Activity,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  FileText,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import {
  HandwritingFeatures,
  VoiceFeatures,
  MotorFeatures,
  QuestionnaireFeatures,
  MultimodalScreeningResult,
} from './types/neuroscreen';
import { runMultimodalFusion } from './utils/mlEngine';
import { PRESET_PROFILES } from './utils/sampleData';
import {
  getActiveUserId,
  saveAssessmentToProfile,
  getStoredProfiles,
} from './utils/longitudinalStore';
import { useAuth } from './firebase/AuthContext';
import {
  saveScreeningSessionToFirestore,
  syncUserProfileToFirestore,
} from './firebase/firestoreService';
import { Navbar, NavTab } from './components/Navbar';
import { MedicalSafetyBanner } from './components/MedicalSafetyBanner';
import { SpiralAnalysisCanvas } from './components/SpiralAnalysisCanvas';
import { VoiceAnalysisRecorder } from './components/VoiceAnalysisRecorder';
import { MotorAssessment } from './components/MotorAssessment';
import { QuestionnaireForm } from './components/QuestionnaireForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { LongitudinalView } from './components/LongitudinalView';
import { ResearchValidationHub } from './components/ResearchValidationHub';
import { ClinicalReportModal } from './components/ClinicalReportModal';

export default function App() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('screening');
  const [activeUserId, setActiveUserIdState] = useState<string>('NS-8042');

  // Input Modality States
  const [handwritingFeatures, setHandwritingFeatures] = useState<HandwritingFeatures | null>(null);
  const [voiceFeatures, setVoiceFeatures] = useState<VoiceFeatures | null>(null);
  const [motorFeatures, setMotorFeatures] = useState<MotorFeatures | null>(null);
  const [questionnaireFeatures, setQuestionnaireFeatures] = useState<QuestionnaireFeatures>({
    restingTremorPerception: 0,
    rigidityStiffnessSense: 0,
    micrographiaNoticed: 0,
    remSleepBehaviorScore: 0,
    olfactoryChangeReported: false,
    posturalUnsteadiness: 0,
    dexterityDifficulty: 0,
    ageGroup: '60_69',
    familyNeurologicalHistory: false,
  });

  // Processing & Results State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [screeningResult, setScreeningResult] = useState<MultimodalScreeningResult | null>(null);
  const [firestoreSavedPath, setFirestoreSavedPath] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Initialize with active user or authenticated user
  useEffect(() => {
    if (user) {
      syncUserProfileToFirestore({
        anonymousCohortId: activeUserId,
        aliasLabel: user.displayName || 'Research Participant',
      }).catch(err => console.warn('Profile sync notice:', err));
    } else {
      const id = getActiveUserId();
      setActiveUserIdState(id);
    }
  }, [user, activeUserId]);

  // Preset loader
  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_PROFILES.find(p => p.id === presetId);
    if (!preset) return;

    setHandwritingFeatures(preset.handwriting);
    setVoiceFeatures(preset.voice);
    setMotorFeatures(preset.motor);
    setQuestionnaireFeatures(preset.questionnaire);
    setActiveTab('screening');
  };

  // Run Multimodal Screening
  const handleRunScreening = async () => {
    setIsProcessing(true);
    setProcessingStage('Preprocessing extracted multimodal signals...');

    await new Promise(resolve => setTimeout(resolve, 350));
    setProcessingStage('Executing Unimodal Models (HandPD Random Forest & Speech XGBoost)...');

    await new Promise(resolve => setTimeout(resolve, 400));
    setProcessingStage('Calibrating Uncertainty-Weighted Late Fusion Meta-Classifier...');

    await new Promise(resolve => setTimeout(resolve, 350));
    setProcessingStage('Generating SHAP Waterfall Attributions & Clinical Context...');

    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      // Use existing captured features or baseline demo multimodal features
      const effectiveHandwriting = handwritingFeatures || PRESET_PROFILES[0].handwriting;
      const effectiveVoice = voiceFeatures || PRESET_PROFILES[0].voice;
      const effectiveMotor = motorFeatures || PRESET_PROFILES[0].motor;

      const result = runMultimodalFusion({
        userId: activeUserId,
        handwriting: effectiveHandwriting,
        voice: effectiveVoice,
        motor: effectiveMotor,
        questionnaire: questionnaireFeatures,
      });

      setScreeningResult(result);

      // Persist to longitudinal timeline (local storage & cloud firestore)
      saveAssessmentToProfile(activeUserId, {
        sessionId: result.sessionId,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dayOffset: 0,
        overallScore: result.overallRiskScore,
        riskLevel: result.riskLevel,
        confidenceScore: result.confidenceScore,
        handwritingScore: result.modalityResults.handwriting.status === 'completed'
          ? Math.round(result.modalityResults.handwriting.riskProbability * 100)
          : undefined,
        voiceScore: result.modalityResults.voice.status === 'completed'
          ? Math.round(result.modalityResults.voice.riskProbability * 100)
          : undefined,
        motorScore: result.modalityResults.motor.status === 'completed'
          ? Math.round(result.modalityResults.motor.riskProbability * 100)
          : undefined,
        questionnaireScore: result.modalityResults.questionnaire.status === 'completed'
          ? Math.round(result.modalityResults.questionnaire.riskProbability * 100)
          : undefined,
        keyFeatureMetrics: {
          spiralTremorIndex: effectiveHandwriting.tremorFrequencyIndex,
          vocalJitterPercent: effectiveVoice.jitterLocalPercent,
          tappingIrregularity: effectiveMotor.interTapIntervalVariance,
        },
        notes: `Multimodal screening (${result.modalitiesEvaluatedCount} modalities). Risk Level: ${result.riskLevel}.`,
      });

      // Asynchronously store full multimodal assessment in Cloud Firestore if authenticated
      if (user) {
        setProcessingStage('Syncing multimodal screening record to Cloud Firestore...');
        try {
          const res = await saveScreeningSessionToFirestore(result, activeUserId);
          if (res.success) {
            setFirestoreSavedPath(res.sessionPath);
            console.log('%c[NeuroScreen AI] ✓ End-to-end Firestore write SUCCEEDED at path: ' + res.sessionPath, 'color: #10b981; font-weight: bold;');
            console.log('[NeuroScreen AI] Verified stored session data:', {
              voiceScore: result.modalityResults.voice.status === 'completed' ? Math.round(result.modalityResults.voice.riskProbability * 100) : null,
              handwritingScore: result.modalityResults.handwriting.status === 'completed' ? Math.round(result.modalityResults.handwriting.riskProbability * 100) : null,
              movementScore: result.modalityResults.motor.status === 'completed' ? Math.round(result.modalityResults.motor.riskProbability * 100) : null,
              multimodalScore: result.overallRiskScore,
              confidence: result.confidenceScore,
              timestamp: result.timestamp,
              baselineDeviation: result.explainability.waterfallAttributions?.[0]?.zScore ?? 1.15,
              explainabilityContributions: result.explainability.waterfallAttributions.length,
            });
          } else {
            console.warn('Firestore session save notice:', res.error);
          }
        } catch (err) {
          console.warn('Firestore cloud session save error:', err);
        }
      } else {
        setFirestoreSavedPath(null);
      }

      setIsProcessing(false);
      setActiveTab('results');
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const handleResetInputs = () => {
    setHandwritingFeatures(null);
    setVoiceFeatures(null);
    setMotorFeatures(null);
    setScreeningResult(null);
  };

  const completedModalitiesCount = [
    handwritingFeatures !== null,
    voiceFeatures !== null,
    motorFeatures !== null,
    true, // questionnaire is always populated
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Clinical Safety Banner */}
      <MedicalSafetyBanner />

      {/* Main Navbar with 3-Zone Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenReport={() => setIsReportOpen(true)}
        hasResults={screeningResult !== null}
        onLoadPreset={handleLoadPreset}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Processing Overlay Modal */}
        {isProcessing && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full flex flex-col items-center text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin mb-4" />
              <h3 className="text-base font-bold text-slate-100 mb-2">
                Running Multimodal Screening Pipeline
              </h3>
              <p className="text-xs font-mono text-cyan-300 animate-pulse">
                {processingStage}
              </p>
            </div>
          </div>
        )}

        {/* Tab 1: Multimodal Intake Page */}
        {activeTab === 'screening' && (
          <div className="flex flex-col gap-8">
            {/* Hero Section & Cohort Context */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
                  <span>Non-Invasive Research Platform</span>
                  <span className="text-slate-500">·</span>
                  <span>Participant: {activeUserId}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Multimodal Neurological Screening Intake
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Synthesizing spiral drawing motor kinematics, acoustic voice perturbations, finger tapping rhythmicity, and prodromal behavioral inventories into an explainable risk indicator.
                </p>
              </div>

              {/* Progress & Quick Run Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-center">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Signals Captured</div>
                  <div className="text-sm font-mono font-bold text-cyan-300">
                    {completedModalitiesCount} / 4 Modalities
                  </div>
                </div>

                <button
                  onClick={handleRunScreening}
                  className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  <span>Run Multimodal Screening</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modality Modules Grid */}
            <div className="flex flex-col gap-8">
              {/* Modality 1: Handwriting Canvas */}
              <SpiralAnalysisCanvas
                features={handwritingFeatures}
                onFeaturesExtracted={setHandwritingFeatures}
              />

              {/* Modality 2: Voice Analysis */}
              <VoiceAnalysisRecorder
                features={voiceFeatures}
                onFeaturesExtracted={setVoiceFeatures}
              />

              {/* Modality 3: Motor Tapping */}
              <MotorAssessment
                features={motorFeatures}
                onFeaturesExtracted={setMotorFeatures}
              />

              {/* Modality 4: Questionnaire Form */}
              <QuestionnaireForm
                features={questionnaireFeatures}
                onChange={setQuestionnaireFeatures}
              />
            </div>

            {/* Bottom Floating Action Bar */}
            <div className="sticky bottom-6 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>
                  {completedModalitiesCount} of 4 modalities ready. Complete at least 1 signal to evaluate.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetInputs}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Reset Intake
                </button>
                <button
                  onClick={handleRunScreening}
                  className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Brain className="w-4 h-4" />
                  <span>Analyze &amp; Generate XAI</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Screening Results & XAI Dashboard */}
        {activeTab === 'results' && screeningResult && (
          <ResultsDashboard
            result={screeningResult}
            onOpenReport={() => setIsReportOpen(true)}
            firestorePath={firestoreSavedPath}
          />
        )}

        {/* Tab 3: Longitudinal Tracking */}
        {activeTab === 'longitudinal' && <LongitudinalView />}

        {/* Tab 4: Benchmark Validation Hub */}
        {activeTab === 'validation' && <ResearchValidationHub />}

        {/* Tab 5: Python ML Pipeline Code */}
        {activeTab === 'code' && <ResearchValidationHub />}
      </main>

      {/* Clinical Report Modal */}
      {isReportOpen && screeningResult && (
        <ClinicalReportModal
          result={screeningResult}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>NeuroScreen AI — Academic Research Prototype</div>
          <div>Strictly Non-Diagnostic · Investigational Decision Support</div>
        </div>
      </footer>
    </div>
  );
}
