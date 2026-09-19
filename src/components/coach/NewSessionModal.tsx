import React, { useState } from 'react';
import { useRadar } from '../../context/RadarContext';
import { X, Play, Target, Gauge, Clock, Users } from 'lucide-react';

interface NewSessionModalProps {
  onClose: () => void;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({ onClose }) => {
  const { groups, selectedGroupId, startSession } = useRadar();
  
  const [name, setName] = useState('Entrenamiento 8 km Aeróbico');
  const [groupId, setGroupId] = useState(selectedGroupId || groups[0]?.id || 'group-martes');
  const [targetDistanceKm, setTargetDistanceKm] = useState(8);
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(60);
  const [targetPaceRange, setTargetPaceRange] = useState('5:30–6:15');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await startSession({
      name,
      groupId,
      targetDistanceKm: Number(targetDistanceKm),
      targetDurationMinutes: Number(targetDurationMinutes),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-radar-card border border-radar-border rounded-2xl p-6 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-[#0B0F19] border border-radar-border transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Play className="w-5 h-5 fill-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Nueva Sesión de Entrenamiento</h2>
            <p className="text-xs text-slate-400">Configura los objetivos y comienza el monitoreo en vivo.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Nombre de la Sesión
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
              placeholder="Ej: Fondo 10k o Fartlek"
            />
          </div>

          {/* Grupo */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" /> Grupo
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.athleteCount} corredores)
                </option>
              ))}
            </select>
          </div>

          {/* Distancia y Duración */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" /> Distancia (km)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="50"
                value={targetDistanceKm}
                onChange={(e) => setTargetDistanceKm(Number(e.target.value))}
                className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-yellow-400" /> Duración (min)
              </label>
              <input
                type="number"
                step="5"
                min="10"
                max="240"
                value={targetDurationMinutes}
                onChange={(e) => setTargetDurationMinutes(Number(e.target.value))}
                className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Ritmo y Zonas */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Ritmo Objetivo (min/km)
            </label>
            <input
              type="text"
              value={targetPaceRange}
              onChange={(e) => setTargetPaceRange(e.target.value)}
              className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
              placeholder="5:30–6:15"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-black" />
              INICIAR SESIÓN EN VIVO
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
