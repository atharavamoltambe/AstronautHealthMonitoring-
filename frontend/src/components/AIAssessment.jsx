import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  Activity, 
  FileText, 
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { evaluateFlightDay, DEFAULT_MISSION_DAY_ID } from '../services/api';

const NOMINAL_ASSESSMENT = {
  id: 'nominal-ai-01',
  assessment_type: 'nasa_flight_rules_evaluation',
  result: 'no_flag',
  created_at: new Date().toISOString(),
  details: {
    flags: [],
    ai_summary: 
      "Astronaut Operational Briefing (NASA-STD-3001 Vol 1 §4 Clinical Evaluation):\n\n" +
      "All real-time physiological indicators (resting heart rate, SpO2, core temperature, sleep rest architecture) " +
      "are within nominal deep-space bounds. Neuro-vestibular adaptation is proceeding nominally with no acute " +
      "decompensation or cephalic fluid shift pathology detected.\n\n" +
      "Recommended Flight Protocol:\n" +
      "1. Maintain scheduled 90-minute ARED/T2 musculoskeletal countermeasure exercise.\n" +
      "2. Continue targeted hydration volume (minimum 2,250 mL/day oral fluid intake).\n" +
      "3. Proceed with nominal extravehicular and cabin flight activities.",
    ai_model: 'llama3.2:latest',
    ai_provider: 'Local Edge LLM',
    countermeasures: [
      'Maintain nominal circadian rest cycle (7.5h minimum)',
      'ARED daily microgravity resistive countermeasure workout',
      'Target hydration balance: 2,250 mL daily fluid intake',
      'Verify cabin ECLSS ppO2 & ppCO2 atmospheric telemetry',
    ],
  },
};

export default function AIAssessment({ missionDayId, assessments, onRefresh }) {
  const [evaluating, setEvaluating] = useState(false);
  const [activeAssessment, setActiveAssessment] = useState(assessments?.[0] || NOMINAL_ASSESSMENT);
  const [error, setError] = useState(null);

  // Sync active assessment if assessments list changes
  React.useEffect(() => {
    if (assessments && assessments.length > 0) {
      setActiveAssessment(assessments[0]);
    }
  }, [assessments]);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    setError(null);
    try {
      const targetId = missionDayId || DEFAULT_MISSION_DAY_ID;
      const newAssessment = await evaluateFlightDay(targetId);
      setActiveAssessment(newAssessment);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to execute AI clinical evaluation.');
    } finally {
      setEvaluating(false);
    }
  };

  const details = activeAssessment?.details || {};
  const flags = details.flags || [];
  const countermeasures = details.countermeasures || [];
  const aiSummary = details.ai_summary;
  const aiModel = details.ai_model || 'llama3.2:latest';
  const aiProvider = details.ai_provider || 'local_edge_llm';
  const result = activeAssessment?.result || 'no_flag';

  const isNominal = result === 'no_flag';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">
              Autonomous Clinical Decision Support
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            Spaceflight AI Medical Assessment
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Offline Edge LLM synthesis under NASA-STD-3001 spaceflight clinical guidelines
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRunEvaluation}
          disabled={evaluating}
          className="self-start md:self-auto px-5 py-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-cyan-500/25 flex items-center space-x-2 transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
        >
          {evaluating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
              <span>Analyzing Flight Telemetry...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>Run Live Flight Day Assessment</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-2xl text-red-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{typeof error === 'string' ? error : JSON.stringify(error)}</span>
        </div>
      )}

      {/* Main Grid: AI Briefing Card + Clinical Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Holographic AI Flight Surgeon Briefing Card */}
        <div className="lg:col-span-8 hud-card-active rounded-2xl p-6 relative overflow-hidden border border-cyan-500/30 flex flex-col justify-between">
          
          <div>
            {/* Top metadata pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/15 pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Edge AI Flight Surgeon Briefing
                  </h3>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                    <span>Model: <strong className="text-cyan-300">{aiModel}</strong></span>
                    <span>•</span>
                    <span>Engine: <strong className="text-cyan-300">{aiProvider}</strong></span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  isNominal
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                }`}>
                  {isNominal ? 'NOMINAL: NO FLAGS' : 'REVIEW RECOMMENDED'}
                </span>
              </div>
            </div>

            {/* AI Generated Briefing Content */}
            <div className="mt-5 space-y-4">
              {aiSummary ? (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/20 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                  {aiSummary}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <p className="text-xs text-slate-400">
                    No briefing synthesized yet for this flight day. Click <strong className="text-cyan-300">"Run Live Flight Day Assessment"</strong> above to dispatch telemetry to your local LLM.
                  </p>
                </div>
              )}
            </div>

            {/* Prescribed Operational Countermeasures */}
            {countermeasures.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center space-x-2 mb-3">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  <span>Prescribed Spaceflight Countermeasures</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {countermeasures.map((cm, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-slate-200 flex items-start space-x-2.5"
                    >
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{cm}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Aerospace Disclaimer */}
          <div className="mt-6 pt-4 border-t border-cyan-500/15 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>NASA-STD-3001 Vol 1 §4 Crew Health CDSS</span>
            </span>
            <span className="font-mono text-cyan-400/80">
              {details.evaluation_timestamp || 'Active Flight Telemetry'}
            </span>
          </div>
        </div>

        {/* Right Column: Clinical Flags & Telemetry Counts */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Detected Clinical Flags */}
          <div className="hud-card rounded-2xl p-6 border border-cyan-500/20">
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Identified Clinical Flags</span>
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                {flags.length} Flag(s)
              </span>
            </h4>

            <div className="mt-4 space-y-3">
              {flags.length > 0 ? (
                flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-1"
                  >
                    <div className="font-semibold text-amber-300">
                      {flag.symptom || 'Physiological Flag'}
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      {flag.finding || JSON.stringify(flag)}
                    </p>
                    {flag.severity && (
                      <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        Severity: {flag.severity}/5
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>All vitals within NASA-STD-3001 nominal thresholds.</span>
                </div>
              )}
            </div>
          </div>

          {/* Telemetry Processed Summary */}
          <div className="hud-card rounded-2xl p-6 border border-cyan-500/20">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2 mb-4">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Flight Day Telemetry Ingested</span>
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase">Vitals Logged</span>
                <p className="text-xl font-bold font-mono text-cyan-300 mt-1">
                  {details.telemetry_evaluated?.vitals_count ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase">Symptoms Reported</span>
                <p className="text-xl font-bold font-mono text-amber-300 mt-1">
                  {details.telemetry_evaluated?.symptoms_count ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase">Checklists Done</span>
                <p className="text-xl font-bold font-mono text-emerald-300 mt-1">
                  {details.telemetry_evaluated?.checklists_completed ?? 0} / {details.telemetry_evaluated?.checklists_total ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase">Standard</span>
                <p className="text-[11px] font-semibold text-slate-300 mt-1">
                  NASA-STD-3001
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Historical Assessments Log Table */}
      {assessments && assessments.length > 0 && (
        <div className="hud-card rounded-2xl p-6 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span>Historical Clinical Evaluations</span>
              </h3>
              <p className="text-xs text-slate-400">
                Audit trail of AI clinical syntheses recorded in Supabase PostgreSQL
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Evaluation ID</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">AI Model</th>
                  <th className="py-3 px-4">Flags</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {assessments.map((a) => (
                  <tr 
                    key={a.id}
                    className={`hover:bg-cyan-950/20 transition-colors ${
                      activeAssessment?.id === a.id ? 'bg-cyan-500/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-cyan-300 truncate max-w-[120px]">
                      {a.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        a.result === 'no_flag'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                      }`}>
                        {a.result}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {a.details?.ai_model || 'local_llm'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {a.details?.flags?.length || 0}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveAssessment(a)}
                        className="text-cyan-400 hover:text-white underline text-[11px] cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

