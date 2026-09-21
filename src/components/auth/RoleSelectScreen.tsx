import React, { useState, useEffect } from 'react';
import { useRadar } from '../../context/RadarContext';
import { 
  Radio, 
  Users, 
  Heart, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Zap, 
  ChevronRight, 
  Sparkles, 
  Check, 
  Download, 
  Crown, 
  HelpCircle,
  Lock
} from 'lucide-react';
import { DeviceGuideModal } from '../common/DeviceGuideModal';

export const RoleSelectScreen: React.FC = () => {
  const { setUserRole, setCurrentRunnerId, isConnected, joinRunner } = useRadar();
  const [customRunnerName, setCustomRunnerName] = useState('');
  const [customRunnerLastName, setCustomRunnerLastName] = useState('');
  const [runnerCode, setRunnerCode] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Acceso Maestro Oculto (5 toques en el logo o URL secreta)
  const [secretTapCount, setSecretTapCount] = useState(0);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretPinInput, setSecretPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Detección automática por URL privada (?pin=30450890 o ?control=30450890)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const queryPin = params.get('pin') || params.get('control') || params.get('admin');
      if (queryPin === '30450890') {
        setUserRole('super_admin');
      }
    }
  }, [setUserRole]);

  const handleSecretTap = () => {
    setSecretTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setShowSecretModal(true);
        setSecretPinInput('');
        setPinError(false);
        return 0;
      }
      return next;
    });

    // Resetear contador tras 3 segundos de inactividad
    setTimeout(() => {
      setSecretTapCount(0);
    }, 3000);
  };

  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (secretPinInput.trim() === '30450890') {
      setShowSecretModal(false);
      setSecretPinInput('');
      setPinError(false);
      setUserRole('super_admin');
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar si ya corre instalada como app
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Verificar si ya capturamos el evento antes del render
    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredInstallPrompt = e;
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      (window as any).deferredInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // Si ya está instalada
    if (isStandalone) {
      alert('✓ RunRadar ya está instalada en tu dispositivo.');
      return;
    }

    const promptEvent = deferredPrompt || (window as any).deferredInstallPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsStandalone(true);
        }
      } catch (err) {
        console.warn('Error al ejecutar instalación:', err);
      } finally {
        setDeferredPrompt(null);
        (window as any).deferredInstallPrompt = null;
      }
    } else {
      alert('Se envió la solicitud al navegador para instalar RunRadar en tu pantalla de inicio.');
    }
  };

  const handleCoachLogin = () => {
    setUserRole('coach');
  };

  const handleRunnerLogin = async () => {
    if (customRunnerName.trim()) {
      const res = await joinRunner({
        name: customRunnerName.trim(),
        lastName: customRunnerLastName.trim() || 'Corredor',
        email: `${customRunnerName.toLowerCase().replace(/\s+/g, '')}@runradar.app`,
        inviteCode: runnerCode.trim().toUpperCase(),
        permissions: {
          heartRate: true,
          location: true,
          workouts: true,
          steps: true,
          cadence: true,
          elevation: true,
          calories: true,
          wearables: true,
          updatedAt: Date.now()
        }
      });
      if (res.success && res.athlete) {
        setCurrentRunnerId(res.athlete.id);
      }
    } else {
      setCurrentRunnerId(null);
    }
    setUserRole('runner');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-['Inter',sans-serif]">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Header */}
      <div className="relative z-10 text-center max-w-2xl mx-auto mb-8">
        <div 
          onClick={handleSecretTap}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/20 mb-4 border border-cyan-400/30 cursor-pointer select-none active:scale-95 transition-transform"
          title="RUNRADAR"
        >
          <Radio className="w-9 h-9 text-black animate-pulse" />
        </div>
        
        <div 
          onClick={handleSecretTap}
          className="flex items-center justify-center gap-2 mb-2 cursor-pointer select-none"
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-['JetBrains_Mono',monospace]">
            RUN<span className="text-cyan-400">RADAR</span>
          </h1>
          <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
            PRO
          </span>
        </div>
        
        <p className="text-slate-400 text-sm sm:text-base font-normal mb-3">
          Central de telemetría de running en tiempo real. Selecciona tu perfil para comenzar.
        </p>

        {/* Status pill & PWA Install Button */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isConnected ? 'Servidor de Telemetría Activo' : 'Conectando al servidor...'}</span>
          </div>

          <button
            onClick={handleInstallClick}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500 hover:text-black border border-cyan-500/30 text-cyan-400 text-xs font-bold transition shadow-sm hover:shadow-cyan-500/20 group"
            title="Instalar RunRadar como aplicación PWA"
          >
            <Download className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>{isStandalone ? '✓ App Instalada' : '📲 Instalar App (PWA)'}</span>
          </button>

          <button
            onClick={() => setIsGuideOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold transition shadow-sm group"
            title="Ver cómo conectar tu reloj, banda cardíaca o correr con tu celular"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>📖 Guía de Dispositivos</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        
        {/* Card: ENTRENADOR */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 group">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-1 rounded-full">
                Vista Técnica
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition">
              Soy Entrenador
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Gestiona todos tus grupos de entrenamiento. Monitorea a todo el pelotón en el mapa GPS, controla semáforos de esfuerzo y atiende alertas críticas al instante.
            </p>

            <ul className="space-y-2.5 mb-8 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span><strong>Hub de Grupos:</strong> Ver todos los grupos y entrar a monitorear</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span><strong>Radar en Vivo:</strong> Grilla de atletas + Mapa GPS interactivo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span><strong>Ficha Individual:</strong> Telemetría detallada por corredor</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleCoachLogin}
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition group-hover:gap-3"
          >
            <span>Ingresar como Entrenador</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card: CORREDOR */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 group">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                <Heart className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full">
                Vista Atleta
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition">
              Soy Corredor
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Sigue tu propio rendimiento biométrico en tiempo real y compáralo con el estado colectivo del pelotón.
            </p>

            {/* Profile Input & Group Code */}
            <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800 mb-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Tu Nombre:
                  </label>
                  <input
                    type="text"
                    value={customRunnerName}
                    onChange={(e) => setCustomRunnerName(e.target.value)}
                    placeholder="Ej: Laura"
                    className="w-full bg-slate-900 border border-slate-750 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Tu Apellido:
                  </label>
                  <input
                    type="text"
                    value={customRunnerLastName}
                    onChange={(e) => setCustomRunnerLastName(e.target.value)}
                    placeholder="Ej: Gómez"
                    className="w-full bg-slate-900 border border-slate-750 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center justify-between">
                  <span>Código de Grupo:</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Opcional</span>
                </label>
                <input
                  type="text"
                  value={runnerCode}
                  onChange={(e) => setRunnerCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-900 border border-slate-750 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold tracking-wider focus:outline-none uppercase"
                  placeholder="Ej: RUN-4821 (o déjalo en blanco)"
                />
              </div>
            </div>

            <ul className="space-y-2 mb-6 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Mi Estado Individual:</strong> FC en vivo, Zonas Z1-Z5 y ritmo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Estado Colectivo:</strong> Ritmo del pelotón y posición del grupo</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleRunnerLogin}
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition group-hover:gap-3"
          >
            <span>Ingresar como Corredor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer info con acceso secreto por toques */}
      <div 
        onClick={handleSecretTap}
        className="relative z-10 mt-12 text-center text-xs text-slate-500 cursor-pointer select-none hover:text-slate-400 transition"
        title="RunRadar"
      >
        RunRadar &copy; 2026 — Plataforma de Telemetría para Entrenadores y Grupos de Running
      </div>

      {/* Modal de Guía de Dispositivos */}
      <DeviceGuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
      />

      {/* Modal Secreto de Autenticación por PIN */}
      {showSecretModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowSecretModal(false)}
        >
          <div 
            className="bg-[#0e1422] border border-slate-700/80 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-scaleUp text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Centro de Control</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ingresa tu clave de seguridad</p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <input
                type="password"
                autoFocus
                value={secretPinInput}
                onChange={(e) => setSecretPinInput(e.target.value)}
                placeholder="PIN"
                maxLength={12}
                className={`w-full text-center text-xl font-mono tracking-widest bg-slate-900 border ${
                  pinError ? 'border-rose-500 text-rose-400 animate-shake' : 'border-slate-700 text-white focus:border-amber-400'
                } rounded-2xl px-4 py-3 focus:outline-none transition`}
              />

              {pinError && (
                <span className="text-xs text-rose-400 font-semibold block animate-fadeIn">
                  Código de seguridad incorrecto
                </span>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSecretModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition shadow-lg shadow-amber-500/20"
                >
                  Acceder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
