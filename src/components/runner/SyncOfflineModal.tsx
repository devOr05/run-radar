import React, { useState } from 'react';
import { useRadar } from '../../context/RadarContext';
import { 
  X, 
  Watch, 
  RotateCcw, 
  CheckCircle2, 
  Flame, 
  Heart, 
  Footprints, 
  Gauge, 
  Clock, 
  MapPin, 
  Radio, 
  Smartphone,
  ChevronRight,
  Send
} from 'lucide-react';
import { formatPace, formatDistance, formatDuration } from '../../lib/calculations';

interface SyncOfflineModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionSeconds?: number;
  currentDistanceMeters?: number;
  currentPaceSeconds?: number;
  currentHr?: number | null;
  currentCadence?: number;
  currentCalories?: number;
  currentSteps?: number;
  onSuccess?: () => void;
}

export const SyncOfflineModal: React.FC<SyncOfflineModalProps> = ({
  isOpen,
  onClose,
  currentSessionSeconds = 0,
  currentDistanceMeters = 0,
  currentPaceSeconds = 0,
  currentHr = null,
  currentCadence = 0,
  currentCalories = 0,
  currentSteps = 0,
  onSuccess
}) => {
  const { currentRunner, groups, saveCompletedSession } = useRadar();

  const runnerGroup = groups.find(g => currentRunner?.groupIds?.includes(g.id)) || null;

  // Modos: 'watch' (datos del reloj / offline) o 'current_app' (guardar cronómetro actual)
  const [syncMode, setSyncMode] = useState<'watch' | 'current_app'>(
    currentSessionSeconds > 60 ? 'current_app' : 'watch'
  );

  // Formulario reloj / offline
  const [deviceBrand, setDeviceBrand] = useState('Amazfit (Zepp OS)');
  const [distKm, setDistKm] = useState(
    currentDistanceMeters > 0 ? (currentDistanceMeters / 1000).toFixed(2) : '8.0'
  );
  const [minutes, setMinutes] = useState(
    currentSessionSeconds > 0 ? Math.floor(currentSessionSeconds / 60).toString() : '40'
  );
  const [seconds, setSeconds] = useState(
    currentSessionSeconds > 0 ? (currentSessionSeconds % 60).toString().padStart(2, '0') : '00'
  );
  const [avgHrInput, setAvgHrInput] = useState(currentHr ? currentHr.toString() : '155');
  const [maxHrInput, setMaxHrInput] = useState(currentHr ? (currentHr + 15).toString() : '174');
  const [cadenceInput, setCadenceInput] = useState(currentCadence > 0 ? currentCadence.toString() : '176');
  const [caloriesInput, setCaloriesInput] = useState(currentCalories > 0 ? currentCalories.toString() : '580');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRunner) return;

    setIsSubmitting(true);

    try {
      let finalDistanceMeters = 0;
      let finalDurationSeconds = 0;
      let finalAvgPaceSeconds = 0;
      let finalAvgHr = 0;
      let finalMaxHr = 0;
      let finalCadence = 0;
      let finalCalories = 0;
      let finalSteps = 0;
      let finalDevice = '';
      let finalSyncType: 'offline_sync' | 'live_stream' = 'offline_sync';

      if (syncMode === 'current_app') {
        finalDistanceMeters = Math.max(currentDistanceMeters, 100);
        finalDurationSeconds = Math.max(currentSessionSeconds, 10);
        finalAvgPaceSeconds = currentPaceSeconds > 0 
          ? currentPaceSeconds 
          : Math.round((finalDurationSeconds / (finalDistanceMeters / 1000)));
        finalAvgHr = currentHr || 152;
        finalMaxHr = currentHr ? currentHr + 12 : 168;
        finalCadence = currentCadence || 172;
        finalCalories = currentCalories || Math.round((finalDistanceMeters / 1000) * 65);
        finalSteps = currentSteps || Math.round((finalDurationSeconds / 60) * 172);
        finalDevice = '📱 RunRadar PWA (Celular)';
        finalSyncType = 'live_stream';
      } else {
        const kmNum = parseFloat(distKm) || 1;
        const totalSecs = (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0);
        finalDistanceMeters = Math.round(kmNum * 1000);
        finalDurationSeconds = Math.max(totalSecs, 60);
        finalAvgPaceSeconds = Math.round(finalDurationSeconds / kmNum);
        finalAvgHr = parseInt(avgHrInput, 10) || 150;
        finalMaxHr = parseInt(maxHrInput, 10) || (finalAvgHr + 15);
        finalCadence = parseInt(cadenceInput, 10) || 174;
        finalCalories = parseInt(caloriesInput, 10) || Math.round(kmNum * 68);
        finalSteps = Math.round((finalDurationSeconds / 60) * finalCadence);
        finalDevice = `⌚ ${deviceBrand}`;
        finalSyncType = 'offline_sync';
      }

      const now = new Date();
      const dateStr = `Hoy, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} hs`;

      await saveCompletedSession({
        groupId: runnerGroup?.id || 'group-general',
        groupName: runnerGroup?.name || 'Entrenamiento Libre',
        athleteId: currentRunner.id,
        athleteName: `${currentRunner.name} ${currentRunner.lastName}`.trim(),
        athleteAvatar: currentRunner.avatarUrl,
        sourceDevice: finalDevice,
        date: dateStr,
        startTime: Date.now() - (finalDurationSeconds * 1000),
        endTime: Date.now(),
        durationSeconds: finalDurationSeconds,
        distanceMeters: finalDistanceMeters,
        avgPaceSeconds: finalAvgPaceSeconds,
        bestPaceSeconds: Math.round(finalAvgPaceSeconds * 0.92),
        avgHeartRate: finalAvgHr,
        maxHeartRate: finalMaxHr,
        avgCadence: finalCadence,
        totalCalories: finalCalories,
        totalSteps: finalSteps,
        syncType: finalSyncType,
        notes: notes.trim() || undefined
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsSubmitting(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);

    } catch (err) {
      console.error('Error al sincronizar sesión:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-radar-card border border-radar-border rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-radar-border mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <RotateCcw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Sincronizar Entrenamiento
              </h3>
              <p className="text-xs text-slate-400">
                Grupo: <strong className="text-cyan-400">{runnerGroup?.name || 'Modo Libre'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-white">
              ¡Sesión Sincronizada con Éxito!
            </h4>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              Tus datos ya están registrados y visibles para tu entrenador en el grupo{' '}
              <strong className="text-emerald-400">{runnerGroup?.name || 'RunRadar'}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSyncSubmit} className="space-y-4">
            
            {/* Selector de Modo de Sincronización */}
            <div className="grid grid-cols-2 gap-2 bg-[#0B0F19] p-1.5 rounded-2xl border border-radar-border text-xs font-bold">
              <button
                type="button"
                onClick={() => setSyncMode('watch')}
                className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  syncMode === 'watch'
                    ? 'bg-cyan-500 text-black shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Watch className="w-4 h-4" />
                <span>Desde Reloj / Offline</span>
              </button>
              <button
                type="button"
                onClick={() => setSyncMode('current_app')}
                className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  syncMode === 'current_app'
                    ? 'bg-cyan-500 text-black shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Sesión Actual App</span>
              </button>
            </div>

            {/* MODO A: Guardar sesión actual que está corriendo en la app */}
            {syncMode === 'current_app' && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-[#0B0F19] border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                  <span>Datos capturados por el teléfono:</span>
                  <span className="text-cyan-400 font-mono">En vivo</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Tiempo</span>
                    <span className="text-sm font-black text-white font-mono">
                      {formatDuration(currentSessionSeconds)}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Distancia</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      {formatDistance(currentDistanceMeters)}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Pulso</span>
                    <span className="text-sm font-black text-rose-400 font-mono">
                      {currentHr ? `${currentHr} BPM` : '--'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Al confirmar, se guardará este registro y tu entrenador lo verá inmediatamente en el panel del grupo.
                </p>
              </div>
            )}

            {/* MODO B: Cargar datos desde reloj inteligente o actividad offline */}
            {syncMode === 'watch' && (
              <div className="space-y-3">
                
                {/* Selector de Dispositivo */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Dispositivo Utilizado
                  </label>
                  <select
                    value={deviceBrand}
                    onChange={(e) => setDeviceBrand(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Amazfit (Zepp OS)">⌚ Amazfit (Bip, Active, Balance, Cheetah)</option>
                    <option value="Xiaomi Smart Band (Mi Fitness)">⌚ Xiaomi Smart Band (8, 9, Pro)</option>
                    <option value="Garmin (Forerunner / Fenix)">⌚ Garmin (Forerunner, Fenix, Venu)</option>
                    <option value="Apple Watch">⌚ Apple Watch (Workouts)</option>
                    <option value="Banda Cardíaca de Pecho / Brazo">🫀 Banda de Pecho / Polar / Magene</option>
                    <option value="Otro Reloj Deportivo">⌚ Otro Reloj Inteligente</option>
                  </select>
                </div>

                {/* Distancia y Tiempo */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" /> Distancia (km)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      max="100"
                      value={distKm}
                      onChange={(e) => setDistKm(e.target.value)}
                      placeholder="8.50"
                      required
                      className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" /> Tiempo (Min : Seg)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="300"
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value)}
                        placeholder="45"
                        required
                        className="w-1/2 bg-[#0B0F19] border border-radar-border rounded-xl px-2 py-2 text-xs font-mono text-center text-white focus:outline-none focus:border-cyan-400"
                      />
                      <span className="text-slate-500 font-bold">:</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={seconds}
                        onChange={(e) => setSeconds(e.target.value)}
                        placeholder="00"
                        required
                        className="w-1/2 bg-[#0B0F19] border border-radar-border rounded-xl px-2 py-2 text-xs font-mono text-center text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Pulso Medio, Pulso Máximo, Cadencia */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500" /> FC Media
                    </label>
                    <input
                      type="number"
                      min="60"
                      max="220"
                      value={avgHrInput}
                      onChange={(e) => setAvgHrInput(e.target.value)}
                      placeholder="155"
                      required
                      className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-2 py-2 text-xs font-mono text-center text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-500" /> FC Máxima
                    </label>
                    <input
                      type="number"
                      min="60"
                      max="230"
                      value={maxHrInput}
                      onChange={(e) => setMaxHrInput(e.target.value)}
                      placeholder="174"
                      className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-2 py-2 text-xs font-mono text-center text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Footprints className="w-3 h-3 text-cyan-400" /> Cadencia
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="240"
                      value={cadenceInput}
                      onChange={(e) => setCadenceInput(e.target.value)}
                      placeholder="176"
                      className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-2 py-2 text-xs font-mono text-center text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Calorías */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Calorías quemadas (kCal)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={caloriesInput}
                    onChange={(e) => setCaloriesInput(e.target.value)}
                    placeholder="580"
                    className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

              </div>
            )}

            {/* Notas opcionales */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Comentarios / Sensaciones para el Entrenador (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Mucho viento en la vuelta, piernas cargadas en el km 6..."
                rows={2}
                className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            {/* Botón de Envío */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Sincronizando con el Entrenador...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 fill-black" />
                    <span>SINCRONIZAR Y ENVIAR AL GRUPO</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
