import React, { useState } from 'react';
import { 
  Heart, 
  Activity, 
  Thermometer, 
  Moon, 
  Droplets, 
  Dumbbell, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ChevronRight, 
  ShieldCheck 
} from 'lucide-react';
import LogVitalModal from './LogVitalModal';
import LogSymptomModal from './LogSymptomModal';

function LungsIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v7" />
      <path d="M12 11c-2-2-4-2-6 0v5c0 3 2 5 6 5" />
      <path d="M12 11c2-2 4-2 6 0v5c0 3-2 5-6 5" />
    </svg>
  );
}

// NASA-STD-3001 physiological bounds
const NASA_BOUNDS = {
  heart_rate: { min: 50, max: 100, unit: 'bpm', name: 'Heart Rate', organ: 'heart' },
  oxygen_saturation: { min: 95, max: 100, unit: '%', name: 'Blood Oxygen (SpO2)', organ: 'lungs' },
  body_temperature: { min: 36.1, max: 37.2, unit: '°C', name: 'Core Temperature', organ: 'core' },
  sleep_duration: { min: 7.0, max: 9.0, unit: 'hrs', name: 'Sleep Rest Cycle', organ: 'brain' },
  water_intake: { min: 2000, max: 3000, unit: 'mL', name: 'Hydration Level', organ: 'stomach' },
  exercise_duration: { min: 60, max: 150, unit: 'min', name: 'Countermeasure Exercise', organ: 'legs' },
};

// Synthetic SVG sparkline generator
function MiniSparkline({ trend = 'stable', color = '#38bdf8' }) {
  let points = '0,18 20,15 40,20 60,10 80,14 100,8 120,12 140,5';
  if (trend === 'rising') {
    points = '0,22 20,20 40,16 60,18 80,12 100,9 120,6 140,2';
  } else if (trend === 'falling') {
    points = '0,4 20,8 40,10 60,14 80,12 100,18 120,20 140,24';
  }

  return (
    <svg className="w-full h-8 overflow-visible" viewBox="0 0 140 28" fill="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle cx="140" cy={points.split(' ').pop().split(',')[1]} r="3" fill={color} className="animate-ping" />
      <circle cx="140" cy={points.split(' ').pop().split(',')[1]} r="3" fill={color} />
    </svg>
  );
}

export default function HumanBodyVitals({ missionDayId, vitalsSummary, healthRecords, onRefresh }) {
  const [selectedOrgan, setSelectedOrgan] = useState('heart');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);

  // Extract latest vitals from records or summary
  const getLatestValue = (type, fallback) => {
    if (vitalsSummary && vitalsSummary[type]) {
      return vitalsSummary[type].latest;
    }
    const match = healthRecords?.find((r) => r.measurement_type === type);
    return match ? match.value : fallback;
  };

  const hrValue = getLatestValue('heart_rate', 74);
  const spo2Value = getLatestValue('oxygen_saturation', 98.5);
  const tempValue = getLatestValue('body_temperature', 36.7);
  const sleepValue = getLatestValue('sleep_duration', 7.5);
  const waterValue = getLatestValue('water_intake', 2250);
  const exerciseValue = getLatestValue('exercise_duration', 65);

  const getStatus = (type, val) => {
    const bound = NASA_BOUNDS[type];
    if (!bound || val === undefined || val === null) return { text: 'Nominal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (val < bound.min || val > bound.max) {
      return { text: 'Caution', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    }
    return { text: 'Nominal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  const organData = {
    brain: {
      name: 'Cephalic & Neurological System',
      description: 'Monitors microgravity cephalic fluid shift, intracranial pressure indicators, and REM sleep architecture.',
      metric: 'Rest Period Duration',
      value: `${sleepValue} hrs`,
      status: getStatus('sleep_duration', sleepValue),
      standard: 'NASA-STD-3001 Vol 1 §4.7 (≥7.0 hrs rest)',
      recommendation: 'Circadian lighting synchronization active. Maintain sleep station airflow.',
    },
    heart: {
      name: 'Cardiovascular System',
      description: 'Tracks resting pulse, stroke volume adaptation, and cardiovascular orthostatic deconditioning risks.',
      metric: 'Resting Heart Rate',
      value: `${hrValue} bpm`,
      status: getStatus('heart_rate', hrValue),
      standard: 'NASA-STD-3001 Vol 1 §4.2 (50 - 100 bpm nominal)',
      recommendation: 'Cardiovascular tone nominal. Continue scheduled cycle ergometer sessions.',
    },
    lungs: {
      name: 'Pulmonary & Gas Exchange',
      description: 'Assesses peripheral oxygenation (SpO2) and cabin atmospheric gas equilibrium (ppO2 / ppCO2).',
      metric: 'Oxygen Saturation SpO2',
      value: `${spo2Value} %`,
      status: getStatus('oxygen_saturation', spo2Value),
      standard: 'NASA-STD-3001 Vol 2 §6.2 (≥95% SpO2)',
      recommendation: 'Cabin oxygen partial pressure optimal. Pulmonary exchange within nominal limits.',
    },
    core: {
      name: 'Thermoregulatory Core',
      description: 'Monitors core body temperature in microgravity to detect heat-storage syndrome during EVA workloads.',
      metric: 'Core Body Temperature',
      value: `${tempValue} °C`,
      status: getStatus('body_temperature', tempValue),
      standard: 'NASA Spaceflight Thermoregulation (36.1°C - 37.2°C)',
      recommendation: 'Suit liquid cooling ventilation garment (LCVG) nominal.',
    },
    stomach: {
      name: 'Gastrointestinal & Fluid Shift',
      description: 'Tracks Space Adaptation Syndrome (SAS/SAMS), vestibular nausea, and fluid consumption compliance.',
      metric: 'Hydration Intake',
      value: `${waterValue} mL`,
      status: getStatus('water_intake', waterValue),
      standard: 'NASA-STD-3001 Vol 1 §4.5 (≥2000 mL/day)',
      recommendation: 'Electrolyte balance maintained. Pace oral fluid rehydration before workout.',
    },
    legs: {
      name: 'Musculoskeletal & Countermeasures',
      description: 'Monitors resistance and aerobic training volume to prevent microgravity bone mineral and muscle mass loss.',
      metric: 'Daily Countermeasure Exercise',
      value: `${exerciseValue} min`,
      status: getStatus('exercise_duration', exerciseValue),
      standard: 'NASA Countermeasure Protocol (≥60 min aerobic/ARED)',
      recommendation: 'T2 Treadmill and ARED resistive sessions logged on flight plan.',
    },
  };

  const currentOrganInfo = organData[selectedOrgan];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Page Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">
              Holographic Diagnostic Array
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            Human Physiological & Vital Sign Scanner
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Interactive anatomical telemetry mapped against official NASA-STD-3001 aerospace standards
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>+ Log Vital Reading</span>
          </button>

          <button
            onClick={() => setIsSymptomModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all hover:scale-105 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>+ Report Symptom / SAMS</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE HOLOGRAPHIC HUMAN BODY (Image 2 style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Interactive Holographic Human Scanner */}
        <div className="lg:col-span-7 hud-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between border border-cyan-500/20">
          {/* Subtle cyber background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>
          
          <div className="flex items-center justify-between relative z-10 mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono tracking-wider text-cyan-300 uppercase">
                Biosensor Map // Full Body Telemetry
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
              SYS VERIFIED: 100%
            </span>
          </div>

          {/* Holographic Body Silhouette with Hotspots */}
          <div className="relative flex justify-center items-center py-6">
            
            {/* Ambient Cyan Glow behind the silhouette */}
            <div className="absolute w-48 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Futuristic SVG Human Figure */}
            <svg 
              className="w-44 md:w-56 h-[380px] text-cyan-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.35)] select-none" 
              viewBox="0 0 200 400" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Silhouette Body Path */}
              <path
                d="M100 15 C108 15 115 22 115 32 C115 42 108 48 100 48 C92 48 85 42 85 32 C85 22 92 15 100 15 Z
                   M88 52 C78 58 66 65 58 80 C50 95 44 125 40 155 C37 180 43 185 48 185 C53 185 55 175 58 150 C62 125 68 95 75 80 L75 145 C75 170 78 200 82 225 L75 310 C72 345 70 375 66 385 C64 390 73 392 78 392 C84 392 88 382 92 345 L97 250 L103 250 L108 345 C112 382 116 392 122 392 C127 392 136 390 134 385 C130 375 128 345 125 310 L118 225 C122 200 125 170 125 145 L125 80 C132 95 138 125 142 150 C145 175 147 185 152 185 C157 185 163 180 160 155 C156 125 150 95 142 80 C134 65 122 58 112 52 Z"
                fill="url(#bodyGradient)"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.8"
              />

              {/* Holographic scanning horizontal line */}
              <line x1="20" y1="200" x2="180" y2="200" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" className="animate-pulse" />

              {/* Gradients */}
              <defs>
                <linearGradient id="bodyGradient" x1="100" y1="15" x2="100" y2="395" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0284c7" stopOpacity="0.4" />
                  <stop offset="0.5" stopColor="#0369a1" stopOpacity="0.25" />
                  <stop offset="1" stopColor="#082f49" stopOpacity="0.45" />
                </linearGradient>
              </defs>
            </svg>

            {/* Clickable Organ Hotspots */}
            
            {/* 1. BRAIN HOTSPOT */}
            <button
              onClick={() => setSelectedOrgan('brain')}
              className={`absolute top-10 left-[48%] -translate-x-1/2 p-2 rounded-full border transition-all duration-200 cursor-pointer ${
                selectedOrgan === 'brain' 
                  ? 'bg-cyan-400 text-slate-950 scale-125 border-white shadow-[0_0_15px_#38bdf8]' 
                  : 'bg-slate-900/80 text-cyan-400 border-cyan-400/50 hover:scale-110'
              }`}
              title="Cranial / Brain Telemetry"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping absolute inset-2 opacity-50"></div>
              <Activity className="w-4 h-4 relative z-10" />
            </button>

            {/* 2. HEART HOTSPOT */}
            <button
              onClick={() => setSelectedOrgan('heart')}
              className={`absolute top-28 left-[45%] -translate-x-1/2 p-2 rounded-full border transition-all duration-200 cursor-pointer ${
                selectedOrgan === 'heart' 
                  ? 'bg-red-500 text-white scale-125 border-white shadow-[0_0_15px_#ef4444]' 
                  : 'bg-slate-900/80 text-red-400 border-red-400/50 hover:scale-110'
              }`}
              title="Cardiovascular / Heart Telemetry"
            >
              <Heart className="w-4 h-4 fill-current" />
            </button>

            {/* 3. LUNGS HOTSPOT */}
            <button
              onClick={() => setSelectedOrgan('lungs')}
              className={`absolute top-32 left-[55%] -translate-x-1/2 p-2 rounded-full border transition-all duration-200 cursor-pointer ${
                selectedOrgan === 'lungs' 
                  ? 'bg-cyan-400 text-slate-950 scale-125 border-white shadow-[0_0_15px_#38bdf8]' 
                  : 'bg-slate-900/80 text-cyan-400 border-cyan-400/50 hover:scale-110'
              }`}
              title="Pulmonary / SpO2 Telemetry"
            >
              <LungsIcon className="w-4 h-4" />
            </button>

            {/* 4. CORE HOTSPOT */}
            <button
              onClick={() => setSelectedOrgan('core')}
              className={`absolute top-44 left-[49%] -translate-x-1/2 p-2 rounded-full border transition-all duration-200 cursor-pointer ${
                selectedOrgan === 'core' 
                  ? 'bg-amber-400 text-slate-950 scale-125 border-white shadow-[0_0_15px_#f59e0b]' 
                  : 'bg-slate-900/80 text-amber-400 border-amber-400/50 hover:scale-110'
              }`}
              title="Core Body Thermoregulation"
            >
              <Thermometer className="w-4 h-4" />
            </button>

            {/* 5. STOMACH / HYDRATION HOTSPOT */}
            <button
              onClick={() => setSelectedOrgan('stomach')}
              className={`absolute top-56 left-[49%] -translate-x-1/2 p-2 rounded-full border transition-all duration-200 cursor-pointer ${
                selectedOrgan === 'stomach' 
                  ? 'bg-blue-400 text-slate-950 scale-125 border-white shadow-[0_0_15px_#60a5fa]' 
                  : 'bg-slate-900/80 text-blue-400 border-blue-400/50 hover:scale-110'
              }`}
              title="Digestive & Hydration Intake"
            >
              <Droplets className="w-4 h-4 fill-current" />
            </button>

            {/* 6. LEGS / EXERCISE HOTSPOT */}
            <button
              onClick={() => setSelectedOrgan('legs')}
              className={`absolute bottom-20 left-[49%] -translate-x-1/2 p-2 rounded-full border transition-all duration-200 cursor-pointer ${
                selectedOrgan === 'legs' 
                  ? 'bg-emerald-400 text-slate-950 scale-125 border-white shadow-[0_0_15px_#34d399]' 
                  : 'bg-slate-900/80 text-emerald-400 border-emerald-400/50 hover:scale-110'
              }`}
              title="Musculoskeletal Countermeasures"
            >
              <Dumbbell className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Hotspot Select Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-cyan-500/15">
            {['brain', 'heart', 'lungs', 'core', 'stomach', 'legs'].map((organ) => (
              <button
                key={organ}
                onClick={() => setSelectedOrgan(organ)}
                className={`text-[11px] font-mono uppercase px-2.5 py-1 rounded-lg transition-all ${
                  selectedOrgan === organ
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-sm'
                    : 'text-slate-400 bg-slate-900/50 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {organ}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Organ Focused Diagnostic Card */}
        <div className="lg:col-span-5 hud-card-active rounded-2xl p-6 flex flex-col justify-between border border-cyan-500/30">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase">
                Anatomical Node Telemetry
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${currentOrganInfo.status.color}`}>
                {currentOrganInfo.status.text}
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mt-2 flex items-center space-x-2">
              <span>{currentOrganInfo.name}</span>
            </h3>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {currentOrganInfo.description}
            </p>

            {/* Metric Display Box */}
            <div className="mt-6 p-4 rounded-xl bg-slate-950/70 border border-cyan-500/20">
              <span className="text-[11px] uppercase tracking-wider text-slate-400">
                {currentOrganInfo.metric}
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-cyan-300 font-mono tracking-tight">
                  {currentOrganInfo.value}
                </span>
                <span className="text-xs text-slate-400 font-mono">Real-time telemetry</span>
              </div>
            </div>

            {/* NASA Baseline Standard Tag */}
            <div className="mt-4 p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-blue-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Reference Guideline</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                {currentOrganInfo.standard}
              </p>
            </div>

            {/* Flight Surgeon Recommendation */}
            <div className="mt-4 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs">
              <span className="text-cyan-400 font-semibold block mb-1 text-[11px]">Surgeon Countermeasure Note:</span>
              <p className="text-slate-300 text-[11px]">
                {currentOrganInfo.recommendation}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full mt-6 py-2.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 hover:text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Update {currentOrganInfo.name} Reading</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SECTION 2: VITAL SIGNS TRACKER CARDS (Image 3 style) */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>Vital Signs Tracker</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous aerospace telemetry with NASA-STD-3001 threshold classification
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full">
            Telemetry Feed: ACTIVE
          </span>
        </div>

        {/* Vital Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* 1. Heart Rate */}
          <div className="hud-card rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-cyan-400/40">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatus('heart_rate', hrValue).color}`}>
                {getStatus('heart_rate', hrValue).text}
              </span>
            </div>
            
            <div className="mt-4">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white font-mono">{hrValue}</span>
                <span className="text-xs text-cyan-400 font-mono">bpm</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Resting Heart Rate</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>NASA Limit: 50-100</span>
                <span className="text-cyan-400 font-mono">Nominal</span>
              </div>
              <MiniSparkline trend="stable" color="#ef4444" />
            </div>
          </div>

          {/* 2. Blood Oxygen SpO2 */}
          <div className="hud-card rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-cyan-400/40">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
                <LungsIcon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatus('oxygen_saturation', spo2Value).color}`}>
                {getStatus('oxygen_saturation', spo2Value).text}
              </span>
            </div>
            
            <div className="mt-4">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white font-mono">{spo2Value}</span>
                <span className="text-xs text-cyan-400 font-mono">%</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Blood Oxygen (SpO2)</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>NASA Limit: ≥95%</span>
                <span className="text-cyan-400 font-mono">Optimal</span>
              </div>
              <MiniSparkline trend="rising" color="#38bdf8" />
            </div>
          </div>

          {/* 3. Core Temperature */}
          <div className="hud-card rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-cyan-400/40">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400">
                <Thermometer className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatus('body_temperature', tempValue).color}`}>
                {getStatus('body_temperature', tempValue).text}
              </span>
            </div>
            
            <div className="mt-4">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white font-mono">{tempValue}</span>
                <span className="text-xs text-amber-400 font-mono">°C</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Core Body Temperature</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>NASA Limit: 36.1-37.2°C</span>
                <span className="text-amber-400 font-mono">Nominal</span>
              </div>
              <MiniSparkline trend="stable" color="#f59e0b" />
            </div>
          </div>

          {/* 4. Sleep Rest Period */}
          <div className="hud-card rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-cyan-400/40">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-400">
                <Moon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatus('sleep_duration', sleepValue).color}`}>
                {getStatus('sleep_duration', sleepValue).text}
              </span>
            </div>
            
            <div className="mt-4">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white font-mono">{sleepValue}</span>
                <span className="text-xs text-indigo-400 font-mono">hrs</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Rest Duration</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>NASA Limit: ≥7.0 hrs</span>
                <span className="text-indigo-400 font-mono">Sufficient</span>
              </div>
              <MiniSparkline trend="falling" color="#818cf8" />
            </div>
          </div>

          {/* 5. Hydration Level */}
          <div className="hud-card rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-cyan-400/40">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-400">
                <Droplets className="w-5 h-5 fill-current" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatus('water_intake', waterValue).color}`}>
                {getStatus('water_intake', waterValue).text}
              </span>
            </div>
            
            <div className="mt-4">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white font-mono">{waterValue}</span>
                <span className="text-xs text-blue-400 font-mono">mL</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Hydration Consumed</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>NASA Target: ≥2000 mL</span>
                <span className="text-blue-400 font-mono">Balanced</span>
              </div>
              <MiniSparkline trend="rising" color="#60a5fa" />
            </div>
          </div>

          {/* 6. Action Card: + Log New Reading (Image 3 style) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="hud-card rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/80 bg-cyan-950/10 hover:bg-cyan-950/20 text-cyan-300 transition-all group cursor-pointer"
          >
            <div className="p-3 rounded-full bg-cyan-500/15 border border-cyan-400/40 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-cyan-300" />
            </div>
            <span className="mt-3 text-sm font-bold tracking-wide text-white group-hover:text-cyan-300">
              + Log New Reading
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              Manual entry or telemetry sync
            </span>
          </button>

        </div>
      </div>

      {/* Vital Sign Modal */}
      <LogVitalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        missionDayId={missionDayId}
        onRecordCreated={onRefresh}
      />

      {/* Dedicated Symptom / SAMS Modal */}
      <LogSymptomModal
        isOpen={isSymptomModalOpen}
        onClose={() => setIsSymptomModalOpen(false)}
        missionDayId={missionDayId}
        onSymptomCreated={onRefresh}
      />
    </div>
  );
}
