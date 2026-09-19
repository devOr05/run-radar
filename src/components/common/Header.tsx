import React from 'react';
import { useRadar } from '../../context/RadarContext';
import { Activity, Bell, Radio, User, ShieldAlert, Sliders, Smartphone } from 'lucide-react';

interface HeaderProps {
  onOpenAlerts: () => void;
  onOpenSimulator: () => void;
  isSimulatorOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAlerts, onOpenSimulator, isSimulatorOpen }) => {
  const { userRole, setUserRole, alerts, activeSession, isConnected } = useRadar();
  const unreadAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/95 backdrop-blur border-b border-radar-border px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Radio className="w-6 h-6 text-black" />
            <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0B0F19] ${isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5 font-['JetBrains_Mono',monospace]">
                RUN<span className="text-cyan-400">RADAR</span>
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                RR
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Central de Monitoreo de Running</p>
          </div>
        </div>

        {/* Live Session Pill (si hay activa) */}
        {activeSession && activeSession.status === 'active' && (
          <div className="hidden md:flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold text-red-400 uppercase tracking-wide">
              SESIÓN EN VIVO: {activeSession.name}
            </span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Simulator Bar Toggle */}
          <button
            onClick={onOpenSimulator}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              isSimulatorOpen 
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20' 
                : 'bg-radar-card text-slate-300 border-radar-border hover:border-slate-600'
            }`}
            title="Controles del Simulador Multi-Corredor"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simulador</span>
          </button>

          {/* Role Indicator Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
            {userRole === 'coach' ? (
              <>
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-cyan-400">Entrenador</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-emerald-400">Corredor</span>
              </>
            )}
          </div>

          {/* Alertas Badge Button (Coach only) */}
          {userRole === 'coach' && (
            <button
              onClick={onOpenAlerts}
              className="relative p-2 rounded-lg bg-radar-card border border-radar-border text-slate-300 hover:text-white transition"
              title="Panel de Alertas"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                  {unreadAlerts.length}
                </span>
              )}
            </button>
          )}

          {/* Switch Role / Exit Button */}
          <button
            onClick={() => setUserRole(null)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold transition"
            title="Cambiar de Rol / Salir"
          >
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Cambiar Rol</span>
          </button>

        </div>
      </div>
    </header>
  );
};
