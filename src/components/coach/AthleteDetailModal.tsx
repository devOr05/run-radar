import React, { useState } from 'react';
import { Athlete } from '../../types';
import { useRadar } from '../../context/RadarContext';
import { 
  formatPace, 
  formatDistance, 
  formatRelativeTime, 
  getStatusDetails, 
  getZoneDetails, 
  calculateHeartRateZone 
} from '../../lib/calculations';
import { 
  X, 
  Heart, 
  Gauge, 
  MapPin, 
  Footprints, 
  Flame, 
  Smartphone, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle,
  Radio,
  CheckCircle2
} from 'lucide-react';

interface AthleteDetailModalProps {
  athlete: Athlete;
  onClose: () => void;
}

export const AthleteDetailModal: React.FC<AthleteDetailModalProps> = ({ athlete, onClose }) => {
  const { injectAlert, clearAlert } = useRadar();
  const [historyPeriod, setHistoryPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  const statusInfo = getStatusDetails(athlete.currentStatus);
  const sample = athlete.lastSample;
  const hr = sample?.heartRate || 0;
  const zone = sample?.zone || calculateHeartRateZone(hr, athlete.maxHeartRate);
  const zoneInfo = getZoneDetails(zone);

  // Datos simulados de evolución histórica
  const historyData = {
    '7d': { sessions: 3, distance: '24.5 km', avgPace: '5:42/km', avgHr: '151 BPM', time: '2h 18m' },
    '30d': { sessions: 12, distance: '102.0 km', avgPace: '5:38/km', avgHr: '149 BPM', time: '9h 35m' },
    '90d': { sessions: 38, distance: '315.0 km', avgPace: '5:32/km', avgHr: '147 BPM', time: '28h 50m' }
  }[historyPeriod];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-radar-card border border-radar-border rounded-2xl p-6 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-[#0B0F19] border border-radar-border transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header: Name, Status & Contact */}
        <div className="flex items-start gap-4 mb-6 pr-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-xl font-black text-cyan-400">
            {athlete.name[0]}{athlete.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white tracking-wide">
                {athlete.name} {athlete.lastName}
              </h2>
              <span className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}>
                {statusInfo.icon} {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
              <span>{athlete.email}</span>
              {athlete.phone && <span>• {athlete.phone}</span>}
              <span>• Última señal: {formatRelativeTime(athlete.lastSeen)}</span>
            </p>
          </div>
        </div>

        {/* Alerta Activa si existe */}
        {athlete.statusReason && (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{athlete.statusReason}</span>
            </div>
            <button
              onClick={() => clearAlert(athlete.id)}
              className="text-xs font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition"
            >
              Restablecer Normal
            </button>
          </div>
        )}

        {/* Métricas en Vivo */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" /> Métricas en Tiempo Real
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* FC */}
            <div className="bg-[#0B0F19] p-3 rounded-xl border border-radar-border">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> FC en Vivo
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-['JetBrains_Mono',monospace]">
                  {hr > 0 ? hr : '--'}
                </span>
                <span className="text-xs text-slate-400">BPM</span>
              </div>
              <span className={`text-[10px] font-bold mt-1 inline-block px-1.5 py-0.5 rounded ${zoneInfo.bg} ${zoneInfo.color}`}>
                {zoneInfo.label} — {zoneInfo.name}
              </span>
            </div>

            {/* Ritmo */}
            <div className="bg-[#0B0F19] p-3 rounded-xl border border-radar-border">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Ritmo
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-['JetBrains_Mono',monospace]">
                  {formatPace(sample?.pace)}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Velocidad: {sample?.speed ? `${sample.speed} km/h` : '--'}
              </span>
            </div>

            {/* Distancia */}
            <div className="bg-[#0B0F19] p-3 rounded-xl border border-radar-border">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Distancia
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-['JetBrains_Mono',monospace]">
                  {formatDistance(sample?.distance)}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Pasos: {sample?.steps?.toLocaleString() || '--'}
              </span>
            </div>

            {/* Cadencia / Calorías */}
            <div className="bg-[#0B0F19] p-3 rounded-xl border border-radar-border">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Footprints className="w-3.5 h-3.5 text-yellow-400" /> Cadencia
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white font-['JetBrains_Mono',monospace]">
                  {sample?.cadence || '--'}
                </span>
                <span className="text-xs text-slate-400">SPM</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Calorías: {sample?.calories || 0} kcal
              </span>
            </div>

          </div>
        </div>

        {/* Dispositivos y Fuentes Conectadas */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> Dispositivos Vinculados
          </h3>
          <div className="space-y-2">
            {athlete.devices.map((dev) => (
              <div key={dev.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B0F19] border border-radar-border text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">{dev.name}</span>
                  {dev.brand && <span className="text-slate-400">({dev.brand} {dev.model})</span>}
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  {dev.isPrimaryHR && <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[10px]">❤️ Fuente FC</span>}
                  {dev.isPrimaryGPS && <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px]">📍 Fuente GPS</span>}
                  {dev.batteryLevel !== undefined && <span>🔋 {dev.batteryLevel}%</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permisos de Privacidad Compartidos */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Permisos Otorgados por el Corredor
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded bg-[#0B0F19] border border-radar-border flex items-center justify-between">
              <span className="text-slate-300">❤️ FC</span>
              <span className={athlete.permissions.heartRate ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {athlete.permissions.heartRate ? 'ACTIVO' : 'NO'}
              </span>
            </div>
            <div className="p-2 rounded bg-[#0B0F19] border border-radar-border flex items-center justify-between">
              <span className="text-slate-300">📍 Ubicación GPS</span>
              <span className={athlete.permissions.location ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {athlete.permissions.location ? 'ACTIVO' : 'NO'}
              </span>
            </div>
            <div className="p-2 rounded bg-[#0B0F19] border border-radar-border flex items-center justify-between">
              <span className="text-slate-300">🏃 Entrenamientos</span>
              <span className={athlete.permissions.workouts ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {athlete.permissions.workouts ? 'ACTIVO' : 'NO'}
              </span>
            </div>
            <div className="p-2 rounded bg-[#0B0F19] border border-radar-border flex items-center justify-between">
              <span className="text-slate-300">👣 Pasos / Cadencia</span>
              <span className={athlete.permissions.steps ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {athlete.permissions.steps ? 'ACTIVO' : 'NO'}
              </span>
            </div>
          </div>
        </div>

        {/* Evolución Histórica y Tendencias */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Historial de Evolución
            </h3>
            <div className="flex bg-[#0B0F19] p-0.5 rounded-lg border border-radar-border text-xs">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setHistoryPeriod(p)}
                  className={`px-2 py-0.5 rounded font-medium ${
                    historyPeriod === p ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400'
                  }`}
                >
                  {p === '7d' ? '7 Días' : p === '30d' ? '30 Días' : '90 Días'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0B0F19] p-3 rounded-xl border border-radar-border text-xs">
            <div>
              <span className="text-slate-400">Distancia Total</span>
              <div className="text-base font-bold text-white mt-0.5">{historyData.distance}</div>
              <span className="text-[10px] text-emerald-400 font-medium">↑ mejora</span>
            </div>
            <div>
              <span className="text-slate-400">Ritmo Promedio</span>
              <div className="text-base font-bold text-white mt-0.5">{historyData.avgPace}</div>
              <span className="text-[10px] text-emerald-400 font-medium">↑ mejora</span>
            </div>
            <div>
              <span className="text-slate-400">FC Promedio</span>
              <div className="text-base font-bold text-white mt-0.5">{historyData.avgHr}</div>
              <span className="text-[10px] text-slate-400 font-medium">→ estable</span>
            </div>
            <div>
              <span className="text-slate-400">Sesiones</span>
              <div className="text-base font-bold text-white mt-0.5">{historyData.sessions} sesiones</div>
              <span className="text-[10px] text-slate-400 font-medium">{historyData.time}</span>
            </div>
          </div>
        </div>

        {/* Acciones de Prueba / Inyección de Alertas */}
        <div className="pt-4 border-t border-radar-border flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-400">Simulación de eventos:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => injectAlert(athlete.id, 'high_hr')}
              className="text-xs px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
            >
              ⚡ FC Elevada (186 BPM)
            </button>
            <button
              onClick={() => injectAlert(athlete.id, 'low_battery')}
              className="text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
            >
              🔋 Batería 5%
            </button>
            <button
              onClick={() => injectAlert(athlete.id, 'disconnect')}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
            >
              ⚪ Desconexión
            </button>
            <button
              onClick={() => clearAlert(athlete.id)}
              className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
            >
              ✓ Limpiar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
