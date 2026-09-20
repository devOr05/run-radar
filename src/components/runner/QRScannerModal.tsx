import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Hash, X, Camera, AlertCircle, Check, Loader2, Users } from 'lucide-react';
import { Group } from '../../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (codeOrUrl: string) => Promise<{ success: boolean; error?: string }>;
  initialTab?: 'qr' | 'code';
  availableGroups?: Group[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onJoin,
  initialTab = 'qr',
  availableGroups = []
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'code'>(initialTab);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
    setErrorMsg(null);
    setCameraError(null);
  }, [initialTab, isOpen]);

  // Manejo de la cámara para escaneo QR
  useEffect(() => {
    if (!isOpen || activeTab !== 'qr') {
      stopCamera();
      return;
    }

    let isMounted = true;
    const scannerId = 'runradar-qr-reader';

    const startScanner = async () => {
      setCameraError(null);
      setErrorMsg(null);

      // Pequeño delay para asegurar que el DOM del div está renderizado
      await new Promise((r) => setTimeout(r, 200));
      if (!isMounted) return;

      try {
        const scanner = new Html5Qrcode(scannerId);
        qrScannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 }
          },
          async (decodedText) => {
            if (!isMounted) return;
            setLoading(true);
            await stopCamera();
            const res = await onJoin(decodedText);
            setLoading(false);
            if (res.success) {
              onClose();
            } else {
              setErrorMsg(res.error || 'Código o grupo no válido');
              setActiveTab('code');
            }
          },
          () => {}
        );
        if (isMounted) setIsScanning(true);
      } catch (err: any) {
        console.warn('Error al iniciar cámara QR:', err);
        if (isMounted) {
          setCameraError(
            'No se pudo acceder a la cámara. Por favor permite el acceso en Chrome o ingresa el código o nombre del grupo abajo.'
          );
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const stopCamera = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        await qrScannerRef.current.stop();
      } catch (e) {}
    }
    qrScannerRef.current = null;
    setIsScanning(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    const res = await onJoin(manualCode.trim());
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Grupo no encontrado. Verifica con tu entrenador.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-['Inter',sans-serif] animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Conectar con Entrenador</h3>
              <p className="text-[10px] text-slate-400">Únete a tu grupo de entrenamiento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de Pestañas: Cámara QR vs Código / Nombre */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setActiveTab('qr');
            }}
            className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Escanear QR</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setErrorMsg(null);
              setActiveTab('code');
            }}
            className={`flex-1 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'code'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Código o Nombre</span>
          </button>
        </div>

        {/* Mensaje de Error si ocurrió */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PESTAÑA 1: ESCANEAR QR */}
        {activeTab === 'qr' && (
          <div className="space-y-3">
            {cameraError ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  {cameraError}
                </p>
                <button
                  onClick={() => {
                    stopCamera();
                    setActiveTab('code');
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs"
                >
                  Ingresar Código o Nombre
                </button>
              </div>
            ) : (
              <div>
                <div 
                  id="runradar-qr-reader" 
                  className="w-full aspect-square rounded-2xl overflow-hidden bg-black border-2 border-cyan-500/40 relative shadow-inner"
                />
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Apunta tu cámara al código QR que te muestra tu entrenador en su pantalla o en WhatsApp.
                </p>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: INGRESAR CÓDIGO MANUAL O NOMBRE */}
        {activeTab === 'code' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                Código o Nombre del Grupo:
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ej: RUN-4821 o Grupo Martes"
                className="w-full bg-slate-950 border-2 border-cyan-500/40 focus:border-cyan-400 rounded-2xl px-4 py-3 text-center text-lg font-bold text-cyan-400 outline-none transition placeholder:text-slate-600 placeholder:text-xs placeholder:font-normal"
                autoFocus
                required
              />
              <span className="text-[10px] text-slate-400 block mt-1.5 text-center">
                Escribe el código (ej. <span className="font-mono text-cyan-300">RUN-4821</span>) o el nombre del grupo.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando Grupo...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Unirme al Grupo
                </>
              )}
            </button>

            {/* Grupos disponibles para unirse directo con 1 clic */}
            {availableGroups && availableGroups.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-cyan-400" />
                  O toca un grupo para unirte directo:
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {availableGroups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        setErrorMsg(null);
                        const res = await onJoin(g.inviteCode || g.name);
                        setLoading(false);
                        if (res.success) {
                          onClose();
                        } else {
                          setErrorMsg(res.error || 'Error al unirse al grupo');
                        }
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-left transition flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition block truncate">
                          {g.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Código: <span className="font-mono text-cyan-300 font-bold">{g.inviteCode || 'N/A'}</span>
                          {g.schedule ? ` • ${g.schedule}` : ''}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/80 px-2 py-1 rounded-lg border border-cyan-800/40 group-hover:bg-cyan-500 group-hover:text-black transition shrink-0">
                        Unirse →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}

      </div>
    </div>
  );
};
