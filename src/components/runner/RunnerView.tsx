import React, { useState, useEffect, useMemo } from 'react';
import { useRadar } from '../../context/RadarContext';
import { AthletePermissions, MetricSample } from '../../types';
import { PhoneSensorAdapter, BluetoothHeartRateAdapter, BluetoothDeviceInfo } from '../../adapters';
import { LiveMapView } from '../coach/LiveMapView';
import { 
  Heart, 
  MapPin, 
  Activity, 
  Footprints, 
  Flame, 
  Watch, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  Radio, 
  ChevronRight, 
  Zap, 
  AlertCircle,
  Bluetooth,
  Users,
  TrendingUp,
  Gauge,
  Compass,
  QrCode,
  Hash,
  LogOut,
  Pencil,
  RefreshCw
} from 'lucide-react';
import { formatPace, formatDistance, formatDuration, calculateHeartRateZone, getZoneDetails } from '../../lib/calculations';
import { QRScannerModal } from './QRScannerModal';

export const RunnerView: React.FC = () => {
  const { currentRunner, joinRunner, updateRunnerPermissions, updateRunnerProfile, joinGroup, leaveGroup, groups, athletes, coach, emitRunnerSample } = useRadar();

  // Pasos de Onboarding: 1. Intro, 2. Datos, 3. Entrenador, 4. Permisos, 5. Mi Entrenamiento (Listo)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(currentRunner ? 5 : 1);

  // Formulario de Registro
  const [name, setName] = useState(currentRunner?.name || '');
  const [lastName, setLastName] = useState(currentRunner?.lastName || '');
  const [email, setEmail] = useState(currentRunner?.email || '');
  const [phone, setPhone] = useState(currentRunner?.phone || '');
  const [inviteCode, setInviteCode] = useState('');

  // Modal para escanear QR o ingresar código de entrenador
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinModalInitialTab, setJoinModalInitialTab] = useState<'qr' | 'code'>('qr');

  // Modal para editar perfil
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState(currentRunner?.name || '');
  const [editLastName, setEditLastName] = useState(currentRunner?.lastName || '');
  const [editEmail, setEditEmail] = useState(currentRunner?.email || '');
  const [editPhone, setEditPhone] = useState(currentRunner?.phone || '');

  // Información del reloj / sensor Bluetooth conectado
  const [bleDeviceInfo, setBleDeviceInfo] = useState<BluetoothDeviceInfo | null>(null);
  const [bleAdapterInstance, setBleAdapterInstance] = useState<BluetoothHeartRateAdapter | null>(null);

  // Cronómetro real de la sesión (inicia en 00:00 al entrar al entrenamiento)
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    if (step === 5) {
      const timer = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  // Nivel de batería real del dispositivo (navigator.getBattery)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        const update = () => setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', update);
        return () => battery.removeEventListener('levelchange', update);
      }).catch(() => {});
    }
  }, []);

  // Permisos granulares
  const [permissions, setPermissions] = useState<AthletePermissions>({
    heartRate: true,
    location: true,
    workouts: true,
    steps: true,
    cadence: true,
    elevation: true,
    calories: true,
    wearables: true,
    updatedAt: Date.now()
  });

  const [isBluetoothConnecting, setIsBluetoothConnecting] = useState(false);
  const [isScanningHr, setIsScanningHr] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<'idle' | 'connected' | 'reconnecting' | 'unsupported'>('idle');
  const [activeScreenTab, setActiveScreenTab] = useState<'individual' | 'collective' | 'permissions'>('individual');

  // Conectar adaptador local de Sensores del Celular (GPS + acelerómetro)
  useEffect(() => {
    if (step === 5) {
      const phoneAdapter = new PhoneSensorAdapter();
      phoneAdapter.connect().then((ok) => {
        if (ok) {
          phoneAdapter.startStream((sample) => {
            if (emitRunnerSample) {
              emitRunnerSample({
                ...sample,
                battery: batteryLevel ?? sample.battery
              });
            }
          });
        }
      });

      return () => {
        phoneAdapter.stopStream();
      };
    }
  }, [step, emitRunnerSample, batteryLevel]);

  const handleJoin = async () => {
    const res = await joinRunner({
      name,
      lastName,
      email,
      phone,
      inviteCode,
      permissions
    });
    if (res.success) {
      setStep(5);
    } else {
      alert(res.error || 'Código incorrecto');
    }
  };

  const handleTogglePermission = (key: keyof AthletePermissions) => {
    const updated = { ...permissions, [key]: !permissions[key], updatedAt: Date.now() };
    setPermissions(updated);
    if (currentRunner) {
      updateRunnerPermissions(currentRunner.id, updated);
    }
  };

  // Sincronizar campos de edición al cargar/cambiar el corredor
  useEffect(() => {
    if (currentRunner) {
      setEditName(currentRunner.name || '');
      setEditLastName(currentRunner.lastName || '');
      setEditEmail(currentRunner.email || '');
      setEditPhone(currentRunner.phone || '');
    }
  }, [currentRunner]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Por favor ingresa tu nombre');
      return;
    }
    await updateRunnerProfile({
      name: editName.trim(),
      lastName: editLastName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim()
    });
    setShowEditProfileModal(false);
  };

  // Cargar reloj previamente vinculado de forma permanente y auto-reconectar en segundo plano
  useEffect(() => {
    try {
      const saved = localStorage.getItem('runradar_paired_watch');
      if (saved) {
        const parsed = JSON.parse(saved) as BluetoothDeviceInfo;
        setBleDeviceInfo(parsed);
        // Intentar reconexión automática en segundo plano
        const bleAdapter = new BluetoothHeartRateAdapter();
        bleAdapter.tryAutoReconnect(parsed.id).then((reconnected) => {
          if (reconnected) {
            setBleAdapterInstance(bleAdapter);
            setBluetoothStatus('connected');
            const updatedInfo = bleAdapter.getDeviceInfo();
            if (updatedInfo) {
              setBleDeviceInfo(updatedInfo);
              localStorage.setItem('runradar_paired_watch', JSON.stringify(updatedInfo));
            }
            bleAdapter.onInfoUpdated((info) => {
              setBleDeviceInfo({ ...info });
            });
            bleAdapter.onDisconnect(() => {
              if (bleAdapter.status === 'pending') {
                setBluetoothStatus('reconnecting');
              } else {
                setBluetoothStatus('idle');
              }
            });
            bleAdapter.startStream((sample) => {
              if (emitRunnerSample) {
                emitRunnerSample({
                  ...sample,
                  sourceDevice: `⌚ ${bleAdapter.getDeviceInfo()?.name || parsed.name || 'Reloj Deportivo'}`
                });
              }
              const current = bleAdapter.getDeviceInfo();
              if (current) {
                setBleDeviceInfo({ ...current });
              }
            });
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Error al cargar reloj vinculado', e);
    }
  }, [emitRunnerSample]);

  const handleConnectBluetooth = async () => {
    setIsBluetoothConnecting(true);
    if (bleAdapterInstance) {
      try {
        await bleAdapterInstance.disconnect();
      } catch (e) {}
    }
    const bleAdapter = new BluetoothHeartRateAdapter();
    const ok = await bleAdapter.connect();
    setIsBluetoothConnecting(false);
    if (ok) {
      const info = bleAdapter.getDeviceInfo();
      setBleDeviceInfo(info);
      setBleAdapterInstance(bleAdapter);
      setBluetoothStatus('connected');

      // Guardar reloj vinculado de manera permanente
      try {
        if (info) {
          localStorage.setItem('runradar_paired_watch', JSON.stringify(info));
        }
      } catch (e) {}

      bleAdapter.onInfoUpdated((updated) => {
        setBleDeviceInfo({ ...updated });
      });

      bleAdapter.onDisconnect(() => {
        if (bleAdapter.status === 'pending') {
          setBluetoothStatus('reconnecting');
        } else {
          setBluetoothStatus('idle');
        }
      });

      bleAdapter.startStream((sample) => {
        if (emitRunnerSample) {
          emitRunnerSample({
            ...sample,
            sourceDevice: `⌚ ${info?.name || 'Reloj Deportivo'}`
          });
        }
        const current = bleAdapter.getDeviceInfo();
        if (current) {
          setBleDeviceInfo({ ...current });
        }
      });
    } else {
      setBluetoothStatus('unsupported');
    }
  };

  const handleForceScanHr = async () => {
    if (!bleAdapterInstance) return;
    setIsScanningHr(true);
    try {
      const found = await bleAdapterInstance.forceScanHeartRate();
      const updated = bleAdapterInstance.getDeviceInfo();
      if (updated) {
        setBleDeviceInfo({ ...updated });
      }
      if (found) {
        setBluetoothStatus('connected');
      }
    } catch (e) {
      console.warn('Error al forzar escaneo de canal FC:', e);
    } finally {
      setIsScanningHr(false);
    }
  };

  const handleDisconnectBluetooth = async () => {
    if (bleAdapterInstance) {
      await bleAdapterInstance.disconnect();
    }
    setBleAdapterInstance(null);
    setBleDeviceInfo(null);
    setBluetoothStatus('idle');
    try {
      localStorage.removeItem('runradar_paired_watch');
    } catch (e) {}
  };

  const sample = currentRunner?.lastSample;
  // Solo valores biométricos REALES (si no hay sensor conectado o no hay lectura, es null)
  const hr = sample?.heartRate ?? null;
  const hrZone = hr ? calculateHeartRateZone(hr, currentRunner?.maxHeartRate || 185) : null;
  const zoneInfo = hrZone ? getZoneDetails(hrZone) : null;

  // Cálculos de Estado Colectivo del Grupo
  const runnerGroup = groups.find(g => currentRunner?.groupIds?.includes(g.id)) || null;
  const isCoachConnected = !!runnerGroup;
  const groupAthletes = useMemo(() => {
    if (!runnerGroup) return currentRunner ? [currentRunner] : [];
    return athletes.filter(a => a.groupIds.includes(runnerGroup.id));
  }, [athletes, runnerGroup, currentRunner]);

  const avgHeartRate = useMemo(() => {
    const withHR = groupAthletes.filter(a => a.lastSample?.heartRate);
    if (withHR.length === 0) return 0;
    const sum = withHR.reduce((acc, a) => acc + (a.lastSample?.heartRate || 0), 0);
    return Math.round(sum / withHR.length);
  }, [groupAthletes]);

  const avgPace = useMemo(() => {
    const withPace = groupAthletes.filter(a => a.lastSample?.pace);
    if (withPace.length === 0) return 0;
    const sum = withPace.reduce((acc, a) => acc + (a.lastSample?.pace || 0), 0);
    return Math.round(sum / withPace.length);
  }, [groupAthletes]);

  const avgDistance = useMemo(() => {
    const withDist = groupAthletes.filter(a => a.lastSample?.distance);
    if (withDist.length === 0) return 0;
    const sum = withDist.reduce((acc, a) => acc + (a.lastSample?.distance || 0), 0);
    return Math.round(sum / withDist.length);
  }, [groupAthletes]);

  const groupNormalCount = groupAthletes.filter(a => a.currentStatus === 'normal').length;
  const groupAttentionCount = groupAthletes.filter(a => a.currentStatus === 'attention').length;
  const groupAlertCount = groupAthletes.filter(a => a.currentStatus === 'alert').length;

  const currentPace = sample?.pace ?? null;
  const paceDiff = (currentPace !== null && avgPace > 0) ? currentPace - avgPace : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      
      {/* ================= PASO 1: BIENVENIDA ================= */}
      {step === 1 && (
        <div className="bg-radar-card border border-radar-border rounded-3xl p-6 sm:p-8 text-center shadow-2xl animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/20">
            <Radio className="w-8 h-8 text-black" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            Bienvenido a <span className="text-cyan-400">RunRadar</span>
          </h2>
          
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
            Tu entrenador podrá acompañar tus entrenamientos utilizando los datos deportivos que decidas compartir.
          </p>

          <div className="p-4 rounded-2xl bg-[#0B0F19] border border-radar-border text-left mb-8 text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sin configuraciones complicadas ni gráficos abrumadores.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Compatible con tu celular o cualquier reloj deportivo.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tú controlas siempre qué datos compartes.</span>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-base tracking-wide shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2"
          >
            CONTINUAR <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ================= PASO 2: CREAR CUENTA ================= */}
      {step === 2 && (
        <div className="bg-radar-card border border-radar-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Crea tu Cuenta</h2>
              <p className="text-xs text-slate-400">Datos básicos para identificarte en el grupo</p>
            </div>
          </div>

          <div className="space-y-4 mb-8 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Apellido
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tu apellido"
                  className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.email@ejemplo.com"
                className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Teléfono (opcional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 9 11 ..."
                className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(3)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
          >
            SIGUIENTE <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= PASO 3: QUIÉN ES TU ENTRENADOR ================= */}
      {step === 3 && (() => {
        const clean = inviteCode.trim();
        const norm = clean.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const matchedOnboardingGroup = clean 
          ? groups.find(g => 
              g.inviteCode?.toUpperCase() === clean.toUpperCase() ||
              g.id.toUpperCase() === clean.toUpperCase() ||
              g.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === norm ||
              (norm.length >= 3 && g.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(norm))
            ) 
          : null;

        return (
          <div className="bg-radar-card border border-radar-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">¿Quién es tu Entrenador?</h2>
                <p className="text-xs text-slate-400">Escanea el QR o ingresa el código o nombre de tu grupo</p>
              </div>
            </div>

            <div className="mb-5 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setJoinModalInitialTab('qr');
                  setShowJoinModal(true);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-400 font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>📷 Escanear Código QR con la Cámara</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-radar-border"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase font-semibold">O código / nombre</span>
                <div className="flex-grow border-t border-radar-border"></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Código de Invitación o Nombre del Grupo
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Ej: RUN-4821 o Grupo Martes"
                  className="w-full bg-[#0B0F19] border-2 border-cyan-500/50 rounded-2xl px-4 py-3.5 text-center text-lg font-bold text-cyan-400 focus:outline-none focus:border-cyan-400 placeholder:text-slate-600 placeholder:text-sm placeholder:font-normal"
                />
              </div>

              {/* Grupos disponibles para seleccionar con un clic */}
              {groups.length > 0 && !matchedOnboardingGroup && (
                <div className="pt-2 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    O toca tu grupo para seleccionarlo:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setInviteCode(g.name)}
                        className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 text-xs font-medium transition flex items-center gap-1.5"
                      >
                        <span>{g.name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">({g.inviteCode})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tarjeta de Confirmación de Grupo Detectado */}
            {matchedOnboardingGroup ? (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 mb-6 animate-fadeIn">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold">
                    ✓ Entrenador Detectado:
                  </span>
                </div>
                <div className="text-sm font-bold text-white">{coach?.name || 'Profesor de Running'}</div>
                <div className="text-xs text-emerald-300 mt-0.5">
                  Grupo: {matchedOnboardingGroup.name} ({matchedOnboardingGroup.inviteCode})
                </div>
              </div>
            ) : inviteCode.trim() ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-6 text-amber-300 text-xs">
                ⚠️ No encontramos ningún grupo con el código "{inviteCode}". Verifica con tu profesor o continúa en Modo Libre.
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-radar-border mb-6 text-slate-400 text-xs text-center">
                ¿No tienes entrenador aún? Puedes continuar en <strong>Modo Libre</strong> y unirte más tarde en cualquier momento.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="py-3.5 px-5 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
              >
                Atrás
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                {matchedOnboardingGroup ? 'UNIRME AL GRUPO' : 'CONTINUAR (MODO LIBRE)'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* ================= PASO 4: PERMISOS Y SENSORES ================= */}
      {step === 4 && (
        <div className="bg-radar-card border border-radar-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Conectemos tus datos deportivos</h2>
              <p className="text-xs text-slate-400">RunRadar solo utilizará los datos que autorices.</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 mb-6 bg-[#0B0F19] p-3 rounded-xl border border-radar-border">
            🛡️ <strong>Principio de Privacidad:</strong> No accedemos a fotos, contactos ni mensajes. Solo métricas deportivas durante tus sesiones.
          </p>

          <div className="space-y-3 mb-8">
            
            {/* FC */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F19] border border-radar-border">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-rose-500" />
                <div>
                  <span className="text-xs font-bold text-white block">Frecuencia Cardíaca</span>
                  <span className="text-[10px] text-slate-400">Para monitorear tu esfuerzo y zonas</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={permissions.heartRate}
                onChange={() => handleTogglePermission('heartRate')}
                className="w-5 h-5 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* GPS */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F19] border border-radar-border">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Ubicación y GPS</span>
                  <span className="text-[10px] text-slate-400">Durante el entrenamiento para el mapa en vivo</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={permissions.location}
                onChange={() => handleTogglePermission('location')}
                className="w-5 h-5 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Pasos y Cadencia */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F19] border border-radar-border">
              <div className="flex items-center gap-3">
                <Footprints className="w-5 h-5 text-yellow-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Pasos y Cadencia</span>
                  <span className="text-[10px] text-slate-400">Para calcular ritmo y técnica de zancada</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={permissions.steps}
                onChange={() => handleTogglePermission('steps')}
                className="w-5 h-5 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Wearables / Bluetooth */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F19] border border-radar-border">
              <div className="flex items-center gap-3">
                <Watch className="w-5 h-5 text-cyan-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Dispositivos y Wearables</span>
                  <span className="text-[10px] text-slate-400">Sincronización con Smartband, Apple Watch o Garmin</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={permissions.wearables}
                onChange={() => handleTogglePermission('wearables')}
                className="w-5 h-5 accent-cyan-400 cursor-pointer"
              />
            </div>

          </div>

          <button
            onClick={handleJoin}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 fill-black" />
            TODO LISTO — ENTRAR A MI ENTRENAMIENTO
          </button>
        </div>
      )}

      {/* ================= PASO 5: MI ENTRENAMIENTO (PANTALLA PRINCIPAL CORREDOR) ================= */}
      {step === 5 && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* Status Top Pill & Dedicated Full-Width Tabs */}
          <div className="space-y-3">
            {/* Cabecera de Identidad del Corredor (Diseño limpio y no sobrecargado) */}
            <div className="bg-radar-card border border-radar-border rounded-2xl p-3 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Avatar con punto de conexión en vivo integrado */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-extrabold text-sm shadow-inner">
                    {currentRunner ? `${(currentRunner.name?.[0] || 'C').toUpperCase()}${(currentRunner.lastName?.[0] || 'R').toUpperCase()}` : '🏃'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0B0F19] ring-1 ring-emerald-500/50 animate-pulse" />
                </div>

                {/* Nombre y detalles de contacto con espacio completo */}
                <div className="min-w-0 flex-1 pr-2">
                  <h3 className="text-sm font-black text-white truncate tracking-wide">
                    {currentRunner ? `${currentRunner.name} ${currentRunner.lastName}`.trim() : 'Mi Perfil de Corredor'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mt-0.5">
                    <span className="truncate">{currentRunner?.email || 'Sin email'}</span>
                    {currentRunner?.phone && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="text-cyan-400 font-mono shrink-0">{currentRunner.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón sutil de edición */}
              <button
                onClick={() => {
                  setEditName(currentRunner?.name || '');
                  setEditLastName(currentRunner?.lastName || '');
                  setEditEmail(currentRunner?.email || '');
                  setEditPhone(currentRunner?.phone || '');
                  setShowEditProfileModal(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-sm"
                title="Editar mis datos personales"
              >
                <Pencil className="w-3 h-3 text-cyan-400" />
                <span>Editar</span>
              </button>
            </div>

            {/* Banner de Conexión Real con el Entrenador */}
            {isCoachConnected && runnerGroup ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-[#0B0F19] border border-emerald-500/40 flex items-center justify-between gap-3 shadow-lg animate-fadeIn">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                        CONECTADO AL ENTRENADOR
                      </span>
                    </div>
                    <p className="text-xs text-white font-bold truncate">
                      {runnerGroup.name} <span className="text-emerald-400 font-mono font-normal">({runnerGroup.inviteCode})</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (confirm('¿Deseas desconectarte del grupo y volver a Modo Libre?')) {
                      await leaveGroup();
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:border-rose-500/50 hover:text-rose-300 text-slate-300 border border-slate-700 text-[11px] font-bold transition flex items-center gap-1 shrink-0"
                  title="Desconectar del grupo"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-[#0B0F19] border border-amber-500/40 shadow-lg space-y-2.5 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wide block">
                      MODO LIBRE • SIN ENTRENADOR ASIGNADO
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      Tus datos son privados en tu móvil. Vincúlate a un profesor:
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setJoinModalInitialTab('qr');
                      setShowJoinModal(true);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Escanear QR</span>
                  </button>
                  <button
                    onClick={() => {
                      setJoinModalInitialTab('code');
                      setShowJoinModal(true);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-800/40 font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Hash className="w-3.5 h-3.5" />
                    <span>Código o Nombre</span>
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Tabs (3 columnas balanceadas para móviles) */}
            <div className="grid grid-cols-3 bg-[#0B0F19] p-1 rounded-2xl border border-radar-border text-xs gap-1">
              <button
                onClick={() => setActiveScreenTab('individual')}
                className={`py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                  activeScreenTab === 'individual' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span>Mi Estado</span>
              </button>
              <button
                onClick={() => setActiveScreenTab('collective')}
                className={`py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                  activeScreenTab === 'collective' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Pelotón</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </button>
              <button
                onClick={() => setActiveScreenTab('permissions')}
                className={`py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                  activeScreenTab === 'permissions' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Permisos</span>
              </button>
            </div>
          </div>

          {/* ================= TAB 1: MI ESTADO INDIVIDUAL ================= */}
          {activeScreenTab === 'individual' && (
            <>
              {/* Telemetría Gigante del Corredor */}
              <div className="bg-radar-card border border-radar-border rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl">
                
                {/* FC Hero */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                    <Heart className={`w-4 h-4 text-rose-500 ${hr !== null ? 'animate-pulse' : 'opacity-40'}`} /> Mi Frecuencia Cardíaca
                  </div>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-6xl sm:text-7xl font-black text-white font-['JetBrains_Mono',monospace] tracking-tight">
                      {hr !== null ? hr : '--'}
                    </span>
                    <span className="text-lg font-bold text-slate-400">BPM</span>
                  </div>
                  {zoneInfo ? (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-extrabold uppercase tracking-wide bg-rose-500/10 text-rose-300 border-rose-500/30">
                      <span>{zoneInfo.label}</span>
                      <span>•</span>
                      <span>{zoneInfo.name}</span>
                    </div>
                  ) : (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium text-slate-400 border-slate-700/60 bg-slate-900/60">
                      <span>
                        {bluetoothStatus === 'connected' 
                          ? `⌚ ${bleDeviceInfo?.name || 'Amazfit'} vinculado • ${hr ? 'Transmitiendo pulso en vivo' : (bleDeviceInfo?.hasHeartRate ? 'Esperando lectura del sensor...' : 'Buscando canal 0x180D en reloj...')}` 
                          : (bluetoothStatus === 'reconnecting' 
                              ? '🔄 Reconectando reloj automáticamente...' 
                              : 'Sensor no conectado (Vincular reloj abajo)')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Sub Métricas Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#0B0F19] p-4 rounded-2xl border border-radar-border text-left">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Mi Ritmo</span>
                    <span className="text-xl font-extrabold text-white font-mono">
                      {currentPace ? formatPace(currentPace) : '--:--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Distancia</span>
                    <span className="text-xl font-extrabold text-white font-mono">
                      {formatDistance(sample?.distance || 0)}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Tiempo</span>
                    <span className="text-xl font-extrabold text-cyan-400 font-mono">
                      {formatDuration(sessionSeconds)}
                    </span>
                  </div>
                </div>

                {/* Footer Dispositivo y Baterías Detalladas */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-4 border-t border-radar-border/40">
                  <div className="flex items-center gap-1.5 truncate max-w-[60%]">
                    <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate">
                      {bluetoothStatus === 'connected' 
                        ? `⌚ ${bleDeviceInfo?.name || 'Reloj'} + 📱 GPS Celular` 
                        : '📱 Sensor GPS del Celular'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Celular: {batteryLevel !== null ? `${batteryLevel}%` : 'Activo'}</span>
                    </div>
                    {bleDeviceInfo?.batteryLevel !== undefined && (
                      <div className="flex items-center gap-1 text-cyan-400 font-medium">
                        <Watch className="w-3.5 h-3.5" />
                        <span>Reloj: {bleDeviceInfo.batteryLevel}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tarjeta de Reloj Vinculado (Conectado o Reconectando/En reposo) */}
              {bleDeviceInfo ? (
                <div className={`p-4 rounded-2xl border-2 shadow-xl space-y-3 animate-fadeIn overflow-hidden ${
                  bluetoothStatus === 'connected' 
                    ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/50' 
                    : (bluetoothStatus === 'reconnecting'
                        ? 'bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/50'
                        : 'bg-slate-900/90 border-cyan-500/40')
                }`}>
                  {/* Fila 1: Info del Smartwatch */}
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      bluetoothStatus === 'connected' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : (bluetoothStatus === 'reconnecting'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30')
                    }`}>
                      <Watch className={`w-6 h-6 ${bluetoothStatus === 'connected' ? 'animate-pulse' : (bluetoothStatus === 'reconnecting' ? 'animate-spin' : '')}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          bluetoothStatus === 'connected' 
                            ? 'bg-emerald-400 animate-ping' 
                            : (bluetoothStatus === 'reconnecting' ? 'bg-amber-400 animate-pulse' : 'bg-slate-400')
                        }`} />
                        <h4 className="text-sm font-black text-white tracking-wide truncate">
                          {bleDeviceInfo.name}
                        </h4>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                          bluetoothStatus === 'connected'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : (bluetoothStatus === 'reconnecting'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700')
                        }`}>
                          {bluetoothStatus === 'connected' ? 'EN VIVO' : (bluetoothStatus === 'reconnecting' ? 'RECONECTANDO' : 'VINCULADO')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-semibold mt-0.5 truncate">
                        Marca: {bleDeviceInfo.manufacturer}
                        {bleDeviceInfo.model && bleDeviceInfo.model !== bleDeviceInfo.name ? ` • Modelo: ${bleDeviceInfo.model}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Fila 2: Botones de Acción Móviles */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {bluetoothStatus !== 'connected' ? (
                      <button
                        onClick={handleConnectBluetooth}
                        disabled={isBluetoothConnecting}
                        className="py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                      >
                        <Bluetooth className="w-3.5 h-3.5" />
                        <span>{isBluetoothConnecting ? 'Buscando...' : 'Reconectar'}</span>
                      </button>
                    ) : (
                      hr === null ? (
                        <button
                          onClick={handleForceScanHr}
                          disabled={isScanningHr}
                          className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Forzar re-escaneo del canal de pulso 0x180D"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isScanningHr ? 'animate-spin' : ''}`} />
                          <span>{isScanningHr ? 'Escaneando...' : 'Buscar Canal FC'}</span>
                        </button>
                      ) : (
                        <div className="py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>Transmitiendo {bleDeviceInfo.packetsReceived ? `(${bleDeviceInfo.packetsReceived})` : ''}</span>
                        </div>
                      )
                    )}
                    <button
                      onClick={handleDisconnectBluetooth}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:border-rose-500/50 hover:text-rose-300 text-slate-300 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Desvincular</span>
                    </button>
                  </div>

                  {/* Fila 3: Métricas de Sensor y Batería */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700/50">
                    <div className="bg-[#0B0F19] p-2.5 rounded-xl flex items-center gap-2 border border-radar-border min-w-0">
                      <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                      <div className="min-w-0 truncate">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sensor Cardíaco</span>
                        <span className="text-xs font-bold text-white truncate block">
                          {bluetoothStatus === 'connected' 
                            ? (hr !== null 
                                ? `${hr} BPM en vivo` 
                                : (bleDeviceInfo.hasHeartRate 
                                    ? 'Esperando lectura...' 
                                    : 'Buscando canal 0x180D...')) 
                            : (bluetoothStatus === 'reconnecting' ? 'Reconectando...' : 'En reposo (Reconectar)')}
                        </span>
                      </div>
                    </div>
                    <div className="bg-[#0B0F19] p-2.5 rounded-xl flex items-center gap-2 border border-radar-border min-w-0">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="min-w-0 truncate">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Batería Reloj</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono truncate block">
                          {bleDeviceInfo.batteryLevel !== undefined ? `${bleDeviceInfo.batteryLevel}%` : (bluetoothStatus === 'connected' ? 'OK' : 'Guardado')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Guía Específica Amazfit / Zepp si no hay lectura de pulso */}
                  {hr === null && (
                    <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-700/50 text-[11px] text-cyan-200 space-y-2">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>¿Por qué tu Amazfit aún no envía los latidos?</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Los relojes Amazfit con Zepp OS <b>no transmiten el pulso por Bluetooth en la pantalla normal</b> de la hora para no agotar la batería en 1 día. Para que abra el canal <b>0x180D</b>:
                      </p>
                      <div className="bg-slate-950/70 p-2.5 rounded-lg border border-cyan-900/60 space-y-1.5 text-slate-300 text-[11px]">
                        <div>
                          <b className="text-cyan-300">1. En tu teléfono (Zepp):</b>
                          <span className="block text-slate-300">Perfil &gt; {bleDeviceInfo.name || 'Amazfit Bip 6'} &gt; Monitoreo de salud &gt; Activar <b>"Compartir frecuencia cardíaca con dispositivos"</b>.</span>
                        </div>
                        <div className="pt-1 border-t border-slate-800">
                          <b className="text-amber-300">2. EN LA PANTALLA DEL RELOJ (¡Paso clave!):</b>
                          <span className="block text-slate-300">
                            En el menú de aplicaciones de tu reloj, abre la app <b>"Transmisión de frecuencia cardíaca"</b> (icono de corazón con ondas).
                            <br />
                            <i>O bien:</i> inicia una actividad de <b>"Correr"</b> o <b>"Caminar"</b> en el reloj.
                          </span>
                        </div>
                        <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                          💡 Tan pronto como abras la app en el reloj o comiences el entreno, el sistema detecta el canal automáticamente y el botón superior cambiará a verde "Transmitiendo".
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-radar-card border border-radar-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Bluetooth className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Vincular Reloj / Sensor Cardíaco</span>
                      <span className="text-[10px] text-slate-400">Amazfit, Garmin, Polar, Magene, Smartwatches</span>
                    </div>
                  </div>
                  <button
                    onClick={handleConnectBluetooth}
                    disabled={isBluetoothConnecting}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-xs transition shrink-0 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Bluetooth className="w-3.5 h-3.5" />
                    {isBluetoothConnecting ? 'Buscando...' : 'Vincular Reloj'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ================= TAB 2: ESTADO COLECTIVO (PELOTÓN) ================= */}
          {activeScreenTab === 'collective' && (
            !isCoachConnected ? (
              <div className="bg-radar-card border border-radar-border rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-5 animate-fadeIn">
                <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-500/10">
                  <Users className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-sm mx-auto">
                  <h3 className="text-lg font-black text-white">Aún no formas parte de un Pelotón</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Para ver el radar colectivo en vivo, comparar tu ritmo contra la media del pelotón y aparecer en el mapa de tu entrenador, únete a su grupo.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2 max-w-xs mx-auto">
                  <button
                    onClick={() => {
                      setJoinModalInitialTab('qr');
                      setShowJoinModal(true);
                    }}
                    className="py-3 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Escanear QR Entrenador</span>
                  </button>
                  <button
                    onClick={() => {
                      setJoinModalInitialTab('code');
                      setShowJoinModal(true);
                    }}
                    className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-800/40 font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <Hash className="w-4 h-4" />
                    <span>Código o Nombre de Grupo</span>
                  </button>
                </div>
              </div>
            ) : (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Comparador de Ritmo: Tú vs Pelotón */}
              <div className="bg-radar-card border border-radar-border rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-bold text-white">Rendimiento respecto al Pelotón</h3>
                  </div>
                  <span className="text-xs font-mono bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/50">
                    {groupAthletes.length} Corredores
                  </span>
                </div>

                {/* Comparación visual de ritmos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0B0F19] p-4 rounded-2xl border border-radar-border">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                      Tu Ritmo
                    </span>
                    <span className="text-2xl font-black text-cyan-400 font-mono">
                      {currentPace ? formatPace(currentPace) : '--:--'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      min/km actual
                    </span>
                  </div>

                  <div className="bg-[#0B0F19] p-4 rounded-2xl border border-radar-border">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                      Ritmo Medio del Grupo
                    </span>
                    <span className="text-2xl font-black text-white font-mono">
                      {formatPace(avgPace)}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      promedio del pelotón
                    </span>
                  </div>
                </div>

                {/* Status indicator bar */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Posición en el grupo:
                  </span>
                  <span className={`font-bold ${
                    paceDiff === null ? 'text-slate-400' :
                    paceDiff < -10 ? 'text-cyan-400' :
                    paceDiff > 10 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {paceDiff === null
                      ? '🏃 Esperando movimiento GPS...'
                      : paceDiff < -10 
                      ? `🚀 Tirando del grupo (${Math.abs(paceDiff)}s más rápido)` 
                      : paceDiff > 10 
                      ? `🟡 En cola del pelotón (+${paceDiff}s)` 
                      : `🟢 En el núcleo del pelotón`}
                  </span>
                </div>

                {/* Métricas Promedio del Grupo */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="bg-[#0B0F19] p-2.5 rounded-xl border border-radar-border/60">
                    <span className="text-[10px] text-slate-400 uppercase block">FC Media Grupo</span>
                    <span className="text-sm font-bold text-rose-400 font-mono">{avgHeartRate} BPM</span>
                  </div>
                  <div className="bg-[#0B0F19] p-2.5 rounded-xl border border-radar-border/60">
                    <span className="text-[10px] text-slate-400 uppercase block">Distancia Media</span>
                    <span className="text-sm font-bold text-white font-mono">{formatDistance(avgDistance)}</span>
                  </div>
                  <div className="bg-[#0B0F19] p-2.5 rounded-xl border border-radar-border/60">
                    <span className="text-[10px] text-slate-400 uppercase block">Semáforo</span>
                    <span className="text-xs font-bold font-mono">
                      🟢{groupNormalCount} 🟡{groupAttentionCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mapa del Pelotón en Vivo */}
              <div className="bg-radar-card border border-radar-border rounded-3xl p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Mapa del Pelotón en Vivo</h4>
                  </div>
                  <span className="text-[11px] text-slate-400">Tú estás resaltado en el radar</span>
                </div>

                <div className="h-64 rounded-2xl overflow-hidden border border-radar-border">
                  <LiveMapView
                    athletes={groupAthletes}
                    onSelectAthlete={() => {}}
                  />
                </div>
              </div>

              {/* Compañeros de Grupo */}
              <div className="bg-radar-card border border-radar-border rounded-3xl p-5 shadow-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Compañeros Corriendo Contigo ({groupAthletes.length})
                </h4>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {groupAthletes.map((ath) => {
                    const isMe = ath.id === currentRunner?.id;
                    const athPace = isMe ? ath.lastSample?.pace : (ath.lastSample?.pace || 340);
                    const athHR = isMe ? ath.lastSample?.heartRate : (ath.lastSample?.heartRate || 145);

                    return (
                      <div
                        key={ath.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                          isMe 
                            ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30' 
                            : 'bg-[#0B0F19] border-radar-border'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full ${
                            ath.currentStatus === 'alert' ? 'bg-red-400 animate-ping' :
                            ath.currentStatus === 'attention' ? 'bg-amber-400' : 'bg-emerald-400'
                          }`} />
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {ath.name} {ath.lastName} {isMe && '(Tú)'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {isMe 
                                ? (ath.lastSample?.sourceDevice || (bluetoothStatus === 'connected' ? '⌚ Reloj Conectado' : '📱 GPS Celular')) 
                                : (ath.devices[0]?.name || 'Sensor')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Ritmo</span>
                            <span className="text-xs font-bold font-mono text-white">
                              {athPace ? formatPace(athPace) : '--:--'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">FC</span>
                            <span className="text-xs font-bold font-mono text-rose-400">
                              {athHR ? `${athHR} BPM` : '-- BPM'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
            )
          )}

          {/* ================= TAB 3: PERMISOS Y PRIVACIDAD ================= */}
          {activeScreenTab === 'permissions' && (
            <div className="bg-radar-card border border-radar-border rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Datos que comparto con mi entrenador</h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Puedes activar o desactivar cualquier permiso en cualquier momento. Tu entrenador solo verá los datos activados.
              </p>

              <div className="space-y-3">
                {Object.entries(permissions).filter(([k]) => k !== 'updatedAt').map(([key, isEnabled]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F19] border border-radar-border">
                    <span className="text-xs font-semibold text-slate-200 capitalize">
                      {key === 'heartRate' ? '❤️ Frecuencia Cardíaca' :
                       key === 'location' ? '📍 Ubicación GPS' :
                       key === 'workouts' ? '🏃 Entrenamientos' :
                       key === 'steps' ? '👣 Pasos' :
                       key === 'cadence' ? '🔄 Cadencia' :
                       key === 'elevation' ? '⛰️ Elevación' :
                       key === 'calories' ? '🔥 Calorías' : '⌚ Wearables'}
                    </span>
                    <button
                      onClick={() => handleTogglePermission(key as keyof AthletePermissions)}
                      className={`text-xs font-bold px-3 py-1 rounded-full border transition ${
                        isEnabled 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      {isEnabled ? 'ACTIVADO' : 'DESACTIVADO'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Modal para Editar Perfil del Corredor */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-radar-card border border-radar-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-radar-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🏃</span> Mis Datos de Corredor
              </h3>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Tu Nombre:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-cyan-400 outline-none"
                  placeholder="Ej: Kevin"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Tu Apellido:</label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-cyan-400 outline-none"
                  placeholder="Ej: Gómez (opcional)"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold flex items-center justify-between">
                  <span>Teléfono / Celular:</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Visible para tu entrenador</span>
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-cyan-400 outline-none"
                  placeholder="Ej: +54 9 223 123-4567"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Tu profesor podrá contactarte o llamarte en caso de emergencia durante la carrera.
                </span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Email:</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-radar-border rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-cyan-400 outline-none"
                  placeholder="tu.email@ejemplo.com"
                />
              </div>

              <div className="pt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold transition hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold transition shadow-lg shadow-cyan-500/20 hover:opacity-95"
                >
                  Guardar Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Escanear QR o Ingresar Código de Entrenador */}
      <QRScannerModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={joinGroup}
        initialTab={joinModalInitialTab}
        availableGroups={groups}
      />

    </div>
  );
};
