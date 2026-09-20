import React, { useState } from 'react';
import { useRadar } from '../../context/RadarContext';
import { Athlete } from '../../types';
import { 
  X, 
  Send, 
  Watch, 
  Radio, 
  Zap, 
  Heart, 
  AlertTriangle, 
  Sparkles,
  Droplets,
  Flame
} from 'lucide-react';

interface CoachMessageModalProps {
  athlete?: Athlete | null; // Si es null, el mensaje es para todo el grupo
  groupId: string;
  onClose: () => void;
  initialText?: string;
}

export const CoachMessageModal: React.FC<CoachMessageModalProps> = ({
  athlete,
  groupId,
  onClose,
  initialText = ''
}) => {
  const { coach, sendCoachMessage } = useRadar();
  const [messageText, setMessageText] = useState(initialText);
  const [messageType, setMessageType] = useState<'instruction' | 'warning' | 'cheer' | 'hydration'>('instruction');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const quickPresets = [
    { text: '¡Buen ritmo, mantener el paso!', type: 'cheer', icon: '🎯' },
    { text: 'Baja 15 seg/km, venís acelerado.', type: 'instruction', icon: '⏱️' },
    { text: 'Aflojá / Caminá. Pulso muy alto.', type: 'warning', icon: '⚠️' },
    { text: 'Momento de hidratarte (un sorbo de agua).', type: 'hydration', icon: '💧' },
    { text: 'Enganchate al pelotón, no te despegues.', type: 'instruction', icon: '🏃' },
    { text: '¡Sprint final últimos 400 metros!', type: 'cheer', icon: '⚡' },
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setIsSending(true);
    try {
      if (sendCoachMessage) {
        await sendCoachMessage({
          coachId: coach?.id || 'coach-1',
          coachName: coach?.name || 'Profesor',
          groupId,
          targetAthleteId: athlete?.id,
          targetAthleteName: athlete ? `${athlete.name} ${athlete.lastName}`.trim() : undefined,
          text: messageText.trim(),
          type: messageType
        });
      }
      setSentSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (e) {
      console.warn('Error al enviar mensaje del entrenador:', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#0B0F19] border-2 border-cyan-500/50 rounded-3xl p-6 shadow-2xl space-y-5">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-radar-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Watch className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                Mandar Orden al Reloj / Celular
              </h3>
              <p className="text-[11px] text-cyan-300 font-semibold">
                Destinatario: {athlete ? `${athlete.name} ${athlete.lastName}` : '📢 Todo el Pelotón'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="py-8 text-center space-y-2 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              ✓
            </div>
            <h4 className="text-base font-bold text-white">¡Orden enviada con éxito!</h4>
            <p className="text-xs text-slate-400">El reloj del corredor vibrará y mostrará el aviso en pantalla.</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            {/* Presets Rápidos */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Instrucciones Tácticas Rápidas (1 Toque)
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {quickPresets.map((preset) => (
                  <button
                    key={preset.text}
                    type="button"
                    onClick={() => {
                      setMessageText(preset.text);
                      setMessageType(preset.type as any);
                    }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-left transition text-[11px] text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{preset.icon}</span>
                    <span className="line-clamp-1">{preset.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Texto del Mensaje */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                Texto que aparecerá en el reloj / pantalla
              </label>
              <textarea
                rows={3}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Escribe la instrucción directa para el atleta..."
                className="w-full bg-slate-950 border border-radar-border rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            {/* Aviso de Transmisión al Reloj */}
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-200 flex items-center gap-2">
              <Watch className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Esta orden emite una notificación en Android que <b>hará vibrar el Amazfit / Smartwatch</b> del corredor.
              </span>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSending || !messageText.trim()}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold text-xs tracking-wide shadow-md shadow-cyan-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Transmitiendo...' : 'ENVIAR AL RELOJ'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
