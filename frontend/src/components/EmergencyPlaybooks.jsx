import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Scale, 
  MapPin, 
  FileText, 
  Send, 
  ChevronRight, 
  Activity, 
  Sparkles, 
  Zap, 
  RefreshCw,
  Info
} from 'lucide-react';
import { fetchPlaybooks, deployPlaybook } from '../services/api';
import { computePlaybooks } from '../data/defaultPlaybooks';

export default function EmergencyPlaybooks({ missionDayId, onNavigate, onRefresh }) {
  const [playbooks, setPlaybooks] = useState(() => computePlaybooks(75));
  const [selectedKey, setSelectedKey] = useState('spaceflight_nephrolithiasis');
  const [astronautWeight, setAstronautWeight] = useState(75);
  const [syncing, setSyncing] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [severity, setSeverity] = useState(4);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [deployResult, setDeployResult] = useState(null);
  const [error, setError] = useState(null);

  // Load playbooks with active weight calculation
  const loadPlaybooks = async (weight) => {
    // 1. Immediately calculate optimistic dosing locally for zero-latency response
    setPlaybooks(computePlaybooks(weight));

    // 2. Background sync with backend service
    try {
      setError(null);
      setSyncing(true);
      const data = await fetchPlaybooks(weight);
      if (data && data.length > 0) {
        setPlaybooks(data);
      }
    } catch (err) {
      console.warn('Playbooks background sync notice:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadPlaybooks(astronautWeight);
  }, [astronautWeight]);

  const activeProtocol = playbooks.find((p) => p.condition_key === selectedKey) || playbooks[0];

  const handleDeploy = async () => {
    if (!missionDayId || !activeProtocol) return;
    setDeploying(true);
    setDeployResult(null);
    setError(null);

    try {
      const payload = {
        mission_day_id: missionDayId,
        condition_key: activeProtocol.condition_key,
        severity: parseInt(severity, 10),
        notes: clinicalNotes.trim() || `CMO Emergency Protocol Triggered: ${activeProtocol.title}`,
      };

      const result = await deployPlaybook(payload);
      setDeployResult(result);
      if (onRefresh) {
        await onRefresh(false);
      }
    } catch (err) {
      console.error('Emergency playbook deployment failed:', err);
      setError(err?.response?.data?.detail || 'Failed to deploy emergency protocol to flight checklist.');
    } finally {
      setDeploying(false);
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch ((urgency || '').toUpperCase()) {
      case 'IMMEDIATE':
        return 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';
      case 'URGENT':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'PRIORITY':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-700/30 text-slate-300 border-slate-600/40';
    }
  };


  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / HUD Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0a142c] via-[#091834] to-[#071329] border border-cyan-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>NASA CMO Clinical Decision Support System</span>
              <span className="text-slate-500">•</span>
              <span className="text-rose-400 font-bold">EMERGENCY PLAYBOOKS & DOSAGE ENGINE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Microgravity Clinical Playbooks
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Standardized NASA-STD-3001 spaceflight emergency protocols with autonomous weight-adjusted dosage calculations, 
              stowage pack locations, and one-click injection into the astronaut's Daily Flight Checklist.
            </p>
          </div>

          {/* Interactive Weight Dosage Tuner */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md flex flex-col space-y-2 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                <span>Astronaut Weight (kg):</span>
              </span>
              <span className="text-sm font-bold font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-500/40">
                {astronautWeight} kg
              </span>
            </div>
            <input 
              type="range"
              min="50"
              max="115"
              step="1"
              value={astronautWeight}
              onChange={(e) => setAstronautWeight(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>50 kg</span>
              <span className="text-cyan-400/80">Tailored Live Dosage Tuning</span>
              <span>115 kg</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center space-x-3 text-red-300 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Deployment Success Feedback Banner */}
      {deployResult && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-cyan-950/60 border border-emerald-500/40 shadow-lg text-emerald-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-base">
                  Emergency Protocol Successfully Deployed to Flight Checklist!
                </h4>
                <p className="text-xs text-emerald-300/90 mt-1">
                  Injected {deployResult.deployed_tasks_count} clinical action items for{' '}
                  <span className="font-mono font-semibold text-white">{deployResult.protocol_title}</span>{' '}
                  into your mission checklist.
                </p>
                <div className="mt-2 text-[11px] font-mono text-slate-300 bg-black/40 px-3 py-1.5 rounded border border-emerald-500/20">
                  Recommended: <span className="text-cyan-300 font-bold">{deployResult.recommended_medication?.name}</span> ({deployResult.recommended_medication?.calculated_dose})
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wider uppercase font-mono shadow-md shadow-emerald-900/40 flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>View Daily Checklist</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Scenario Selector, Right Scenario Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Scenario Selector Column (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Emergency Scenarios ({playbooks.length})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Select to Review</span>
          </div>

          <div className="space-y-2.5">
            {playbooks.map((p) => {
              const isSelected = p.condition_key === selectedKey;
              return (
                <div
                  key={p.condition_key}
                  onClick={() => setSelectedKey(p.condition_key)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400/80 shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400/40'
                      : 'bg-[#0a1226]/80 hover:bg-slate-900/70 border-cyan-500/15 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      {p.category}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getUrgencyBadge(p.urgency_tier)}`}>
                      {p.urgency_tier}
                    </span>
                  </div>

                  <h3 className={`font-bold text-sm tracking-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {p.title}
                  </h3>

                  <div className="mt-2.5 flex items-center justify-between text-xs font-mono pt-2 border-t border-cyan-500/10">
                    <span className="text-[11px] text-cyan-400 flex items-center space-x-1">
                      <Pill className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="truncate max-w-[170px]">{p.primary_drug?.name}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {p.nasa_code}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Scenario Protocol & Pharmacopeia Viewer (7 cols) */}
        {activeProtocol && (
          <div className="lg:col-span-7 space-y-6">
            
            {/* Protocol Detail Header */}
            <div className="p-6 rounded-2xl bg-[#0a1226]/90 border border-cyan-500/25 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${getUrgencyBadge(activeProtocol.urgency_tier)}`}>
                    {activeProtocol.urgency_tier} PRIORITY
                  </span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {activeProtocol.nasa_code}
                  </span>
                </div>
                <span className="text-xs font-mono text-cyan-400">
                  {activeProtocol.category}
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {activeProtocol.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  {activeProtocol.description}
                </p>
              </div>
            </div>

            {/* Primary Medication Card */}
            {activeProtocol.primary_drug && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c1836] to-[#091329] border border-cyan-500/30 shadow-xl space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                        PRIMARY PHARMACOLOGICAL INTERVENTION
                      </div>
                      <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                        <span>{activeProtocol.primary_drug.name}</span>
                        {activeProtocol.primary_drug.brand_name && (
                          <span className="text-xs text-slate-400 font-normal">
                            ({activeProtocol.primary_drug.brand_name})
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                    {activeProtocol.primary_drug.drug_class}
                  </span>
                </div>

                {/* Live Calculated Dosage Callout */}
                <div className="p-4 rounded-xl bg-cyan-950/50 border border-cyan-400/40 shadow-inner space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Individualized Weight-Calculated Dose</span>
                    </span>
                    <span className="text-slate-400">Target: {astronautWeight} kg</span>
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-cyan-200 font-mono">
                    {activeProtocol.primary_drug.calculated_dose}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                    <span>Route: <strong className="text-slate-200">{activeProtocol.primary_drug.route}</strong></span>
                    <span>•</span>
                    <span>Standard Dose: <strong className="text-slate-200">{activeProtocol.primary_drug.standard_dose}</strong></span>
                    <span>•</span>
                    <span>Max 24h: <strong className="text-amber-300">{activeProtocol.primary_drug.max_24h_limit}</strong></span>
                  </div>
                </div>

                {/* Mechanism of Action */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-mono text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                    Pharmacodynamics & Mechanism of Action:
                  </span>
                  <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {activeProtocol.primary_drug.mechanism_of_action}
                  </p>
                </div>

                {/* Microgravity Spaceflight Advisory */}
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start space-x-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-mono text-amber-300 uppercase tracking-wide block mb-0.5">
                      Microgravity Physiological Advisory
                    </strong>
                    <p className="text-amber-200/90 leading-relaxed">
                      {activeProtocol.primary_drug.microgravity_advisory}
                    </p>
                  </div>
                </div>

                {/* Physical Stowage Kit Location */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/20 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Spacecraft Stowage Kit Location:</span>
                  </div>
                  <span className="font-mono text-cyan-300 font-semibold bg-cyan-950/70 px-3 py-1 rounded border border-cyan-500/30 text-right">
                    {activeProtocol.primary_drug.kit_location}
                  </span>
                </div>
              </div>
            )}

            {/* Secondary / Adjunct Medication (if present) */}
            {activeProtocol.secondary_drug && (
              <div className="p-4 rounded-xl bg-[#0a1226]/80 border border-cyan-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Pill className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                      Adjunct / Secondary Therapy: {activeProtocol.secondary_drug.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeProtocol.secondary_drug.drug_class}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-mono">Calculated Dose & Route:</span>
                    <span className="text-white font-mono font-semibold">{activeProtocol.secondary_drug.calculated_dose} ({activeProtocol.secondary_drug.route})</span>
                  </div>
                  <div className="bg-slate-900/70 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px] font-mono">Kit Location:</span>
                    <span className="text-cyan-300 font-mono">{activeProtocol.secondary_drug.kit_location}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step-by-Step Clinical Emergency Procedures */}
            <div className="p-6 rounded-2xl bg-[#0a1226]/90 border border-cyan-500/20 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Standardized Procedure Steps</span>
              </div>

              <div className="space-y-2.5">
                {activeProtocol.procedure_steps?.map((step, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center font-mono font-bold shrink-0 mt-0.5 text-[11px]">
                      {idx + 1}
                    </span>
                    <p className="text-slate-200 leading-relaxed font-sans">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* One-Click Injection / Deployment Action Panel */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#0a1532] to-[#071329] border-2 border-cyan-400/50 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span className="font-mono font-bold text-sm text-white tracking-wide uppercase">
                    Execute Emergency Protocol Injection
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                  Target Flight Day: Day 1
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Clinical Severity Rating (1-5):
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value={1}>1 - Mild / Watchful Waiting</option>
                    <option value={2}>2 - Moderate / Ambulatory Impairment</option>
                    <option value={3}>3 - Serious / Operational Restriction</option>
                    <option value={4}>4 - Severe / Incapacitating Colic or Injury</option>
                    <option value={5}>5 - Critical / Imminent Life Threat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Operational Medical Notes (Optional):
                  </label>
                  <input
                    type="text"
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="e.g. Acute flank pain post-workout, vitals elevated"
                    className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleDeploy}
                  disabled={deploying}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs font-mono tracking-wider uppercase shadow-lg shadow-cyan-950/80 transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
                >
                  {deploying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Deploying Tasks to Checklist...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-slate-950" />
                      <span>Deploy Emergency Protocol to Checklist</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
