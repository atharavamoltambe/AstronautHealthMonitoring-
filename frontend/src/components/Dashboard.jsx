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
import RadiationDosimeter from './RadiationDosimeter';

export default function Dashboard({ 
  missions, 
  activeMission, 
  activeDay, 
  vitalsSummary, 
  healthRecords = [],
  checklists, 
  onToggleChecklist,
  assessments, 
  onNavigate,
  onRefresh
}) {
  const latestAssessment = assessments?.[0];
  const isAssessmentNominal = latestAssessment?.result === 'no_flag';

  const completedChecklists = checklists?.filter(c => c.is_completed).length || 0;
  const totalChecklists = checklists?.length || 0;
  const checklistPercent = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;

  // Prioritize critical remedies and SPE emergency tasks to the very top
  const sortedChecklists = [...(checklists || [])].sort((a, b) => {
    // 1. Uncompleted items always before completed
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    // 2. Critical SPE or emergency items jump to the very top
    const aText = (a.task_name || '').toLowerCase();
    const bText = (b.task_name || '').toLowerCase();
    const aIsSpe = aText.includes('[critical spe]') || aText.includes('storm shelter');
    const bIsSpe = bText.includes('[critical spe]') || bText.includes('storm shelter');
    if (aIsSpe && !bIsSpe) return -1;
    if (!aIsSpe && bIsSpe) return 1;

    const aIsEmergency = aText.includes('administer') || aText.includes('[critical]');
    const bIsEmergency = bText.includes('administer') || bText.includes('[critical]');
    if (aIsEmergency && !bIsEmergency) return -1;
    if (!aIsEmergency && bIsEmergency) return 1;

    return 0;
  });

  const activeSpeTasksCount = checklists?.filter(
    (c) => !c.is_completed && c.task_name?.toLowerCase().includes('[critical spe]')
  ).length || 0;

  // Resolve absolute latest vital reading with immediate fallback precedence
  const getLatestVital = (type, fallback) => {
    const match = healthRecords?.find((r) => r.measurement_type === type);
    if (match && match.value !== undefined && match.value !== null) {
      return match.value;
    }
    if (vitalsSummary?.latest_metrics?.[type]?.value !== undefined) {
      return vitalsSummary.latest_metrics[type].value;
    }
    return fallback;
  };

  const hrValue = getLatestVital('heart_rate', 74);
  const spo2Value = getLatestVital('oxygen_saturation', 98.5);
  const tempValue = getLatestVital('body_temperature', 36.7);
  const waterValue = getLatestVital('water_intake', 2250);

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
                  {hrValue}
                </span>
                <span className="text-[11px] text-cyan-400 font-mono">bpm</span>
              </div>
              <span className="text-[10px] text-emerald-400 block mt-1">● NASA 50-100</span>
            </div>

            <div className="hud-card rounded-2xl p-4 border border-cyan-500/20">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Oxygen SpO2</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {spo2Value}
                </span>
                <span className="text-[11px] text-cyan-400 font-mono">%</span>
              </div>
              <span className="text-[10px] text-emerald-400 block mt-1">● NASA ≥95%</span>
            </div>

            <div className="hud-card rounded-2xl p-4 border border-cyan-500/20">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Core Temp</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {tempValue}
                </span>
                <span className="text-[11px] text-amber-400 font-mono">°C</span>
              </div>
              <span className="text-[10px] text-emerald-400 block mt-1">● 36.1 - 37.2°C</span>
            </div>

            <div className="hud-card rounded-2xl p-4 border border-cyan-500/20">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Hydration</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {waterValue}
                </span>
                <span className="text-[11px] text-blue-400 font-mono">mL</span>
              </div>
              <span className="text-[10px] text-emerald-400 block mt-1">● NASA ≥2000</span>
            </div>

          </div>

          {/* Deep-Space Radiation Dosimeter & SPE Defense Station */}
          <RadiationDosimeter 
            missionDayId={activeDay?.id} 
            onRefresh={onRefresh} 
          />

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
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Daily Flight Checklist</h3>
              </div>
              <div className="flex items-center space-x-2">
                {activeSpeTasksCount > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>SPE PRIORITY</span>
                  </span>
                )}
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                  {completedChecklists}/{totalChecklists} ({checklistPercent}%)
                </span>
              </div>
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
              {sortedChecklists && sortedChecklists.length > 0 ? (
                sortedChecklists.map((item) => {
                  const isSpeCritical = item.task_name?.toLowerCase().includes('[critical spe]');
                  const isEmergencyRx = !isSpeCritical && (
                    item.task_name?.toLowerCase().includes('administer') || 
                    item.task_name?.toLowerCase().includes('[critical]')
                  );

                  let cardStyle = 'bg-slate-900/60 hover:bg-slate-900 border-slate-800';
                  if (item.is_completed) {
                    cardStyle = 'bg-slate-950/70 border-cyan-500/30 opacity-70';
                  } else if (isSpeCritical) {
                    cardStyle = 'bg-rose-950/40 hover:bg-rose-950/60 border-rose-500/60 ring-1 ring-rose-500/30 shadow-md shadow-rose-950/50';
                  } else if (isEmergencyRx) {
                    cardStyle = 'bg-amber-950/30 hover:bg-amber-950/50 border-amber-500/50';
                  }

                  return (
                    <label
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer group select-none gap-2 ${cardStyle}`}
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.is_completed}
                          onChange={(e) => onToggleChecklist(item.id, e.target.checked)}
                          className={`w-4 h-4 rounded cursor-pointer mt-0.5 shrink-0 ${
                            isSpeCritical && !item.is_completed ? 'accent-rose-500' : 'accent-cyan-400'
                          }`}
                        />
                        <span className={`text-xs transition-colors break-words ${
                          item.is_completed 
                            ? 'line-through text-slate-500' 
                            : isSpeCritical 
                            ? 'text-rose-100 font-semibold' 
                            : 'text-slate-200 group-hover:text-white'
                        }`}>
                          {item.task_name}
                        </span>
                      </div>

                      {/* Priority Badges */}
                      <div className="shrink-0 flex items-center space-x-1">
                        {!item.is_completed && isSpeCritical && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase tracking-wider shrink-0 animate-pulse">
                            SPE SHELTER
                          </span>
                        )}
                        {!item.is_completed && isEmergencyRx && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider shrink-0">
                            EMERGENCY RX
                          </span>
                        )}
                        {item.is_mandatory && !isSpeCritical && !isEmergencyRx && (
                          <span className="text-[10px] font-mono text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                            NASA
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })
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

