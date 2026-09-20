import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Hash, X, Camera, AlertCircle, Check, Loader2 } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (codeOrUrl: string) => Promise<{ success: boolean; error?: string }>;
  initialTab?: 'qr' | 'code';
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onJoin,
  initialTab = 'qr'
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
              setErrorMsg(res.error || 'Código de grupo no válido');
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
            'No se pudo acceder a la cámara. Por favor permite el acceso en Chrome o ingresa el código manual abajo.'
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
      setErrorMsg(res.error || 'Código incorrecto. Verifica con tu entrenador.');
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

        {/* Selector de Pestañas: Cámara QR vs Código Manual */}
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
            <span>Ingresar Código</span>
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
                  Ingresar Código Manualmente
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

        {/* PESTAÑA 2: INGRESAR CÓDIGO MANUAL */}
        {activeTab === 'code' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                Código de Invitación del Grupo:
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Ej: RUN-4821"
                className="w-full bg-slate-950 border-2 border-cyan-500/40 focus:border-cyan-400 rounded-2xl px-4 py-3 text-center text-xl font-black font-['JetBrains_Mono',monospace] tracking-widest text-cyan-400 uppercase outline-none transition"
                autoFocus
                required
              />
              <span className="text-[10px] text-slate-400 block mt-1.5 text-center">
                Pídele el código de 4 a 8 caracteres a tu entrenador.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
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
          </form>
        )}

      </div>
    </div>
  );
};
