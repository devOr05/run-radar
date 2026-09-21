import React, { useState } from 'react';
import { useRadar } from '../../context/RadarContext';
import { LiveMapView } from '../coach/LiveMapView';
import { 
  ShieldCheck, 
  Users, 
  Watch, 
  Activity, 
  MapPin, 
  TrendingUp, 
  Radio, 
  ChevronRight, 
  Search, 
  Flame, 
  Zap, 
  Heart,
  Crown,
  Layers,
  Sparkles,
  Send,
  Eye
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { 
    groups, 
    athletes, 
    coach, 
    setUserRole, 
    setSelectedGroupId, 
    sendCoachMessage 
  } = useRadar();

  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'groups' | 'athletes'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastSentSuccess, setBroadcastSentSuccess] = useState(false);

  // Métricas maestras
  const totalAthletes = athletes.length;
  const activeNowAthletes = athletes.filter(a => Date.now() - (a.lastSeen || 0) < 60000);
  const totalGroups = groups.length;
  const withHeartRate = athletes.filter(a => a.lastSample?.heartRate);
  const totalDistanceKm = Math.round(
    athletes.reduce((acc, a) => acc + (a.lastSample?.distance || 0), 0) / 1000
  );

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.inviteCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAthletes = athletes.filter(a => 
    `${a.name} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.email && a.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSendGlobalBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setIsSendingBroadcast(true);
    try {
      if (sendCoachMessage) {
        await sendCoachMessage({
          coachId: 'super-admin',
          coachName: 'Super Admin (Mario Orostizaga)',
          groupId: 'all',
          text: `📢 AVISO GENERAL: ${broadcastText.trim()}`,
          type: 'instruction'
        });
      }
      setBroadcastSentSuccess(true);
      setBroadcastText('');
      setTimeout(() => setBroadcastSentSuccess(false), 3000);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Barra Superior de Control Maestro / Switcher de Perspectiva */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border-2 border-amber-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-inner">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                PANEL DE CONTROL CENTRAL
              </span>
            </div>
            <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
              Centro de Control Global <span className="text-xs font-mono font-normal text-amber-300">• Visión Central</span>
            </h1>
          </div>
        </div>

        {/* Selector de Perspectivas */}
        <div className="flex items-center gap-2 bg-[#0B0F19] p-1.5 rounded-2xl border border-radar-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'overview' 
                ? 'bg-amber-500 text-black shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Visión Macro</span>
          </button>
          <button
            onClick={() => {
              setUserRole('coach');
              setSelectedGroupId(groups[0]?.id || null);
            }}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition flex items-center gap-1.5"
            title="Ingresar como Entrenador"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ver como Entrenador</span>
          </button>
          <button
            onClick={() => {
              setUserRole('runner');
            }}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-emerald-400 hover:bg-slate-800 transition flex items-center gap-1.5"
            title="Ingresar como Corredor"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ver como Corredor</span>
          </button>
        </div>
      </div>

      {/* Navegación por Pestañas del Admin */}
      <div className="flex items-center gap-2 border-b border-radar-border pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'overview' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Métricas Globales</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'map' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Radar Satelital Global</span>
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'groups' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Grupos ({totalGroups})</span>
        </button>
        <button
          onClick={() => setActiveTab('athletes')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
            activeTab === 'athletes' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Watch className="w-4 h-4" />
          <span>Corredores ({totalAthletes})</span>
        </button>
      </div>

      {/* PESTAÑA 1: VISIÓN GENERAL / MÉTRICAS GLOBALES */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Métricas Hero */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-radar-card border border-radar-border p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Atletas en Vivo</span>
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {activeNowAthletes.length} <span className="text-xs text-emerald-400 font-normal">/ {totalAthletes} total</span>
              </div>
              <div className="text-[11px] text-slate-400">Transmitiendo telemetría en tiempo real</div>
            </div>

            <div className="bg-radar-card border border-radar-border p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Grupos / Teams</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-black text-cyan-400 font-mono">
                {totalGroups}
              </div>
              <div className="text-[11px] text-slate-400">Running teams registrados en el sistema</div>
            </div>

            <div className="bg-radar-card border border-radar-border p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Sensores Cardíacos</span>
                <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
              </div>
              <div className="text-3xl font-black text-rose-400 font-mono">
                {withHeartRate.length}
              </div>
              <div className="text-[11px] text-slate-400">Relojes BLE y Zepp vinculados</div>
            </div>

            <div className="bg-radar-card border border-radar-border p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Km Recorridos Hoy</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-amber-300 font-mono">
                {totalDistanceKm} <span className="text-xs font-normal">KM</span>
              </div>
              <div className="text-[11px] text-slate-400">Distancia acumulada por todos los corredores</div>
            </div>
          </div>

          {/* Formulario de Anuncio Global */}
          <div className="p-5 rounded-3xl bg-[#0B0F19] border border-radar-border space-y-3">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Emitir Comunicado Global del Administrador a Toda la Plataforma
              </h3>
            </div>
            <form onSubmit={handleSendGlobalBroadcast} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="Escribe un anuncio para todos los grupos y relojes (ej: Carrera suspendida por lluvia...)"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={isSendingBroadcast || !broadcastText.trim()}
                className="py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingBroadcast ? 'Enviando...' : 'Transmitir a Todos'}</span>
              </button>
            </form>
            {broadcastSentSuccess && (
              <div className="text-xs text-emerald-400 font-bold animate-fadeIn">
                ✓ Comunicado emitido a todos los corredores y relojes en vivo.
              </div>
            )}
          </div>

          {/* Resumen de Grupos en Sesión */}
          <div className="bg-radar-card border border-radar-border rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Estado de los Grupos y Entrenadores
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(g => {
                const groupAthletes = athletes.filter(a => a.groupIds.includes(g.id));
                const activeInGroup = groupAthletes.filter(a => Date.now() - (a.lastSeen || 0) < 60000);
                return (
                  <div key={g.id} className="p-4 rounded-2xl bg-[#0B0F19] border border-radar-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{g.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {g.inviteCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{g.description || 'Sin descripción'}</p>
                    <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
                      <span>{groupAthletes.length} corredores</span>
                      <span className="text-emerald-400 font-bold">{activeInGroup.length} en vivo</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGroupId(g.id);
                        setUserRole('coach');
                      }}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspeccionar Radar del Grupo</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: RADAR SATELITAL GLOBAL */}
      {activeTab === 'map' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white">Radar Satelital Global</h2>
              <p className="text-xs text-slate-400">Visualizando a todos los corredores de todos los grupos simultáneamente en el mapa.</p>
            </div>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full">
              {athletes.filter(a => a.lastSample?.latitude).length} corredores con GPS activo
            </span>
          </div>
          <div className="rounded-3xl overflow-hidden border-2 border-radar-border shadow-2xl h-[600px]">
            <LiveMapView athletes={athletes} onSelectAthlete={() => {}} />
          </div>
        </div>
      )}

      {/* PESTAÑA 3: GESTIÓN DE GRUPOS */}
      {activeTab === 'groups' && (
        <div className="bg-radar-card border border-radar-border rounded-3xl p-6 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-white">Directorio Central de Grupos</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="w-full bg-[#0B0F19] border border-radar-border rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B0F19] uppercase font-bold text-[10px] text-slate-400 tracking-wider">
                <tr>
                  <th className="p-3">Grupo</th>
                  <th className="p-3">Código</th>
                  <th className="p-3">Horario</th>
                  <th className="p-3">Corredores</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-radar-border">
                {filteredGroups.map(g => (
                  <tr key={g.id} className="hover:bg-slate-900/50 transition">
                    <td className="p-3 font-bold text-white">{g.name}</td>
                    <td className="p-3 font-mono text-cyan-400">{g.inviteCode}</td>
                    <td className="p-3 text-slate-400">{g.schedule || 'A convenir'}</td>
                    <td className="p-3">
                      {athletes.filter(a => a.groupIds.includes(g.id)).length} atletas
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedGroupId(g.id);
                          setUserRole('coach');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition"
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: GESTIÓN DE CORREDORES */}
      {activeTab === 'athletes' && (
        <div className="bg-radar-card border border-radar-border rounded-3xl p-6 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-white">Todos los Corredores de la Plataforma</h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="w-full bg-[#0B0F19] border border-radar-border rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B0F19] uppercase font-bold text-[10px] text-slate-400 tracking-wider">
                <tr>
                  <th className="p-3">Atleta</th>
                  <th className="p-3">Email / Teléfono</th>
                  <th className="p-3">Grupos</th>
                  <th className="p-3">Sensor Activo</th>
                  <th className="p-3">Último Ritmo / FC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-radar-border">
                {filteredAthletes.map(a => (
                  <tr key={a.id} className="hover:bg-slate-900/50 transition">
                    <td className="p-3 font-bold text-white">
                      {a.name} {a.lastName}
                    </td>
                    <td className="p-3 text-slate-400">
                      <div>{a.email || 'Sin email'}</div>
                      {a.phone && <div className="text-cyan-400 font-mono text-[10px]">{a.phone}</div>}
                    </td>
                    <td className="p-3">
                      {a.groupIds?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {a.groupIds.map(gid => {
                            const grp = groups.find(g => g.id === gid);
                            return (
                              <span key={gid} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                                {grp?.name || gid}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-amber-400 text-[10px] font-semibold">Grupo Libre</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">
                      {a.lastSample?.sourceDevice || '📱 GPS Móvil'}
                    </td>
                    <td className="p-3">
                      {a.lastSample?.heartRate ? (
                        <span className="text-rose-400 font-bold">{a.lastSample.heartRate} BPM</span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
