import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Sun, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles,
  Cpu,
  Clock,
  Layers
} from 'lucide-react';
import { fetchRadiationStatus, simulateSPE, resetSPE } from '../services/api';

export default function RadiationDosimeter({ missionDayId, onRefresh }) {
  const [radiationData, setRadiationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [lastSpeResult, setLastSpeResult] = useState(null);
  const [error, setError] = useState(null);

  const loadRadiationData = async () => {
    if (!missionDayId) return;
    try {
      setError(null);
      const data = await fetchRadiationStatus(missionDayId);
      setRadiationData(data);
    } catch (err) {
      console.error('Failed to stream radiation telemetry:', err);
      setError('Unable to acquire dosimeter telemetry feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRadiationData();
    // Poll dosimeter status every 15 seconds
    const interval = setInterval(() => {
      loadRadiationData();
    }, 15000);
    return () => clearInterval(interval);
  }, [missionDayId]);

  const handleSimulateSPE = async () => {
    if (!missionDayId) return;
    setSimulating(true);
    setError(null);
    try {
      const payload = {
        mission_day_id: missionDayId,
        storm_class: 'Class X4.2 Solar Flare',
        flux_rate_msv_hr: 28.5,
        notes: 'High-energy coronal mass ejection heading directly along lunar orbital plane',
      };
      const res = await simulateSPE(payload);
      setLastSpeResult(res);
      await loadRadiationData();
      if (onRefresh) {
        await onRefresh(false);
      }
    } catch (err) {
      console.error('Solar flare simulation failed:', err);
      setError(err?.response?.data?.detail || 'Solar storm simulation failed.');
    } finally {
      setSimulating(false);
    }
  };

  const handleResetSPE = async () => {
    if (!missionDayId) return;
    setResetting(true);
    setError(null);
    try {
      await resetSPE(missionDayId);
      setLastSpeResult(null);
      await loadRadiationData();
      if (onRefresh) {
        await onRefresh(false);
      }
    } catch (err) {
      console.error('Failed to reset storm:', err);
      setError('Failed to clear simulated solar flare.');
    } finally {
      setResetting(false);
    }
  };

  if (loading && !radiationData) {
    return (
      <div className="hud-card rounded-2xl p-6 border border-cyan-500/20 flex items-center justify-center space-x-3 text-cyan-400 text-xs font-mono">
        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span>Syncing Dosimeter Telemetry...</span>
      </div>
    );
  }

  const isStormActive = radiationData?.storm_active;
  const metrics = radiationData?.metrics;
  const compliance = radiationData?.compliance;

  return (
    <div className={`rounded-2xl p-6 border transition-all duration-300 relative overflow-hidden ${
      isStormActive 
        ? 'bg-gradient-to-br from-red-950/50 via-[#180914] to-[#0d071a] border-red-500/60 shadow-2xl shadow-red-950/60 ring-1 ring-red-500/40' 
        : 'hud-card border-cyan-500/25'
    }`}>
      
      {/* Background flare ambient glow */}
      <div className={`absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
        isStormActive ? 'bg-red-600/15 animate-pulse' : 'bg-cyan-500/5'
      }`}></div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/15 pb-4 relative z-10">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl border transition-all ${
            isStormActive 
              ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' 
              : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
          }`}>
            {isStormActive ? <AlertTriangle className="w-6 h-6" /> : <Radio className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                isStormActive ? 'text-red-400' : 'text-cyan-400'
              }`}>
                NASA-STD-3001 VOL 1 · CREW HEALTH
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] font-mono text-slate-400">DOSIMETRY ENGINE</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Deep-Space Radiation & Solar Particle Event (SPE) Monitor</span>
            </h3>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isStormActive ? (
            <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 font-mono text-xs font-bold tracking-wider flex items-center space-x-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span>CLASS-X SOLAR PARTICLE EVENT ACTIVE</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-medium tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>NOMINAL GCR BASELINE · SHIELDED</span>
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="my-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Real-Time Telemetry Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-5 relative z-10">
        
        {/* Hourly Flux Rate */}
        <div className={`p-4 rounded-xl border transition-all ${
          isStormActive 
            ? 'bg-red-950/40 border-red-500/40 text-red-200' 
            : 'bg-slate-900/60 border-cyan-500/20 text-slate-200'
        }`}>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Real-Time Ambient Flux
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className={`text-2xl font-extrabold font-mono ${
              isStormActive ? 'text-red-300 animate-pulse' : 'text-white'
            }`}>
              {metrics?.hourly_rate_msv}
            </span>
            <span className="text-xs font-mono text-cyan-400">mSv/hr</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 block mt-1">
            {isStormActive ? '⚠️ 380x Above Baseline' : 'Nominal GCR (0.075)'}
          </span>
        </div>

        {/* 24h Projected Intake */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Projected 24h Intake
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className={`text-2xl font-extrabold font-mono ${
              isStormActive ? 'text-amber-300' : 'text-white'
            }`}>
              {metrics?.daily_projected_msv}
            </span>
            <span className="text-xs font-mono text-cyan-400">mSv/day</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 block mt-1">
            Baseline: 1.80 mSv/day
          </span>
        </div>

        {/* 30-Day Cumulative Progress */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase">
            <span>30-Day Limit (250 mSv)</span>
            <span className="text-cyan-300 font-bold">{compliance?.pct_30d_used}%</span>
          </div>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl font-extrabold font-mono text-white">
              {metrics?.cumulative_30d_msv}
            </span>
            <span className="text-xs font-mono text-cyan-400">mSv</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                compliance?.pct_30d_used > 50 ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(compliance?.pct_30d_used || 0, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Career Safe Exposure Ceiling */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase">
            <span>Career Ceiling (600 mSv)</span>
            <span className="text-cyan-300 font-bold">{compliance?.pct_career_used}%</span>
          </div>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl font-extrabold font-mono text-white">
              {metrics?.cumulative_career_msv}
            </span>
            <span className="text-xs font-mono text-cyan-400">mSv</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                compliance?.pct_career_used > 50 ? 'bg-amber-400' : 'bg-blue-400'
              }`}
              style={{ width: `${Math.min(compliance?.pct_career_used || 0, 100)}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Active Storm LLM Briefing Card (Visible when SPE is active) */}
      {isStormActive && (
        <div className="my-5 p-5 rounded-xl bg-red-950/70 border border-red-500/50 shadow-inner space-y-3 relative z-10 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-300 font-mono text-xs font-bold tracking-wider uppercase">
              <Cpu className="w-4 h-4 text-red-400 animate-spin" />
              <span>Local Edge LLM Autonomous Operational Emergency Briefing</span>
            </div>
            <span className="text-[10px] font-mono bg-red-900/80 text-red-200 px-2.5 py-0.5 rounded border border-red-500/40">
              NASA-STD-3001 PROTOCOL
            </span>
          </div>

          <p className="text-xs sm:text-sm text-red-100 leading-relaxed font-sans bg-black/40 p-3.5 rounded-lg border border-red-500/30">
            {lastSpeResult?.ai_emergency_briefing || radiationData?.operational_advisory}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-red-500/20 text-xs font-mono text-red-300">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>4 Critical Countermeasures Auto-Injected into Daily Flight Checklist</span>
            </span>
            <span className="text-[11px] text-red-400 font-semibold">
              Action: Retreat to Water-Shielded Crew Quarters
            </span>
          </div>
        </div>
      )}

      {/* Passive Shielding Status & Action Trigger Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-cyan-500/15 relative z-10 text-xs">
        
        {/* Shielding Text */}
        <div className="flex items-center space-x-2 text-slate-300 font-mono text-[11px]">
          <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{radiationData?.shielding_status}</span>
        </div>

        {/* Demo Action Buttons */}
        <div className="flex items-center space-x-3">
          {isStormActive ? (
            <button
              onClick={handleResetSPE}
              disabled={resetting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {resetting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Clear Storm // Reset to Nominal</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSimulateSPE}
              disabled={simulating}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-mono font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-amber-950/60 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Triggering Solar Flare & LLM...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-slate-950" />
                  <span>⚡ Simulate Class-X Solar Flare (SPE)</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
