import React from 'react';
import { 
  Globe, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Radio, 
  Calendar, 
  CheckSquare, 
  Clock, 
  Compass, 
  Satellite, 
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  User
} from 'lucide-react';

export default function Dashboard({ 
  missions, 
  activeMission, 
  activeDay, 
  vitalsSummary, 
  checklists, 
  onToggleChecklist,
  assessments, 
  onNavigate 
}) {
  const latestAssessment = assessments?.[0];
  const isAssessmentNominal = latestAssessment?.result === 'no_flag';

  const completedChecklists = checklists?.filter(c => c.is_completed).length || 0;
  const totalChecklists = checklists?.length || 0;
  const checklistPercent = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner: Mission Control Header (Image 1 style) */}
      <div className="hud-card-active rounded-2xl p-6 border border-cyan-500/30 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Mission Identity */}
          <div className="flex items-start space-x-4">
            <div className="p-3.5 bg-gradient-to-br from-cyan-950 to-blue-900 border border-cyan-400/50 rounded-2xl text-cyan-300 shadow-lg shadow-cyan-950">
              <Satellite className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-extrabold tracking-tight text-white font-mono">
                  {activeMission?.name || 'NOVAGUARD-01'}
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 tracking-wider">
                  OPERATIONAL // ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {activeMission?.description || 'Long-Duration Lunar Surface & Microgravity Telemetry Expedition'}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>FLIGHT DAY: <strong className="text-cyan-300">{activeDay?.day_number || 1}</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>UTC: {new Date().toLocaleTimeString()}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-emerald-400 font-semibold">UPLINK: LOCKED (8.4 GHz)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('scanner')}
              className="px-4 py-2.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 hover:text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>Open Body Scanner</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigate('ai')}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold tracking-wider uppercase shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              <span>AI Flight Surgeon</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Grid: Telemetry Summary Gauges & Flight Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Real-Time Telemetry Overview */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="hud-card rounded-2xl p-4 border border-cyan-500/20">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Heart Rate</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {vitalsSummary?.heart_rate?.latest || 74}
                </span>
                <span className="text-[11px] text-cyan-400 font-mono">bpm</span>
              </div>
              <span className="text-[10px] text-emerald-400 block mt-1">● NASA 50-100</span>
            </div>

            <div className="hud-card rounded-2xl p-4 border border-cyan-500/20">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Oxygen SpO2</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {vitalsSummary?.oxygen_saturation?.latest || 98.5}
                </span>
                <span className="text-[11px] text-cyan-400 font-mono">%</span>
              </div>
              <span className="text-[10px] text-emerald-400 block mt-1">● NASA ≥95%</span>
            </div>

            <div className="hud-card rounded-2xl p-4 border border-cyan-500/20">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Core Temp</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {vitalsSummary?.body_temperature?.latest || 36.7}
                </span>
                <span className="text-[11px] text-amber-400 font-mono">°C</span>
              </div>
              <span className="text-[10px] text-emerald-400 block mt-1">● 36.1 - 37.2°C</span>
            </div>

            <div className="hud-card rounded-2xl p-4 border border-cyan-500/20">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Hydration</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {vitalsSummary?.water_intake?.latest || 2250}
                </span>
                <span className="text-[11px] text-blue-400 font-mono">mL</span>
              </div>
              <span className="text-[10px] text-emerald-400 block mt-1">● NASA ≥2000</span>
            </div>

          </div>

          {/* AI Briefing Snapshot Card */}
          <div className="hud-card rounded-2xl p-6 border border-cyan-500/20 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Latest Edge AI Flight Surgeon Briefing
                </h3>
              </div>
              <button
                onClick={() => onNavigate('ai')}
                className="text-xs text-cyan-400 hover:text-white flex items-center space-x-1 font-mono cursor-pointer"
              >
                <span>View Full AI Panel</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {latestAssessment?.details?.ai_summary ? (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                {latestAssessment.details.ai_summary}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400">
                Click <button onClick={() => onNavigate('ai')} className="text-cyan-400 underline font-semibold">AI Assessment</button> to run the NASA-STD-3001 evaluation with your local model.
              </div>
            )}
          </div>

        </div>

        {/* Right Column (4 cols): Flight Day Checklist & Mission Timeline */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Flight Day Checklist */}
          <div className="hud-card rounded-2xl p-6 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Daily Flight Checklist</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                {completedChecklists}/{totalChecklists} ({checklistPercent}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-4">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${checklistPercent}%` }}
              ></div>
            </div>

            {/* Tasks List */}
            <div className="space-y-2.5">
              {checklists && checklists.length > 0 ? (
                checklists.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onToggleChecklist(item.id, !item.is_completed)}
                    className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={() => {}}
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      />
                      <span className={`text-xs ${
                        item.is_completed ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}>
                        {item.task_name}
                      </span>
                    </div>
                    {item.is_mandatory && (
                      <span className="text-[10px] font-mono text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                        NASA
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No checklist items loaded for Flight Day.
                </p>
              )}
            </div>
          </div>

          {/* Mission Telemetry Link Health */}
          <div className="hud-card rounded-2xl p-6 border border-cyan-500/20 text-xs space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Spaceflight Architecture Status</span>
            </h4>
            <div className="space-y-2 text-slate-300 font-mono text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Decision Engine:</span>
                <span className="text-emerald-400">NASA-STD-3001 Active</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Edge LLM Host:</span>
                <span className="text-cyan-400">Ollama (localhost:11434)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Database Security:</span>
                <span className="text-emerald-400">Supabase RLS Active</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Identity Context:</span>
                <span className="text-cyan-400">JWT Verified (sub)</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

