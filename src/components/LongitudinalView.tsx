import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  User,
  Plus,
  ArrowRight,
  ShieldAlert,
  Cloud,
} from 'lucide-react';
import { UserProfile, LongitudinalAssessment } from '../types/neuroscreen';
import {
  getStoredProfiles,
  getActiveUserId,
  setActiveUserId,
  analyzeLongitudinalTrend,
  createNewUserProfile,
} from '../utils/longitudinalStore';
import { useAuth } from '../firebase/AuthContext';
import { getLongitudinalHistoryFromFirestore } from '../firebase/firestoreService';

interface LongitudinalViewProps {
  onSelectAssessment?: (assessment: LongitudinalAssessment) => void;
}

export const LongitudinalView: React.FC<LongitudinalViewProps> = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>(getStoredProfiles());
  const [activeId, setActiveId] = useState<string>(getActiveUserId());
  const [selectedMetric, setSelectedMetric] = useState<'overall' | 'tremor' | 'jitter' | 'motor'>('overall');
  const [cloudAssessments, setCloudAssessments] = useState<LongitudinalAssessment[] | null>(null);

  // Load Cloud Firestore assessments when user is authenticated
  useEffect(() => {
    if (user) {
      getLongitudinalHistoryFromFirestore().then(data => {
        if (data && data.length > 0) {
          setCloudAssessments(data);
        }
      }).catch(err => console.warn('Firestore fetch notice:', err));
    }
  }, [user]);

  // New subject state
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newId, setNewId] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const [newAge, setNewAge] = useState('60 - 69');

  const currentProfile = profiles.find(p => p.anonymousId === activeId) || profiles[0];
  const assessments = (user && cloudAssessments && cloudAssessments.length > 0)
    ? cloudAssessments
    : (currentProfile ? currentProfile.assessments : []);
  const trendAnalysis = analyzeLongitudinalTrend(assessments);

  const handleSwitchUser = (id: string) => {
    setActiveId(id);
    setActiveUserId(id);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim()) return;
    const created = createNewUserProfile(newId.trim(), newAlias.trim() || `Subject #${newId}`, newAge);
    setProfiles(getStoredProfiles());
    setActiveId(created.anonymousId);
    setIsCreatingUser(false);
    setNewId('');
    setNewAlias('');
  };

  const getTrendIcon = () => {
    switch (trendAnalysis.direction) {
      case 'elevated_trend':
        return <TrendingUp className="w-5 h-5 text-rose-400" />;
      case 'improving_trend':
        return <TrendingDown className="w-5 h-5 text-emerald-400" />;
      default:
        return <Minus className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card & Cohort Participant Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">Temporal Tracking</span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400">Longitudinal Trajectory Analysis</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
            Longitudinal Neurological Monitoring
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate sequential behavioral and motor shifts across longitudinal screening sessions.
          </p>
        </div>

        {/* Profile Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={activeId}
              onChange={e => handleSwitchUser(e.target.value)}
              className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              {profiles.map(p => (
                <option key={p.anonymousId} value={p.anonymousId} className="bg-slate-900 text-slate-200">
                  {p.anonymousId} ({p.aliasLabel})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCreatingUser(true)}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Register New Anonymous Subject"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Subject Modal Drawer */}
      {isCreatingUser && (
        <form onSubmit={handleCreateUser} className="bg-slate-900 border border-cyan-500/40 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-semibold text-cyan-300">Create Anonymous Subject Profile</span>
            <button
              type="button"
              onClick={() => setIsCreatingUser(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400">Anonymous ID (e.g. NS-9201)</label>
              <input
                type="text"
                required
                value={newId}
                onChange={e => setNewId(e.target.value)}
                placeholder="NS-9201"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 mt-1 focus:border-cyan-400 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">Alias / Cohort Label</label>
              <input
                type="text"
                value={newAlias}
                onChange={e => setNewAlias(e.target.value)}
                placeholder="Trial Group B"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 mt-1 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">Age Bracket</label>
              <select
                value={newAge}
                onChange={e => setNewAge(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 mt-1 focus:border-cyan-400 focus:outline-none"
              >
                <option value="50 - 59">50 - 59</option>
                <option value="60 - 69">60 - 69</option>
                <option value="70+">70+</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-cyan-400 text-slate-950 rounded hover:bg-cyan-300 transition-colors"
            >
              Save Subject
            </button>
          </div>
        </form>
      )}

      {/* Trend Summary Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
            {getTrendIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Temporal Trajectory Classification:
              </span>
              <span className="text-xs font-semibold text-slate-200 capitalize">
                {trendAnalysis.direction.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {trendAnalysis.description}
            </p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 self-stretch sm:self-auto text-center">
          <div className="text-[10px] uppercase font-mono text-slate-400">Total Net Delta</div>
          <div className="text-lg font-mono font-bold text-slate-100 tabular-nums">
            {trendAnalysis.deltaScore > 0 ? `+${trendAnalysis.deltaScore}` : trendAnalysis.deltaScore} pts
          </div>
        </div>
      </div>

      {/* Multi-Metric Time-Series Progression Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Longitudinal Signal Trajectory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracking parameter variation across time intervals
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedMetric('overall')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                selectedMetric === 'overall' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overall Risk Score
            </button>
            <button
              onClick={() => setSelectedMetric('tremor')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                selectedMetric === 'tremor' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Spiral Tremor Index
            </button>
            <button
              onClick={() => setSelectedMetric('jitter')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                selectedMetric === 'jitter' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vocal Jitter (%)
            </button>
            <button
              onClick={() => setSelectedMetric('motor')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                selectedMetric === 'motor' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tapping Arrhythmia
            </button>
          </div>
        </div>

        {/* SVG Time Series Plot */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
          {assessments.length < 2 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              At least 2 longitudinal assessments are required to generate time-series trajectories.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="h-56 w-full relative flex items-end justify-between px-6 pt-4 pb-2 border-b border-slate-800">
                {/* Horizontal guide lines */}
                <div className="absolute inset-x-6 top-8 border-b border-slate-800/60" />
                <div className="absolute inset-x-6 top-24 border-b border-slate-800/60" />
                <div className="absolute inset-x-6 top-40 border-b border-slate-800/60" />

                {assessments.map((item, idx) => {
                  let value = item.overallScore;
                  let maxVal = 100;
                  let displayVal = `${item.overallScore} pts`;

                  if (selectedMetric === 'tremor') {
                    value = item.keyFeatureMetrics.spiralTremorIndex;
                    maxVal = 4.0;
                    displayVal = `${value.toFixed(2)} arb`;
                  } else if (selectedMetric === 'jitter') {
                    value = item.keyFeatureMetrics.vocalJitterPercent;
                    maxVal = 2.0;
                    displayVal = `${value.toFixed(2)}%`;
                  } else if (selectedMetric === 'motor') {
                    value = item.keyFeatureMetrics.tappingIrregularity;
                    maxVal = 50.0;
                    displayVal = `${value.toFixed(1)} ms`;
                  }

                  const heightPercent = Math.min(95, Math.max(10, (value / maxVal) * 85));

                  return (
                    <div key={item.sessionId} className="flex flex-col items-center gap-2 z-10">
                      <span className="text-[11px] font-mono font-semibold text-cyan-300">
                        {displayVal}
                      </span>
                      <div className="w-10 bg-slate-900 border border-cyan-500/40 rounded-t flex flex-col justify-end p-0.5 h-44">
                        <div
                          className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all duration-700"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-medium text-slate-200">
                          {idx === 0 ? 'Baseline' : `Month ${Math.round(item.dayOffset / 30)}`}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">{item.date}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historical Sessions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
        <h3 className="text-base font-semibold text-slate-100">
          Historical Assessment Log ({assessments.length} sessions)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Session ID</th>
                <th className="px-4 py-3">Date / Interval</th>
                <th className="px-4 py-3">Composite Score</th>
                <th className="px-4 py-3">Spiral Tremor</th>
                <th className="px-4 py-3">Vocal Jitter</th>
                <th className="px-4 py-3">Tapping Arrhythmia</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {assessments.map(sess => (
                <tr key={sess.sessionId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-cyan-400 font-semibold">{sess.sessionId}</td>
                  <td className="px-4 py-3 text-slate-300">
                    <div>{sess.date}</div>
                    <div className="text-[10px] text-slate-500">Day +{sess.dayOffset}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-100 tabular-nums">
                    {sess.overallScore} / 100
                  </td>
                  <td className="px-4 py-3 tabular-nums">{sess.keyFeatureMetrics.spiralTremorIndex.toFixed(2)} arb</td>
                  <td className="px-4 py-3 tabular-nums">{sess.keyFeatureMetrics.vocalJitterPercent.toFixed(2)}%</td>
                  <td className="px-4 py-3 tabular-nums">{sess.keyFeatureMetrics.tappingIrregularity.toFixed(1)} ms</td>
                  <td className="px-4 py-3 tabular-nums">{sess.confidenceScore}%</td>
                  <td className="px-4 py-3 font-sans text-slate-400 text-[11px] max-w-xs truncate">
                    {sess.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
