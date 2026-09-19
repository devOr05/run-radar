import React from 'react';
import { useRadar } from '../../context/RadarContext';
import { Play, Pause, FastForward, RotateCcw, Zap, BatteryWarning, WifiOff, X, Sliders } from 'lucide-react';

interface SimulatorControlBarProps {
  onClose: () => void;
}

export const SimulatorControlBar: React.FC<SimulatorControlBarProps> = ({ onClose }) => {
  const { 
    simulatorConfig, 
    toggleSimulator, 
    setSimulatorSpeed, 
    resetSimulator, 
    injectAlert, 
    athletes 
  } = useRadar();

  const pedro = athletes.find(a => a.name.includes('Pedro')) || athletes[0];
  const ana = athletes.find(a => a.name.includes('Ana')) || athletes[1];
  const martin = athletes.find(a => a.name.includes('Martín')) || athletes[2];

  return (
    <div className="bg-[#0B0F19]/95 backdrop-blur border-b border-cyan-500/30 px-4 py-3 shadow-xl animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase text-cyan-400 font-mono tracking-wider">MODO SIMULADOR DEMO</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.2 rounded font-mono">
                {athletes.length} Corredores
              </span>
            </div>
          </div>
        </div>

        {/* Controls: Play/Pause, Speeds, Reset */}
        <div className="flex items-center gap-2">
          
          <button
            onClick={toggleSimulator}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
              simulatorConfig.isRunning
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-emerald-500 text-black hover:bg-emerald-400'
            }`}
          >
            {simulatorConfig.isRunning ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
            <span>{simulatorConfig.isRunning ? 'Pausar Simulación' : 'Iniciar Simulación'}</span>
          </button>

          {/* Speed Multipliers */}
          <div className="flex bg-radar-card p-0.5 rounded-xl border border-radar-border text-xs font-bold">
            {([1, 2, 5] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => setSimulatorSpeed(spd)}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-0.5 ${
                  simulatorConfig.playbackSpeed === spd
                    ? 'bg-cyan-500 text-black font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{spd}x</span>
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={resetSimulator}
            className="p-1.5 rounded-xl bg-radar-card border border-radar-border text-slate-400 hover:text-white hover:border-slate-600 transition"
            title="Reiniciar Simulación"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Injected Events */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 mr-1 hidden lg:inline">Inyectar Alertas:</span>

          {pedro && (
            <button
              onClick={() => injectAlert(pedro.id, 'high_hr')}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-red-950/60 text-red-300 border border-red-500/40 hover:bg-red-900/60 transition flex items-center gap-1"
              title="Forzar FC 186 BPM en Pedro Gómez"
            >
              <Zap className="w-3 h-3 text-red-400" />
              <span>⚡ FC Alta (Pedro)</span>
            </button>
          )}

          {ana && (
            <button
              onClick={() => injectAlert(ana.id, 'low_battery')}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60 transition flex items-center gap-1"
              title="Forzar Batería 5% en Ana"
            >
              <BatteryWarning className="w-3 h-3 text-amber-400" />
              <span>🔋 Batería 5% (Ana)</span>
            </button>
          )}

          {martin && (
            <button
              onClick={() => injectAlert(martin.id, 'disconnect')}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition flex items-center gap-1"
              title="Simular pérdida de señal por 20s en Martín"
            >
              <WifiOff className="w-3 h-3" />
              <span>⚪ Desconexión (Martín)</span>
            </button>
          )}
        </div>

        {/* Close Bar */}
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
