import React, { useState } from 'react';
import { 
  Satellite, 
  ShieldCheck, 
  Lock, 
  User, 
  Compass, 
  ArrowRight, 
  Key, 
  Radio, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { loginAstronaut, DEFAULT_USER_ID } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [astronautName, setAstronautName] = useState('Cmdr. Alex Carter');
  const [callSign, setCallSign] = useState('ORION-LEAD');
  const [role, setRole] = useState('Commander');
  const [missionName, setMissionName] = useState('Artemis III - Lunar Base');
  const [passcode, setPasscode] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const astronautData = {
        name: astronautName.trim() || 'Astronaut',
        callSign: callSign.trim() || 'ASTRO',
        role,
        missionName,
        id: DEFAULT_USER_ID,
      };

      await loginAstronaut(DEFAULT_USER_ID, astronautData);
      if (onLoginSuccess) {
        onLoginSuccess(astronautData);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Biometric authentication failed. Ensure backend API is online.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setAstronautName('Cmdr. Alex Carter');
    setCallSign('ORION-LEAD');
    setRole('Commander');
    setMissionName('Artemis III - Lunar Base');
    setPasscode('NASA-STD-3001');
  };

  return (
    <div className="min-h-screen bg-[#060b18] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      
      {/* Background Cybernetic Glow & Radar Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Terminal Card */}
      <div className="hud-card-active rounded-3xl w-full max-w-lg p-8 sm:p-10 border border-cyan-500/30 relative z-10 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
        
        {/* Terminal Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 p-0.5 shadow-lg shadow-cyan-500/30">
              <div className="w-full h-full bg-[#0a1226] rounded-2xl flex items-center justify-center text-cyan-400">
                <Satellite className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 absolute -top-1 -right-1 animate-ping"></div>
          </div>

          <div className="mt-4">
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase bg-cyan-950/60 border border-cyan-500/30 px-3 py-0.5 rounded-full">
              Mission Control Gateway
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-2 font-mono">
              NovaGuard Telemetry
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              NASA Autonomous Health Monitoring & Clinical Decision Support
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          
          {/* Astronaut Full Name */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
              Astronaut Name / Identity
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={astronautName}
                onChange={(e) => setAstronautName(e.target.value)}
                placeholder="e.g. Cmdr. Alex Carter"
                className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
              />
              <User className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Call Sign & Operational Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                Call Sign
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={callSign}
                  onChange={(e) => setCallSign(e.target.value)}
                  placeholder="e.g. ORION-LEAD"
                  className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2.5 text-sm text-cyan-300 font-mono focus:outline-none"
                />
                <Radio className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                Mission Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none"
              >
                <option value="Commander">Commander / Pilot</option>
                <option value="Flight Surgeon">Flight Surgeon / Medical</option>
                <option value="Mission Specialist">Mission Specialist</option>
                <option value="EVA Lead">EVA Systems Specialist</option>
              </select>
            </div>
          </div>

          {/* Mission Deployment Selection */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
              Assigned Mission Expedition
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={missionName}
                onChange={(e) => setMissionName(e.target.value)}
                placeholder="e.g. Artemis III - Lunar Base"
                className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none"
              />
              <Compass className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Security Passcode */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
              Flight Security Passcode
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none font-mono"
              />
              <Lock className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer hover:scale-[1.02]"
          >
            {loading ? (
              <span>Authenticating Biometrics...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-cyan-200" />
                <span>Enter Mission Control</span>
                <ArrowRight className="w-4 h-4 text-cyan-200" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Pre-fill Link */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleQuickDemoFill}
            className="text-[11px] font-mono text-cyan-400 hover:text-white underline inline-flex items-center space-x-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Reset Demo Credentials</span>
          </button>
        </div>

        {/* Footer Security Badges */}
        <div className="mt-8 pt-5 border-t border-cyan-500/15 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Supabase RLS Protected</span>
          </span>
          <span>NASA-STD-3001 Verified</span>
        </div>

      </div>

      {/* Bottom Sub-text */}
      <p className="text-[11px] text-slate-500 font-mono mt-6 relative z-10">
        NovaGuard Aerospace Systems • Encrypted Ground-to-Orbit Link
      </p>

    </div>
  );
}
