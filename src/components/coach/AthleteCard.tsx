import React from 'react';
import { Athlete } from '../../types';
import { formatPace, formatDistance, formatDuration, formatRelativeTime, getStatusDetails, getZoneDetails, calculateHeartRateZone } from '../../lib/calculations';
import { Heart, Gauge, MapPin, Clock, Battery, AlertTriangle } from 'lucide-react';

interface AthleteCardProps {
  athlete: Athlete;
  onClick: () => void;
}

export const AthleteCard: React.FC<AthleteCardProps> = ({ athlete, onClick }) => {
  const statusInfo = getStatusDetails(athlete.currentStatus);
  const sample = athlete.lastSample;
  const hr = sample?.heartRate || 0;
  const hrZone = sample?.zone || calculateHeartRateZone(hr, athlete.maxHeartRate);
  const zoneInfo = getZoneDetails(hrZone);
  const paceStr = formatPace(sample?.pace);
  const distanceStr = formatDistance(sample?.distance);
  const sourceName = sample?.sourceDevice || athlete.devices.map(d => d.name).join(' + ') || '📱 Celular';
  const relativeTime = formatRelativeTime(athlete.lastSeen);

  return (
    <div
      onClick={onClick}
      className={`group relative bg-radar-card rounded-xl p-4 border transition-all cursor-pointer hover:bg-radar-cardHover ${
        athlete.currentStatus === 'alert'
          ? 'border-red-500/60 bg-red-950/20 shadow-lg shadow-red-500/10 ring-1 ring-red-500/40 animate-pulse-fast'
          : athlete.currentStatus === 'attention'
          ? 'border-amber-500/50 bg-amber-950/10 shadow-md shadow-amber-500/10'
          : 'border-radar-border hover:border-slate-600'
      }`}
    >
      {/* Header: Name + Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{statusInfo.icon}</span>
          <h4 className="font-bold text-slate-100 text-sm sm:text-base tracking-wide group-hover:text-cyan-400 transition truncate max-w-[140px] sm:max-w-[180px]">
            {athlete.name} {athlete.lastName}
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          {athlete.phone && (
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700" title={`Tel: ${athlete.phone}`}>
              📱
            </span>
          )}
          <span
            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Motivo de Alerta / Atención si existe */}
      {athlete.statusReason && (
        <div className="mb-2.5 flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span className="truncate">{athlete.statusReason}</span>
        </div>
      )}

      {/* Primary Metrics Grid (FC, Ritmo, Distancia) */}
      <div className="grid grid-cols-3 gap-2 bg-[#0B0F19]/60 p-2.5 rounded-lg border border-radar-border/70 mb-3">
        
        {/* Heart Rate */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Heart className="w-3 h-3 text-rose-500" />
            <span>FC</span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-black text-white font-['JetBrains_Mono',monospace]">
              {hr > 0 ? hr : '--'}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">BPM</span>
          </div>
          {hr > 0 && (
            <span className={`text-[10px] font-bold mt-0.5 px-1.5 py-0.2 rounded w-fit ${zoneInfo.bg} ${zoneInfo.color} ${zoneInfo.border} border`}>
              {zoneInfo.label}
            </span>
          )}
        </div>

        {/* Pace */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Gauge className="w-3 h-3 text-cyan-400" />
            <span>Ritmo</span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm sm:text-base font-bold text-white font-['JetBrains_Mono',monospace]">
              {paceStr}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">
            {sample?.speed ? `${sample.speed} km/h` : ''}
          </span>
        </div>

        {/* Distance */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>Distancia</span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm sm:text-base font-bold text-white font-['JetBrains_Mono',monospace]">
              {distanceStr}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">
            {sample?.calories ? `${sample.calories} kcal` : ''}
          </span>
        </div>

      </div>

      {/* Footer: Fuente + Última sincronización + Batería */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-radar-border/40">
        <div className="truncate max-w-[170px]" title={sourceName}>
          <span className="text-slate-300">{sourceName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {sample?.battery !== undefined && (
            <div className="flex items-center gap-0.5 text-slate-400">
              <Battery className={`w-3 h-3 ${sample.battery <= 10 ? 'text-red-400' : 'text-slate-400'}`} />
              <span>{sample.battery}%</span>
            </div>
          )}
          <span className="text-[10px] text-slate-500">{relativeTime}</span>
        </div>
      </div>
    </div>
  );
};
