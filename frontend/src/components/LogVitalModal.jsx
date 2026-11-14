import React, { useState } from 'react';
import { X, Activity, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { createHealthRecord, createSymptomLog } from '../services/api';

const METRIC_UNITS = {
  heart_rate: 'bpm',
  oxygen_saturation: '%',
  body_temperature: '°C',
  sleep_duration: 'hours',
  water_intake: 'mL',
  exercise_duration: 'minutes',
};

const SYMPTOM_OPTIONS = [
  'Space Adaptation Motion Sickness',
  'Headache (Cephalic Fluid Shift)',
  'Nausea / Vestibular Disorientation',
  'Muscle Soreness / Fatigue',
  'Visual Disturbance (SANS)',
  'Insomnia / Sleep Disruption',
];

export default function LogVitalModal({ isOpen, onClose, missionDayId, onRecordCreated }) {
  const [tab, setTab] = useState('vital'); // 'vital' or 'symptom'
  
  // Vital state
  const [metricType, setMetricType] = useState('heart_rate');
  const [value, setValue] = useState('75');
  const [source, setSource] = useState('manual');
  const [notes, setNotes] = useState('');
  
  // Symptom state
  const [symptomType, setSymptomType] = useState(SYMPTOM_OPTIONS[0]);
  const [severity, setSeverity] = useState(2);
  const [symptomNotes, setSymptomNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmitVital = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        mission_day_id: missionDayId,
        measurement_type: metricType,
        value: parseFloat(value),
        unit: METRIC_UNITS[metricType],
        recorded_at: new Date().toISOString(),
        source,
        notes: notes.trim() || undefined,
      };
      await createHealthRecord(payload);
      if (onRecordCreated) onRecordCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit health record. Check validation bounds.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSymptom = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        mission_day_id: missionDayId,
        symptom_type: symptomType,
        severity: parseInt(severity, 10),
        reported_at: new Date().toISOString(),
        notes: symptomNotes.trim() || undefined,
      };
      await createSymptomLog(payload);
      if (onRecordCreated) onRecordCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to report symptom.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="hud-card-active rounded-2xl w-full max-w-lg p-6 bg-[#0a1226] border border-cyan-500/30 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-wide text-cyan-300">Space Telemetry Logger</h3>
              <p className="text-xs text-slate-400">NASA-STD-3001 Clinical Data Ingestion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex mt-4 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTab('vital')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              tab === 'vital'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vital Sign Reading
          </button>
          <button
            type="button"
            onClick={() => setTab('symptom')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              tab === 'symptom'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Symptom / SAMS Log
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{typeof error === 'string' ? error : JSON.stringify(error)}</span>
          </div>
        )}

        {/* Vital Sign Form */}
        {tab === 'vital' ? (
          <form onSubmit={handleSubmitVital} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Telemetry Metric</label>
              <select
                value={metricType}
                onChange={(e) => setMetricType(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-cyan-300 focus:outline-none focus:border-cyan-400"
              >
                <option value="heart_rate">Resting Heart Rate (bpm)</option>
                <option value="oxygen_saturation">Pulse Oximetry SpO2 (%)</option>
                <option value="body_temperature">Core Body Temperature (°C)</option>
                <option value="sleep_duration">Sleep Duration (hours)</option>
                <option value="water_intake">Hydration Volume (mL)</option>
                <option value="exercise_duration">Physical Exercise (minutes)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Measured Value</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <span className="absolute right-3 top-2 text-xs text-cyan-400 font-mono">
                    {METRIC_UNITS[metricType]}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Sensor Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="manual">Manual Astronaut Entry</option>
                  <option value="device">Bio-harness / Sensor</option>
                  <option value="imported">Space Station Telemetry</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Operational Notes</label>
              <input
                type="text"
                placeholder="e.g. Post-exercise, Pre-EVA, Cabin Air Nominal"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Streaming Telemetry...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Log Telemetry Record</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Symptom Form */
          <form onSubmit={handleSubmitSymptom} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Reported Symptom</label>
              <select
                value={symptomType}
                onChange={(e) => setSymptomType(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300 focus:outline-none focus:border-amber-400"
              >
                {SYMPTOM_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs uppercase tracking-wider text-slate-400">Severity Level (1-5)</label>
                <span className="text-xs font-bold text-amber-400">{severity} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>1 - Mild</span>
                <span>3 - Moderate</span>
                <span>5 - Severe (EVA Hold)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Symptom Details</label>
              <textarea
                rows={2}
                placeholder="Describe onset, duration, or microgravity disorientation..."
                value={symptomNotes}
                onChange={(e) => setSymptomNotes(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Registering Symptom...</span>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Log Spaceflight Symptom</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
