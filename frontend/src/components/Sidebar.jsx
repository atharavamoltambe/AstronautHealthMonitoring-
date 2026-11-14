import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Cpu, 
  Satellite, 
  ShieldCheck, 
  Radio, 
  User, 
  LogOut,
  Bell,
  BriefcaseMedical
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, currentUser, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Mission Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'Human Body & Vitals', icon: Activity },
    { id: 'ai', label: 'AI Clinical Assessment', icon: Cpu },
    { id: 'playbooks', label: 'Emergency Playbooks', icon: BriefcaseMedical },
  ];

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase()
    : 'AST';

  return (
    <aside className="w-64 bg-[#0a1226]/95 border-r border-cyan-500/20 flex flex-col justify-between p-4 shrink-0 h-screen sticky top-0">
      
      {/* Brand Logo & Mission Title */}
      <div>
        <div className="flex items-center space-x-3 px-2 py-3 border-b border-cyan-500/20">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md shadow-cyan-500/20 text-white">
            <Satellite className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-wider text-white font-mono flex items-center space-x-1.5">
              <span>NovaGuard</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-mono tracking-widest block uppercase">
              NASA Mission Control
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-md shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Status */}
      <div className="space-y-4 pt-4 border-t border-cyan-500/15">
        
        {/* Network & Ground Station Status */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-mono space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span>NETWORK</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>ONLINE</span>
            </span>
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            Ground: Houston (JSC-MCC)
          </div>
        </div>

        {/* Astronaut Operator Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-bold text-xs font-mono shrink-0">
              {initials}
            </div>
            <div className="truncate">
              <span className="block text-xs font-bold text-slate-200 truncate">
                {currentUser?.name || 'Cmdr. Alex Carter'}
              </span>
              <span className="block text-[10px] text-cyan-400 font-mono truncate">
                {currentUser?.role || 'Commander'} • {currentUser?.callSign || 'ORION'}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log Out & Lock Gateway"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors ml-1 shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

    </aside>
  );
}
