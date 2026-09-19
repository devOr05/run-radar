import React, { useState } from 'react';
import { useRadar } from '../../context/RadarContext';
import { Group } from '../../types';
import { 
  Users, 
  Play, 
  Pause, 
  ArrowRight, 
  QrCode, 
  Activity, 
  Plus, 
  Calendar, 
  ShieldAlert, 
  Heart, 
  Sparkles,
  ChevronRight,
  Radio
} from 'lucide-react';
import { NewSessionModal } from './NewSessionModal';
import { GroupShareModal } from './GroupShareModal';

export const CoachGroupsHub: React.FC = () => {
  const { groups, athletes, setSelectedGroupId, activeSession, startSession } = useRadar();
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [selectedGroupForQR, setSelectedGroupForQR] = useState<Group | null>(null);

  // Totales globales para el resumen superior
  const totalAthletes = athletes.length;
  const alertAthletesCount = athletes.filter(a => a.currentStatus === 'alert').length;
  const attentionAthletesCount = athletes.filter(a => a.currentStatus === 'attention').length;
  const normalAthletesCount = athletes.filter(a => a.currentStatus === 'normal').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 space-y-8">
      
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-800/40 px-2 py-0.5 rounded-full">
              Panel del Entrenador • Nivel 1
            </span>
            <span className="text-xs text-slate-400">• Todos los Grupos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-['JetBrains_Mono',monospace]">
            Central de Grupos de Entrenamiento
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Selecciona un grupo para entrar a la sala de radar en vivo, ver telemetría individual y gestionar la sesión.
          </p>
        </div>

        <button
          onClick={() => setIsNewSessionModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition shadow-lg shadow-cyan-500/20 shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Iniciar Nueva Sesión</span>
        </button>
      </div>

      {/* Global Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Total Grupos</span>
          <span className="text-2xl font-black text-white font-['JetBrains_Mono',monospace]">
            {groups.length}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Corredores Conectados</span>
          <span className="text-2xl font-black text-white font-['JetBrains_Mono',monospace] flex items-center gap-2">
            {totalAthletes}
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">En Esfuerzo Normal</span>
          <span className="text-2xl font-black text-emerald-400 font-['JetBrains_Mono',monospace]">
            {normalAthletesCount}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">En Alerta / Precaución</span>
          <span className="text-2xl font-black text-red-400 font-['JetBrains_Mono',monospace] flex items-center gap-1.5">
            {alertAthletesCount + attentionAthletesCount}
            {(alertAthletesCount > 0) && (
              <span className="text-[10px] uppercase tracking-wider bg-red-950 text-red-400 border border-red-800/40 px-1.5 py-0.5 rounded font-sans">
                {alertAthletesCount} crítica{alertAthletesCount > 1 ? 's' : ''}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Group Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Tus Grupos Activos ({groups.length})
          </h2>
          <span className="text-xs text-slate-500">
            Haz clic en un grupo para entrar al radar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const isGroupActive = activeSession?.groupId === group.id && activeSession.status === 'active';
            const groupAthletes = athletes.filter(a => a.groupIds.includes(group.id));
            const alertCount = groupAthletes.filter(a => a.currentStatus === 'alert').length;
            const attentionCount = groupAthletes.filter(a => a.currentStatus === 'attention').length;
            const normalCount = groupAthletes.filter(a => a.currentStatus === 'normal').length;

            return (
              <div
                key={group.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/10 group cursor-pointer"
                onClick={() => setSelectedGroupId(group.id)}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                          {group.inviteCode}
                        </span>
                        {isGroupActive && (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-800/60 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            En Vivo
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition">
                        {group.name}
                      </h3>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/40 transition">
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                    {group.description || 'Grupo regular de entrenamiento y fondo.'}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{group.schedule || 'Horario a coordinar'}</span>
                  </div>

                  {/* Semáforo del grupo */}
                  <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 mb-6">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                      <span>Semáforo del Grupo</span>
                      <span className="text-slate-300">{groupAthletes.length} atletas</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-lg py-1.5 px-2">
                        <span className="text-[10px] text-emerald-400 block font-semibold">Normal</span>
                        <span className="text-sm font-black text-emerald-400 font-['JetBrains_Mono',monospace]">
                          {normalCount}
                        </span>
                      </div>

                      <div className="bg-amber-950/30 border border-amber-900/40 rounded-lg py-1.5 px-2">
                        <span className="text-[10px] text-amber-400 block font-semibold">Atención</span>
                        <span className="text-sm font-black text-amber-400 font-['JetBrains_Mono',monospace]">
                          {attentionCount}
                        </span>
                      </div>

                      <div className="bg-red-950/30 border border-red-900/40 rounded-lg py-1.5 px-2">
                        <span className="text-[10px] text-red-400 block font-semibold">Alerta</span>
                        <span className="text-sm font-black text-red-400 font-['JetBrains_Mono',monospace]">
                          {alertCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroupForQR(group);
                    }}
                    className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Código QR e Invitación"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroupId(group.id);
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 hover:text-black border border-cyan-500/30 text-cyan-400 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Entrar al Grupo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR & WhatsApp Share Modal */}
      {selectedGroupForQR && (
        <GroupShareModal
          group={selectedGroupForQR}
          onClose={() => setSelectedGroupForQR(null)}
        />
      )}

      {/* Modal de Nueva Sesión */}
      {isNewSessionModalOpen && (
        <NewSessionModal onClose={() => setIsNewSessionModalOpen(false)} />
      )}

    </div>
  );
};
