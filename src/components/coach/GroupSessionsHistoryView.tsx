import React, { useState, useMemo } from 'react';
import { useRadar } from '../../context/RadarContext';
import { CompletedSessionRecord, Group, Athlete } from '../../types';
import { 
  Clock, 
  MapPin, 
  Heart, 
  Footprints, 
  Flame, 
  Activity, 
  Watch, 
  Search, 
  Filter, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  Calendar,
  MessageSquare,
  ChevronDown,
  Sparkles,
  TrendingUp,
  User,
  Zap
} from 'lucide-react';
import { formatPace, formatDistance, formatDuration, calculateHeartRateZone, getZoneDetails } from '../../lib/calculations';

interface GroupSessionsHistoryViewProps {
  currentGroup: Group;
  onOpenMessageModal?: (athlete: Athlete, defaultText?: string) => void;
}

export const GroupSessionsHistoryView: React.FC<GroupSessionsHistoryViewProps> = ({
  currentGroup,
  onOpenMessageModal
}) => {
  const { completedSessions, athletes, exportCSV } = useRadar();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAthleteFilter, setSelectedAthleteFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');

  // Atletas que tienen sesiones en este grupo
  const groupAthletes = useMemo(() => {
    return athletes.filter(a => a.groupIds.includes(currentGroup.id));
  }, [athletes, currentGroup.id]);

  // Filtrar sesiones por el grupo actual o atletas asignados a este grupo
  const groupSessions = useMemo(() => {
    return completedSessions.filter(s => 
      s.groupId === currentGroup.id || 
      groupAthletes.some(a => a.id === s.athleteId)
    );
  }, [completedSessions, currentGroup.id, groupAthletes]);

  // Filtrado compuesto
  const filteredSessions = useMemo(() => {
    return groupSessions.filter(s => {
      // Filtro por atleta
      if (selectedAthleteFilter !== 'all' && s.athleteId !== selectedAthleteFilter) {
        return false;
      }

      // Filtro por fecha
      const now = Date.now();
      if (dateFilter === 'today') {
        const isToday = (now - s.endTime) < 86400000;
        if (!isToday) return false;
      } else if (dateFilter === 'week') {
        const isWeek = (now - s.endTime) < (86400000 * 7);
        if (!isWeek) return false;
      }

      // Búsqueda de texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = s.athleteName.toLowerCase().includes(query);
        const matchDevice = s.sourceDevice.toLowerCase().includes(query);
        const matchNotes = s.notes ? s.notes.toLowerCase().includes(query) : false;
        if (!matchName && !matchDevice && !matchNotes) return false;
      }

      return true;
    }).sort((a, b) => b.endTime - a.endTime);
  }, [groupSessions, selectedAthleteFilter, dateFilter, searchQuery]);

  // Métricas acumuladas del grupo
  const summary = useMemo(() => {
    if (groupSessions.length === 0) {
      return { totalKm: 0, count: 0, avgPace: 0, avgHr: 0 };
    }
    const totalMeters = groupSessions.reduce((acc, s) => acc + s.distanceMeters, 0);
    const totalPace = groupSessions.reduce((acc, s) => acc + s.avgPaceSeconds, 0);
    const totalHr = groupSessions.reduce((acc, s) => acc + s.avgHeartRate, 0);

    return {
      totalKm: (totalMeters / 1000).toFixed(1),
      count: groupSessions.length,
      avgPace: Math.round(totalPace / groupSessions.length),
      avgHr: Math.round(totalHr / groupSessions.length)
    };
  }, [groupSessions]);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Banner Superior con Métricas Acumuladas del Grupo */}
      <div className="bg-gradient-to-r from-slate-900 via-radar-card to-slate-900 border border-radar-border p-5 rounded-3xl shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <RotateCcw className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  SINCRONIZACIÓN POST-ENTRENAMIENTO
                </span>
                <span className="text-xs text-slate-400">
                  {currentGroup.name}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white mt-0.5">
                Historial de Sesiones Sincronizadas
              </h3>
              <p className="text-xs text-slate-400">
                Datos transmitidos por los corredores al conectar sus relojes o finalizar sus actividades offline.
              </p>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-[#0B0F19]/90 p-3 rounded-2xl border border-radar-border">
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Km</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                {summary.totalKm} km
              </span>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div className="text-center px-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sesiones</span>
              <span className="text-base font-black text-white font-mono">
                {summary.count}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div className="text-center px-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Ritmo Medio</span>
              <span className="text-base font-black text-cyan-400 font-mono">
                {summary.avgPace > 0 ? formatPace(summary.avgPace) : '--'}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div className="text-center px-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pulso Medio</span>
              <span className="text-base font-black text-rose-400 font-mono">
                {summary.avgHr > 0 ? `${summary.avgHr} BPM` : '--'}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-radar-card p-3 rounded-2xl border border-radar-border">
        
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por corredor, reloj o notas..."
            className="w-full bg-[#0B0F19] border border-radar-border rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Filtros Selector */}
        <div className="flex items-center gap-2">
          
          {/* Selector de Atleta */}
          <select
            value={selectedAthleteFilter}
            onChange={(e) => setSelectedAthleteFilter(e.target.value)}
            className="bg-[#0B0F19] border border-radar-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-medium"
          >
            <option value="all">Todos los atletas ({groupAthletes.length})</option>
            {groupAthletes.map(ath => (
              <option key={ath.id} value={ath.id}>
                {ath.name} {ath.lastName}
              </option>
            ))}
          </select>

          {/* Selector de Período */}
          <div className="flex bg-[#0B0F19] p-1 rounded-xl border border-radar-border text-xs font-semibold">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === 'all' ? 'bg-cyan-500 text-black font-extrabold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === 'today' ? 'bg-cyan-500 text-black font-extrabold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === 'week' ? 'bg-cyan-500 text-black font-extrabold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semana
            </button>
          </div>

          {/* Exportar CSV */}
          <button
            onClick={() => exportCSV()}
            className="p-2 bg-[#0B0F19] hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-radar-border rounded-xl transition"
            title="Exportar a CSV"
          >
            <Download className="w-4 h-4" />
          </button>

        </div>

      </div>

      {/* Lista de Sesiones Sincronizadas */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-16 bg-radar-card/50 rounded-3xl border border-radar-border p-6 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <RotateCcw className="w-7 h-7" />
          </div>
          <h4 className="text-base font-extrabold text-white">
            Sin sesiones sincronizadas en este filtro
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Cuando los corredores del grupo finalicen sus entrenamientos en la app o sincronicen sus relojes Amazfit, Xiaomi o Garmin, verás todos sus datos reflejados aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredSessions.map((session) => {
            const hrZone = calculateHeartRateZone(session.avgHeartRate, 185);
            const zoneInfo = getZoneDetails(hrZone);

            const athleteObj = athletes.find(a => a.id === session.athleteId);

            return (
              <div
                key={session.id}
                className="bg-radar-card border border-radar-border hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition shadow-lg space-y-3.5"
              >
                
                {/* Cabecera de la Tarjeta */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-sm shadow-inner shrink-0">
                      {session.athleteName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-white">
                          {session.athleteName}
                        </h4>
                        <span className="text-[11px] text-slate-400">• {session.date}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-xs text-cyan-400 font-medium">
                          {session.sourceDevice}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" />
                          {session.syncType === 'offline_sync' ? 'Sincronizado Offline' : 'Grabado en Vivo'}
                        </span>
                        {Date.now() - session.syncTimestamp < 900000 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/50 animate-pulse">
                            ⚡ Recién Sincronizada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botón de Interacción Rápida DT */}
                  {onOpenMessageModal && athleteObj && (
                    <button
                      onClick={() => onOpenMessageModal(athleteObj, `¡Gran fondo de ${formatDistance(session.distanceMeters)} a ${formatPace(session.avgPaceSeconds)}! Muy buenas sensaciones.`)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Felicitar / Mensaje</span>
                    </button>
                  )}
                </div>

                {/* Métricas Principales en Grid Responsivo */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 bg-[#0B0F19] p-3 rounded-xl border border-radar-border">
                  
                  {/* Distancia */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Distancia</span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      {formatDistance(session.distanceMeters)}
                    </span>
                  </div>

                  {/* Tiempo */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Tiempo Total</span>
                    <span className="text-base font-black text-white font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {formatDuration(session.durationSeconds)}
                    </span>
                  </div>

                  {/* Ritmo Medio */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Ritmo Medio</span>
                    <span className="text-base font-black text-cyan-400 font-mono">
                      {formatPace(session.avgPaceSeconds)}
                    </span>
                  </div>

                  {/* Pulso Promedio */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Pulso Medio</span>
                    <span className="text-base font-black text-rose-400 font-mono flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      {session.avgHeartRate} <span className="text-xs font-normal text-slate-400">BPM</span>
                    </span>
                  </div>

                  {/* Cadencia */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Cadencia</span>
                    <span className="text-base font-black text-sky-400 font-mono flex items-center gap-1">
                      <Footprints className="w-3.5 h-3.5 text-sky-500" />
                      {session.avgCadence} <span className="text-xs font-normal text-slate-400">SPM</span>
                    </span>
                  </div>

                  {/* Calorías */}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block tracking-wider">Calorías</span>
                    <span className="text-base font-black text-amber-400 font-mono flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      {session.totalCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
                    </span>
                  </div>

                </div>

                {/* Notas o comentarios del corredor */}
                {session.notes && (
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 italic flex items-center gap-2">
                    <span className="text-slate-500 not-italic font-bold">Nota del Atleta:</span>
                    <span>"{session.notes}"</span>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
