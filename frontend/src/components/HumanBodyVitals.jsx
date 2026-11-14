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

const ORGAN_METRIC_MAP = {
  brain: 'sleep_duration',
  heart: 'heart_rate',
  lungs: 'oxygen_saturation',
  core: 'body_temperature',
  stomach: 'water_intake',
  legs: 'exercise_duration',
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
    const match = healthRecords?.find((r) => r.measurement_type === type);
    if (match && match.value !== undefined && match.value !== null) {
      return match.value;
    }
    if (vitalsSummary?.latest_metrics?.[type]?.value !== undefined) {
      return vitalsSummary.latest_metrics[type].value;
    }
    return fallback;
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

        <button
          onClick={() => setIsSymptomModalOpen(true)}
          className="self-start md:self-auto px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all hover:scale-105 cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>+ Report Symptom / SAMS</span>
        </button>
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
          <div className="relative flex justify-center items-center py-4">
            
            {/* Ambient Cyan Glow behind the silhouette */}
            <div className="absolute w-56 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Locked-ratio viewport for Silhouette + Aligned Hotspots */}
            <div className="relative w-56 sm:w-64 h-[420px] select-none">
              
              {/* Realistic Anatomical Astronaut Hologram SVG */}
              <svg 
                className="w-full h-full text-cyan-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.35)]" 
                viewBox="0 0 200 400" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Cranial / Head Silhouette */}
                <path
                  d="M 100 16 C 111 16 117 25 117 37 C 117 49 110 57 100 57 C 90 57 83 49 83 37 C 83 25 89 16 100 16 Z"
                  fill="url(#bodyGradient)"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeOpacity="0.85"
                />

                {/* Natural Human Body Contour (Shoulders, Arms, Torso, Hips, Legs) */}
                <path
                  d="M 100 60 C 102.0 60.7, 104.0 61.3, 106 62 C 109.3 63.7, 112.7 65.3, 116 67 C 122.0 70.0, 128.0 73.0, 134 76 C 137.3 80.7, 140.7 85.3, 144 90 C 145.3 96.7, 146.7 103.3, 148 110 C 147.3 120.0, 146.7 130.0, 146 140 C 145.0 151.7, 144.0 163.3, 143 175 C 142.0 185.0, 141.0 195.0, 140 205 C 139.3 210.7, 138.7 216.3, 138 222 C 136.0 221.3, 134.0 220.7, 132 220 C 132.7 213.3, 133.3 206.7, 134 200 C 134.7 190.0, 135.3 180.0, 136 170 C 135.7 160.0, 135.3 150.0, 135 140 C 132.3 130.0, 129.7 120.0, 127 110 C 126.0 116.7, 125.0 123.3, 124 130 C 122.7 138.3, 121.3 146.7, 120 155 C 121.7 165.0, 123.3 175.0, 125 185 C 125.0 195.0, 125.0 205.0, 125 215 C 124.0 228.3, 123.0 241.7, 122 255 C 121.0 263.3, 120.0 271.7, 119 280 C 119.7 290.0, 120.3 300.0, 121 310 C 119.7 321.7, 118.3 333.3, 117 345 C 116.3 351.7, 115.7 358.3, 115 365 C 115.7 370.0, 116.3 375.0, 117 380 C 114.0 380.0, 111.0 380.0, 108 380 C 107.3 375.0, 106.7 370.0, 106 365 C 106.3 358.3, 106.7 351.7, 107 345 C 107.7 333.3, 108.3 321.7, 109 310 C 108.3 300.0, 107.7 290.0, 107 280 C 106.7 270.0, 106.3 260.0, 106 250 C 105.3 240.0, 104.7 230.0, 104 220 C 102.7 212.7, 101.3 205.3, 100 198 C 98.7 205.3, 97.3 212.7, 96 220 C 95.3 230.0, 94.7 240.0, 94 250 C 93.7 260.0, 93.3 270.0, 93 280 C 92.3 290.0, 91.7 300.0, 91 310 C 91.7 321.7, 92.3 333.3, 93 345 C 93.3 351.7, 93.7 358.3, 94 365 C 93.3 370.0, 92.7 375.0, 92 380 C 89.0 380.0, 86.0 380.0, 83 380 C 83.7 375.0, 84.3 370.0, 85 365 C 84.3 358.3, 83.7 351.7, 83 345 C 81.7 333.3, 80.3 321.7, 79 310 C 79.7 300.0, 80.3 290.0, 81 280 C 80.0 271.7, 79.0 263.3, 78 255 C 77.0 241.7, 76.0 228.3, 75 215 C 75.0 205.0, 75.0 195.0, 75 185 C 76.7 175.0, 78.3 165.0, 80 155 C 78.7 146.7, 77.3 138.3, 76 130 C 75.0 123.3, 74.0 116.7, 73 110 C 70.3 120.0, 67.7 130.0, 65 140 C 64.7 150.0, 64.3 160.0, 64 170 C 64.7 180.0, 65.3 190.0, 66 200 C 66.7 206.7, 67.3 213.3, 68 220 C 66.0 220.7, 64.0 221.3, 62 222 C 61.3 216.3, 60.7 210.7, 60 205 C 59.0 195.0, 58.0 185.0, 57 175 C 56.0 163.3, 55.0 151.7, 54 140 C 53.3 130.0, 52.7 120.0, 52 110 C 53.3 103.3, 54.7 96.7, 56 90 C 59.3 85.3, 62.7 80.7, 66 76 C 72.0 73.0, 78.0 70.0, 84 67 C 87.3 65.3, 90.7 63.7, 94 62 C 96.0 61.3, 98.0 60.7, 100 60 Z"
                  fill="url(#bodyGradient)"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeOpacity="0.85"
                />

                {/* Subtle Anatomical HUD Guidelines */}
                <path d="M 86 74 Q 100 78 114 74" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.45" fill="none" />
                <line x1="100" y1="78" x2="100" y2="125" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="2 2" />
                <path d="M 80 110 Q 90 120 98 116" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.35" fill="none" />
                <path d="M 120 110 Q 110 120 102 116" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.35" fill="none" />
                <path d="M 85 142 Q 100 135 115 142" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.3" fill="none" />
                <path d="M 82 188 Q 100 195 118 188" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.35" fill="none" />

                {/* Holographic Scanning Line */}
                <line x1="25" y1="195" x2="175" y2="195" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" className="animate-pulse" />

                {/* Gradients */}
                <defs>
                  <linearGradient id="bodyGradient" x1="100" y1="15" x2="100" y2="390" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0284c7" stopOpacity="0.35" />
                    <stop offset="0.5" stopColor="#0369a1" stopOpacity="0.22" />
                    <stop offset="1" stopColor="#082f49" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Clickable Organ Hotspots (Precisely anchored to anatomy) */}
              
              {/* 1. BRAIN HOTSPOT (Cranial / Head) */}
              <button
                onClick={() => setSelectedOrgan('brain')}
                className={`absolute top-[9%] left-[50%] -translate-x-1/2 -translate-y-1/2 p-2 rounded-full border transition-all duration-200 cursor-pointer ${
                  selectedOrgan === 'brain' 
                    ? 'bg-cyan-400 text-slate-950 scale-125 border-white shadow-[0_0_15px_#38bdf8]' 
                    : 'bg-slate-900/80 text-cyan-400 border-cyan-400/50 hover:scale-110'
                }`}
                title="Cranial / Brain Telemetry"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping absolute inset-2 opacity-50"></div>
                <Activity className="w-4 h-4 relative z-10" />
              </button>

              {/* 2. HEART HOTSPOT (Left Chest / Cardiovascular) */}
              <button
                onClick={() => setSelectedOrgan('heart')}
                className={`absolute top-[28%] left-[43%] -translate-x-1/2 -translate-y-1/2 p-2 rounded-full border transition-all duration-200 cursor-pointer ${
                  selectedOrgan === 'heart' 
                    ? 'bg-red-500 text-white scale-125 border-white shadow-[0_0_15px_#ef4444]' 
                    : 'bg-slate-900/80 text-red-400 border-red-400/50 hover:scale-110'
                }`}
                title="Cardiovascular / Heart Telemetry"
              >
                <Heart className="w-4 h-4 fill-current" />
              </button>

              {/* 3. LUNGS HOTSPOT (Right Chest / SpO2) */}
              <button
                onClick={() => setSelectedOrgan('lungs')}
                className={`absolute top-[28%] left-[57%] -translate-x-1/2 -translate-y-1/2 p-2 rounded-full border transition-all duration-200 cursor-pointer ${
                  selectedOrgan === 'lungs' 
                    ? 'bg-cyan-400 text-slate-950 scale-125 border-white shadow-[0_0_15px_#38bdf8]' 
                    : 'bg-slate-900/80 text-cyan-400 border-cyan-400/50 hover:scale-110'
                }`}
                title="Pulmonary / SpO2 Telemetry"
              >
                <LungsIcon className="w-4 h-4" />
              </button>

              {/* 4. CORE HOTSPOT (Solar Plexus / Thermoregulation) */}
              <button
                onClick={() => setSelectedOrgan('core')}
                className={`absolute top-[38%] left-[50%] -translate-x-1/2 -translate-y-1/2 p-2 rounded-full border transition-all duration-200 cursor-pointer ${
                  selectedOrgan === 'core' 
                    ? 'bg-amber-400 text-slate-950 scale-125 border-white shadow-[0_0_15px_#f59e0b]' 
                    : 'bg-slate-900/80 text-amber-400 border-amber-400/50 hover:scale-110'
                }`}
                title="Core Body Thermoregulation"
              >
                <Thermometer className="w-4 h-4" />
              </button>

              {/* 5. STOMACH / HYDRATION HOTSPOT (Abdomen / Gastrointestinal) */}
              <button
                onClick={() => setSelectedOrgan('stomach')}
                className={`absolute top-[46.5%] left-[50%] -translate-x-1/2 -translate-y-1/2 p-2 rounded-full border transition-all duration-200 cursor-pointer ${
                  selectedOrgan === 'stomach' 
                    ? 'bg-blue-400 text-slate-950 scale-125 border-white shadow-[0_0_15px_#60a5fa]' 
                    : 'bg-slate-900/80 text-blue-400 border-blue-400/50 hover:scale-110'
                }`}
                title="Digestive & Hydration Intake"
              >
                <Droplets className="w-4 h-4 fill-current" />
              </button>

              {/* 6. LEGS / EXERCISE HOTSPOT (Quadriceps / Countermeasures) */}
              <button
                onClick={() => setSelectedOrgan('legs')}
                className={`absolute top-[67%] left-[50%] -translate-x-1/2 -translate-y-1/2 p-2 rounded-full border transition-all duration-200 cursor-pointer ${
                  selectedOrgan === 'legs' 
                    ? 'bg-emerald-400 text-slate-950 scale-125 border-white shadow-[0_0_15px_#34d399]' 
                    : 'bg-slate-900/80 text-emerald-400 border-emerald-400/50 hover:scale-110'
                }`}
                title="Musculoskeletal Countermeasures"
              >
                <Dumbbell className="w-4 h-4" />
              </button>

            </div>
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
          <div 
            onClick={() => setSelectedOrgan('heart')}
            className={`hud-card rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer ${
              selectedOrgan === 'heart' ? 'border-cyan-400 bg-cyan-950/20' : 'hover:border-cyan-400/40'
            }`}
          >
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
          <div 
            onClick={() => setSelectedOrgan('lungs')}
            className={`hud-card rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer ${
              selectedOrgan === 'lungs' ? 'border-cyan-400 bg-cyan-950/20' : 'hover:border-cyan-400/40'
            }`}
          >
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
          <div 
            onClick={() => setSelectedOrgan('core')}
            className={`hud-card rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer ${
              selectedOrgan === 'core' ? 'border-cyan-400 bg-cyan-950/20' : 'hover:border-cyan-400/40'
            }`}
          >
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
          <div 
            onClick={() => setSelectedOrgan('brain')}
            className={`hud-card rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer ${
              selectedOrgan === 'brain' ? 'border-cyan-400 bg-cyan-950/20' : 'hover:border-cyan-400/40'
            }`}
          >
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
          <div 
            onClick={() => setSelectedOrgan('stomach')}
            className={`hud-card rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer ${
              selectedOrgan === 'stomach' ? 'border-cyan-400 bg-cyan-950/20' : 'hover:border-cyan-400/40'
            }`}
          >
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

          {/* 6. Physical Exercise Duration */}
          <div 
            onClick={() => setSelectedOrgan('legs')}
            className={`hud-card rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer ${
              selectedOrgan === 'legs' ? 'border-cyan-400 bg-cyan-950/20' : 'hover:border-cyan-400/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatus('exercise_duration', exerciseValue).color}`}>
                {getStatus('exercise_duration', exerciseValue).text}
              </span>
            </div>
            
            <div className="mt-4">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white font-mono">{exerciseValue}</span>
                <span className="text-xs text-emerald-400 font-mono">min</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Physical Countermeasures</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>NASA Protocol: ≥60 min</span>
                <span className="text-emerald-400 font-mono">Compliant</span>
              </div>
              <MiniSparkline trend="stable" color="#34d399" />
            </div>
          </div>

        </div>
      </div>

      {/* Vital Sign Modal */}
      <LogVitalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        missionDayId={missionDayId}
        initialMetricType={ORGAN_METRIC_MAP[selectedOrgan] || 'heart_rate'}
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
