import React, { useState } from 'react';
import { useRadar } from '../../context/RadarContext';
import { X, Users, Sparkles, Clock, Target, Gauge, ShieldCheck, Check } from 'lucide-react';
import { Group } from '../../types';

interface NewGroupModalProps {
  onClose: () => void;
  onCreated?: (group: Group) => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({ onClose, onCreated }) => {
  const { createGroup } = useRadar();
  
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('Lunes y Miércoles 19:00 hs');
  const [targetDistance, setTargetDistance] = useState(8);
  const [targetPaceMinMinutes, setTargetPaceMinMinutes] = useState('5:30');
  const [targetPaceMaxMinutes, setTargetPaceMaxMinutes] = useState('6:15');
  const [inviteCode, setInviteCode] = useState(() => `RUN-${Math.floor(1000 + Math.random() * 9000)}`);
  const [description, setDescription] = useState('Entrenamiento enfocado en resistencia aeróbica y progresión de ritmo.');

  const parsePaceToSeconds = (paceStr: string): number => {
    const parts = paceStr.split(':');
    if (parts.length === 2) {
      const min = parseInt(parts[0], 10) || 5;
      const sec = parseInt(parts[1], 10) || 0;
      return min * 60 + sec;
    }
    return 330;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const minSec = parsePaceToSeconds(targetPaceMinMinutes);
    const maxSec = parsePaceToSeconds(targetPaceMaxMinutes);

    const newGroup = await createGroup({
      name: name.trim(),
      schedule: schedule.trim(),
      description: description.trim(),
      inviteCode: inviteCode.trim().toUpperCase(),
      targetDistance: Number(targetDistance),
      targetPaceRange: [minSec, maxSec]
    });

    if (onCreated) {
      onCreated(newGroup);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-['JetBrains_Mono',monospace]">
              Crear Nuevo Grupo
            </h2>
            <p className="text-xs text-slate-400">
              Genera un pelotón con código QR y link directo para invitar corredores por WhatsApp.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          
          {/* Nombre del Grupo */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Nombre del Grupo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition"
              placeholder="Ej: Pelotón Fondistas B, 10K Progresivo, Mañanas Parque"
            />
          </div>

          {/* Días y Horarios */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Días y Horarios de Encuentro
            </label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition"
              placeholder="Ej: Martes y Jueves 19:30 hs"
            />
          </div>

          {/* Código de Invitación Automático */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Código de Acceso / Invitación
              </label>
              <button
                type="button"
                onClick={() => setInviteCode(`RUN-${Math.floor(1000 + Math.random() * 9000)}`)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline"
              >
                Generar otro
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full bg-[#0B0F19] border border-cyan-500/40 focus:border-cyan-400 rounded-xl px-4 py-3 font-mono font-bold text-cyan-400 text-base focus:outline-none uppercase tracking-widest transition"
                placeholder="RUN-XXXX"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Este código irá incluido en el link de WhatsApp y en el código QR para que tus atletas se unan con un toque.
            </p>
          </div>

          {/* Objetivos: Distancia y Ritmo */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                Distancia (km)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                step="0.5"
                value={targetDistance}
                onChange={(e) => setTargetDistance(Number(e.target.value))}
                className="w-full bg-[#0B0F19] border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                Ritmo Objetivo
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={targetPaceMinMinutes}
                  onChange={(e) => setTargetPaceMinMinutes(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 focus:border-cyan-400 rounded-xl px-2.5 py-2.5 text-white font-mono text-center text-xs focus:outline-none"
                  placeholder="5:30"
                />
                <span className="text-slate-500 text-xs">-</span>
                <input
                  type="text"
                  value={targetPaceMaxMinutes}
                  onChange={(e) => setTargetPaceMaxMinutes(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-800 focus:border-cyan-400 rounded-xl px-2.5 py-2.5 text-white font-mono text-center text-xs focus:outline-none"
                  placeholder="6:15"
                />
              </div>
            </div>
          </div>

          {/* Descripción opcional */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Descripción o Instrucciones
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none text-xs"
              placeholder="Objetivo del grupo, punto de encuentro..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition shadow-lg shadow-cyan-500/20"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Crear y Obtener Link / QR</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
