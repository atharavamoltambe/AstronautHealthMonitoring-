import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { createSymptomLog } from '../services/api';

const SYMPTOM_OPTIONS = [
  'Space Adaptation Motion Sickness',
  'Headache (Cephalic Fluid Shift)',
  'Nausea / Vestibular Disorientation',
  'Muscle Soreness / Fatigue',
  'Visual Disturbance (SANS)',
  'Insomnia / Sleep Disruption',
  'Dizziness / Orthostatic Intolerance',
  'Back Pain (Spinal Elongation)',
];

export default function LogSymptomModal({ isOpen, onClose, missionDayId, onSymptomCreated }) {
  const [symptomType, setSymptomType] = useState(SYMPTOM_OPTIONS[0]);
  const [severity, setSeverity] = useState(3);
  const [symptomNotes, setSymptomNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmitSymptom = async (e) => {
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
        symptom_type: symptomType,
        severity: parseInt(severity, 10),
        recorded_at: new Date().toISOString(),
        notes: symptomNotes.trim() || undefined,
      };
      await createSymptomLog(payload);
      if (onSymptomCreated) onSymptomCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to report spaceflight symptom.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="hud-card-active rounded-2xl w-full max-w-lg p-6 bg-[#0a1226] border border-amber-500/40 text-slate-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-950/60 border border-amber-500/40 rounded-lg text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-wide text-amber-300">Report Spaceflight Symptom</h3>
              <p className="text-xs text-slate-400">NASA-STD-3001 SAMS & Physiological Log</p>
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

        {/* Symptom Form */}
        <form onSubmit={handleSubmitSymptom} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Reported Spaceflight Symptom</label>
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
              <label className="text-xs uppercase tracking-wider text-slate-400">Severity Assessment (1 - 5)</label>
              <span className="text-xs font-bold font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                Level {severity} / 5
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>1 - Mild</span>
              <span>3 - Moderate</span>
              <span>5 - Severe (EVA Hold / Kit Access)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Symptom Details / Observations</label>
            <textarea
              rows={3}
              placeholder="Describe trigger, duration, microgravity adaptation, or vestibular disorientation..."
              value={symptomNotes}
              onChange={(e) => setSymptomNotes(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Registering Symptom...</span>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Submit Symptom Log to Flight Surgeon</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

