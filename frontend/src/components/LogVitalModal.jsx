import React, { useState } from 'react';
import { X, Activity, AlertTriangle, Plus } from 'lucide-react';
import { createHealthRecord } from '../services/api';

const METRIC_UNITS = {
  heart_rate: 'bpm',
  oxygen_saturation: '%',
  body_temperature: '°C',
  sleep_duration: 'hours',
  water_intake: 'mL',
  exercise_duration: 'minutes',
};

export default function LogVitalModal({ isOpen, onClose, missionDayId, onRecordCreated }) {
  const [metricType, setMetricType] = useState('heart_rate');
  const [value, setValue] = useState('75');
  const [source, setSource] = useState('manual');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmitVital = async (e) => {
    e.preventDefault();
    if (!missionDayId) {
      setError("No active flight day found for your astronaut profile. Please refresh to initialize your flight day.");
      return;
    }
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
              <p className="text-xs text-slate-400">NASA-STD-3001 Physiological Data Ingestion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{typeof error === 'string' ? error : JSON.stringify(error)}</span>
          </div>
        )}

        {/* Vital Sign Form */}
        <form onSubmit={handleSubmitVital} className="mt-5 space-y-4">
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
            className="w-full mt-4 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
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

      </div>
    </div>
  );
}
