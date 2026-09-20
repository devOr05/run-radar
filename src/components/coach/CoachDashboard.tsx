import React, { useState, useMemo } from 'react';
import { useRadar } from '../../context/RadarContext';
import { AthleteCard } from './AthleteCard';
import { LiveMapView } from './LiveMapView';
import { AthleteDetailModal } from './AthleteDetailModal';
import { NewSessionModal } from './NewSessionModal';
import { GroupShareModal } from './GroupShareModal';
import { GroupChatDrawer } from '../chat/GroupChatDrawer';
import { GroupForumView } from '../forum/GroupForumView';
import { CoachMessageModal } from './CoachMessageModal';
import { AICoachingService } from '../../services/aiCoachingService';
import { Athlete, AICoachingSuggestion } from '../../types';
import { 
  Users, 
  Play, 
  Pause, 
  Square, 
  Download, 
  Plus, 
  QrCode, 
  Search, 
  LayoutGrid, 
  Map as MapIcon, 
  Activity,
  Heart,
  TrendingUp,
  Clock,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Watch,
  Zap,
  Radio,
  Pin
} from 'lucide-react';
import { formatDuration } from '../../lib/calculations';

export const CoachDashboard: React.FC = () => {
  const { 
    coach,
    groups, 
    athletes, 
    selectedGroupId, 
    setSelectedGroupId,
    selectedAthleteId,
    setSelectedAthleteId,
    activeSession,
    pauseSession,
    stopSession,
    exportCSV,
    groupMessages,
    sendCoachMessage
  } = useRadar();

  const [activeTab, setActiveTab] = useState<'grid' | 'map' | 'forum'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'alert' | 'attention' | 'normal' | 'offline'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCoachMessageModalOpen, setIsCoachMessageModalOpen] = useState(false);
  const [selectedTargetAthlete, setSelectedTargetAthlete] = useState<Athlete | null>(null);
  const [initialTacticalText, setInitialTacticalText] = useState('');

  const currentGroup = groups.find(g => g.id === selectedGroupId) || groups[0];

  // Atletas pertenecientes al grupo actual
  const groupAthletes = useMemo(() => {
    if (!currentGroup) return [];
    return athletes.filter(a => a.groupIds.includes(currentGroup.id));
  }, [athletes, currentGroup]);

  // Filtrado por estado y búsqueda
  const filteredAthletes = useMemo(() => {
    return groupAthletes.filter((ath) => {
      const matchesStatus = filterStatus === 'all' || ath.currentStatus === filterStatus;
      const fullName = `${ath.name} ${ath.lastName}`.toLowerCase();
      const devName = ath.devices.map(d => d.name).join(' ').toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || devName.includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    }).sort((a, b) => {
      // Prioridad de orden: 🔴 ALERTA primero, luego 🟡 ATENCIÓN, luego 🟢 NORMAL, luego ⚪ OFFLINE
      const order = { alert: 0, attention: 1, normal: 2, offline: 3 };
      return order[a.currentStatus] - order[b.currentStatus];
    });
  }, [groupAthletes, filterStatus, searchQuery]);

  const aiSuggestions = useMemo(() => {
    return AICoachingService.generateSuggestions(
      groupAthletes,
      currentGroup,
      activeSession?.stats?.durationSeconds || 0
    );
  }, [groupAthletes, currentGroup, activeSession]);

  const groupMessageCount = useMemo(() => {
    if (!currentGroup) return 0;
    return groupMessages.filter(m => m.groupId === currentGroup.id).length;
  }, [groupMessages, currentGroup]);

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId) || null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-6">
      
      {/* Barra de Navegación del Grupo: Volver al Hub de Grupos + Acciones Rápidas */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedGroupId(null)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>← Todos los Grupos</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
                {currentGroup?.inviteCode}
              </span>
              <h1 className="text-lg font-black text-white tracking-tight">
                {currentGroup?.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Acciones de Comunicación y Selector de Grupo */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Chat en Vivo del Pelotón */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition shadow-sm"
            title="Chat interno con corredores del grupo"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
            {groupMessageCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-black text-[10px] font-black">
                {groupMessageCount}
              </span>
            )}
          </button>

          {/* Botón Enviar Orden Táctica al Reloj */}
          <button
            onClick={() => {
              setSelectedTargetAthlete(null);
              setInitialTacticalText('');
              setIsCoachMessageModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition shadow-sm"
            title="Enviar mensaje táctico al smartwatch del grupo o corredor"
          >
            <Watch className="w-3.5 h-3.5 text-amber-400" />
            <span>Orden al Reloj</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Selector desplegable de grupos */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden lg:inline">Grupo:</span>
            <select
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 font-medium"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* 1. SECCIÓN: MIS GRUPOS (Selector superior con contadores tipo semáforo) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" /> Mis Grupos de Entrenamiento
          </h2>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Código / QR de Invitación</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {groups.map((group) => {
            const isSelected = group.id === selectedGroupId;
            const summary = group.statusSummary;

            return (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`text-left p-4 rounded-2xl border transition relative overflow-hidden ${
                  isSelected
                    ? 'bg-radar-card border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'bg-radar-card/60 border-radar-border hover:bg-radar-card hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                    🏃 {group.name}
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-[#0B0F19] px-2 py-0.5 rounded-full border border-radar-border">
                    {group.athleteCount} corredores
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold font-mono">
                  <span className="flex items-center gap-1 text-emerald-400">
                    🟢 {summary.normal}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    🟡 {summary.attention}
                  </span>
                  <span className="flex items-center gap-1 text-red-400">
                    🔴 {summary.alert}
                  </span>
                </div>

                {group.schedule && (
                  <p className="text-[11px] text-slate-400 mt-2">
                    📅 {group.schedule}
                  </p>
                )}

                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. BARRA DE SESIÓN EN VIVO O CONTROL */}
      <div className="bg-gradient-to-r from-radar-card via-slate-900 to-radar-card p-4 rounded-2xl border border-radar-border shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Info Sesión */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                  {activeSession?.status === 'active' ? '🔴 EN VIVO' : 'PAUSADA / ESPERA'}
                </span>
                <h3 className="font-extrabold text-white text-base sm:text-lg">
                  {activeSession ? activeSession.name : 'Monitoreo General de Grupo'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Grupo: <strong className="text-cyan-400">{currentGroup?.name}</strong> • {currentGroup?.athleteCount} atletas vinculados
              </p>
            </div>
          </div>

          {/* Métricas Agregadas en Vivo */}
          <div className="flex items-center gap-4 sm:gap-6 bg-[#0B0F19]/80 px-4 py-2 rounded-xl border border-radar-border">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">FC Promedio</span>
              <span className="text-base font-black text-white font-mono flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                {activeSession?.stats?.avgHeartRate || 153} <span className="text-xs font-normal text-slate-400">BPM</span>
              </span>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Distancia Total</span>
              <span className="text-base font-black text-white font-mono text-emerald-400">
                {activeSession?.stats?.totalDistanceKm || 92.4} km
              </span>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tiempo</span>
              <span className="text-base font-black text-white font-mono text-cyan-400 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(activeSession?.stats?.durationSeconds || 2294)}
              </span>
            </div>
          </div>

          {/* Botones de Control de Sesión */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {activeSession ? (
              <>
                <button
                  onClick={pauseSession}
                  className="px-3 py-2 rounded-xl bg-[#0B0F19] text-amber-300 border border-amber-500/40 hover:bg-amber-500/10 transition text-xs font-bold flex items-center gap-1.5"
                >
                  {activeSession.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {activeSession.status === 'active' ? 'Pausar' : 'Reanudar'}
                </button>
                <button
                  onClick={stopSession}
                  className="px-3 py-2 rounded-xl bg-red-950/40 text-red-400 border border-red-500/40 hover:bg-red-900/40 transition text-xs font-bold flex items-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 fill-red-400" />
                  Finalizar
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsNewSessionOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs tracking-wide shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Nueva Sesión
              </button>
            )}

            <button
              onClick={() => exportCSV()}
              className="px-3 py-2 rounded-xl bg-radar-card text-slate-300 border border-radar-border hover:border-slate-600 transition text-xs font-bold flex items-center gap-1.5"
              title="Descargar reporte en formato CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2.5 ASISTENTE IA DE ENTRENAMIENTO (RUNNING COPILOT) */}
      {aiSuggestions.length > 0 && (
        <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-cyan-950/30 border border-purple-500/30 p-4 rounded-2xl shadow-xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-pulse text-purple-400" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  AI Running Copilot • Sugerencias Tácticas en Vivo
                </h3>
                <span className="text-[11px] text-slate-400">
                  {aiSuggestions.length} alertas y recomendaciones tácticas detectadas en el pelotón
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/50">
              ⚡ 1 toque al reloj
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiSuggestions.slice(0, 3).map((sug) => (
              <div
                key={sug.id}
                className="bg-slate-900/90 border border-purple-500/20 hover:border-purple-500/40 rounded-xl p-3 flex flex-col justify-between space-y-2 transition shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      🏃 {sug.athleteName}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      sug.priority === 'high' 
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/50' 
                        : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                    }`}>
                      {sug.currentValue}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {sug.triggerReason}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate-300 truncate italic">
                    "{sug.suggestedMessage}"
                  </span>
                  <button
                    onClick={() => {
                      const ath = athletes.find(a => a.id === sug.athleteId) || null;
                      setSelectedTargetAthlete(ath);
                      setInitialTacticalText(sug.suggestedMessage);
                      setIsCoachMessageModalOpen(true);
                    }}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-black font-extrabold text-[11px] shadow-sm flex items-center gap-1 transition"
                  >
                    <Watch className="w-3 h-3" />
                    <span>Enviar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. BARRA DE FILTROS RÁPIDOS Y BÚSQUEDA */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Filtros de Estado */}
        <div className="flex flex-wrap items-center gap-1.5 bg-radar-card p-1 rounded-xl border border-radar-border text-xs font-bold">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            TODOS ({groupAthletes.length})
          </button>
          <button
            onClick={() => setFilterStatus('alert')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              filterStatus === 'alert' ? 'bg-red-900/80 text-red-300 border border-red-500/50 shadow' : 'text-red-400 hover:bg-red-950/30'
            }`}
          >
            🔴 ALERTAS ({currentGroup?.statusSummary.alert || 0})
          </button>
          <button
            onClick={() => setFilterStatus('attention')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              filterStatus === 'attention' ? 'bg-amber-900/80 text-amber-300 border border-amber-500/50 shadow' : 'text-amber-400 hover:bg-amber-950/30'
            }`}
          >
            🟡 ATENCIÓN ({currentGroup?.statusSummary.attention || 0})
          </button>
          <button
            onClick={() => setFilterStatus('normal')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              filterStatus === 'normal' ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 shadow' : 'text-emerald-400 hover:bg-emerald-950/30'
            }`}
          >
            🟢 NORMALES ({currentGroup?.statusSummary.normal || 0})
          </button>
          <button
            onClick={() => setFilterStatus('offline')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              filterStatus === 'offline' ? 'bg-slate-800 text-slate-300 border border-slate-700 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚪ SIN DATOS ({currentGroup?.statusSummary.offline || 0})
          </button>
        </div>

        {/* Buscador + Selector de Vista (Grilla vs Mapa vs Foro) */}
        <div className="flex items-center gap-2">
          
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar corredor o dispositivo..."
              className="w-full bg-radar-card border border-radar-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex bg-radar-card p-0.5 rounded-xl border border-radar-border text-xs">
            <button
              onClick={() => setActiveTab('grid')}
              className={`p-1.5 rounded-lg transition ${
                activeTab === 'grid' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista en Tarjetas de Telemetría"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`p-1.5 rounded-lg transition ${
                activeTab === 'map' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Vista en Mapa en Vivo"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('forum')}
              className={`p-1.5 rounded-lg transition flex items-center gap-1 ${
                activeTab === 'forum' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Muro y Foro Comunitario"
            >
              <Pin className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* 4. CONTENIDO PRINCIPAL: GRILLA DE ATLETAS, MAPA O FORO */}
      {activeTab === 'grid' && (
        <div>
          {filteredAthletes.length === 0 ? (
            <div className="text-center py-16 bg-radar-card/40 rounded-2xl border border-radar-border">
              <Users className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <h4 className="text-sm font-bold text-slate-300">No se encontraron corredores</h4>
              <p className="text-xs text-slate-500 mt-1">Prueba cambiando el filtro de estado o el término de búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {filteredAthletes.map((athlete) => (
                <AthleteCard
                  key={athlete.id}
                  athlete={athlete}
                  onClick={() => setSelectedAthleteId(athlete.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'map' && (
        <LiveMapView
          athletes={filteredAthletes}
          onSelectAthlete={(id) => setSelectedAthleteId(id)}
        />
      )}

      {activeTab === 'forum' && currentGroup && (
        <GroupForumView groupId={currentGroup.id} />
      )}

      {/* Modal de Detalle de Atleta */}
      {selectedAthlete && (
        <AthleteDetailModal
          athlete={selectedAthlete}
          onClose={() => setSelectedAthleteId(null)}
        />
      )}

      {/* Modal de Nueva Sesión */}
      {isNewSessionOpen && (
        <NewSessionModal
          onClose={() => setIsNewSessionOpen(false)}
        />
      )}

      {/* Modal de Invitación / QR & WhatsApp */}
      {isInviteOpen && currentGroup && (
        <GroupShareModal
          group={currentGroup}
          onClose={() => setIsInviteOpen(false)}
        />
      )}

      {/* Drawer de Chat en Vivo del Pelotón */}
      {currentGroup && (
        <GroupChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          groupId={currentGroup.id}
        />
      )}

      {/* Modal de Enviar Orden Táctica al Reloj */}
      {isCoachMessageModalOpen && currentGroup && (
        <CoachMessageModal
          athlete={selectedTargetAthlete}
          groupId={currentGroup.id}
          initialText={initialTacticalText}
          onClose={() => {
            setIsCoachMessageModalOpen(false);
            setSelectedTargetAthlete(null);
            setInitialTacticalText('');
          }}
        />
      )}

    </div>
  );
};
