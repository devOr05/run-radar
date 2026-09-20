import React, { useState, useEffect, useMemo } from 'react';
import { useRadar } from '../../context/RadarContext';
import { AthletePermissions, MetricSample } from '../../types';
import { PhoneSensorAdapter, BluetoothHeartRateAdapter } from '../../adapters';
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
  Compass
} from 'lucide-react';
import { formatPace, formatDistance, formatDuration, calculateHeartRateZone, getZoneDetails } from '../../lib/calculations';

export const RunnerView: React.FC = () => {
  const { currentRunner, joinRunner, updateRunnerPermissions, groups, athletes, coach, emitRunnerSample } = useRadar();

  // Pasos de Onboarding: 1. Intro, 2. Datos, 3. Entrenador, 4. Permisos, 5. Mi Entrenamiento (Listo)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(currentRunner ? 5 : 1);

  // Formulario de Registro
  const [name, setName] = useState('Juan');
  const [lastName, setLastName] = useState('Pérez');
  const [email, setEmail] = useState('juan.perez@ejemplo.com');
  const [phone, setPhone] = useState('+54 9 11 4567-8901');
  const [inviteCode, setInviteCode] = useState('RUN-4821');

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
  const [bluetoothStatus, setBluetoothStatus] = useState<'idle' | 'connected' | 'unsupported'>('idle');
  const [activeScreenTab, setActiveScreenTab] = useState<'individual' | 'collective' | 'permissions'>('individual');

  // Conectar adaptador local de Sensores del Celular (GPS + acelerómetro)
  useEffect(() => {
    if (step === 5) {
      const phoneAdapter = new PhoneSensorAdapter();
      phoneAdapter.connect().then((ok) => {
        if (ok) {
          phoneAdapter.startStream((sample) => {
            if (emitRunnerSample) {
              emitRunnerSample(sample);
            }
          });
        }
      });

      return () => {
        phoneAdapter.stopStream();
      };
    }
  }, [step, emitRunnerSample]);

  const handleJoin = async () => {
    const res = await joinRunner({
      name,
      lastName,
      email,
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

  const handleConnectBluetooth = async () => {
    setIsBluetoothConnecting(true);
    const bleAdapter = new BluetoothHeartRateAdapter();
    const ok = await bleAdapter.connect();
    setIsBluetoothConnecting(false);
    if (ok) {
      setBluetoothStatus('connected');
      bleAdapter.startStream((sample) => {
        if (emitRunnerSample) {
          emitRunnerSample(sample);
        }
      });
    } else {
      setBluetoothStatus('unsupported');
    }
  };

  const sample = currentRunner?.lastSample;
  const hr = sample?.heartRate || 148;
  const hrZone = calculateHeartRateZone(hr, currentRunner?.maxHeartRate || 185);
  const zoneInfo = getZoneDetails(hrZone);

  // Cálculos de Estado Colectivo del Grupo
  const runnerGroup = groups.find(g => currentRunner?.groupIds?.includes(g.id)) || groups[0];
  const groupAthletes = useMemo(() => {
    if (!runnerGroup) return athletes;
    return athletes.filter(a => a.groupIds.includes(runnerGroup.id));
  }, [athletes, runnerGroup]);

  const avgHeartRate = useMemo(() => {
    const withHR = groupAthletes.filter(a => a.lastSample?.heartRate);
    if (withHR.length === 0) return 145;
    const sum = withHR.reduce((acc, a) => acc + (a.lastSample?.heartRate || 0), 0);
    return Math.round(sum / withHR.length);
  }, [groupAthletes]);

  const avgPace = useMemo(() => {
    const withPace = groupAthletes.filter(a => a.lastSample?.pace);
    if (withPace.length === 0) return 330;
    const sum = withPace.reduce((acc, a) => acc + (a.lastSample?.pace || 0), 0);
    return Math.round(sum / withPace.length);
  }, [groupAthletes]);

  const avgDistance = useMemo(() => {
    const withDist = groupAthletes.filter(a => a.lastSample?.distance);
    if (withDist.length === 0) return 5000;
    const sum = withDist.reduce((acc, a) => acc + (a.lastSample?.distance || 0), 0);
    return Math.round(sum / withDist.length);
  }, [groupAthletes]);

  const groupNormalCount = groupAthletes.filter(a => a.currentStatus === 'normal').length;
  const groupAttentionCount = groupAthletes.filter(a => a.currentStatus === 'attention').length;
  const groupAlertCount = groupAthletes.filter(a => a.currentStatus === 'alert').length;

  const currentPace = sample?.pace || 345;
  const paceDiff = currentPace - avgPace;

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
      {step === 3 && (
        <div className="bg-radar-card border border-radar-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">¿Quién es tu Entrenador?</h2>
              <p className="text-xs text-slate-400">Ingresa el código proporcionado por tu profesor</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Código de Invitación / Grupo
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="RUN-4821"
              className="w-full bg-[#0B0F19] border-2 border-cyan-500/50 rounded-2xl px-4 py-3.5 text-center text-xl font-black font-mono tracking-widest text-cyan-400 uppercase focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Tarjeta de Confirmación de Grupo Detectado */}
          <div className="p-4 rounded-2xl bg-[#0B0F19] border border-radar-border mb-8">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">Entrenador Detectado:</span>
            <div className="text-sm font-bold text-white">Profesor Juan Pérez</div>
            <div className="text-xs text-cyan-400 mt-0.5">Grupo: Running Martes y Jueves (19:00 hs)</div>
          </div>

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
              UNIRME AL GRUPO <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
          
          {/* Status Top Pill */}
          <div className="bg-radar-card border border-radar-border rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider">CONECTADO AL ENTRENADOR</span>
                </div>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">Profesor Juan • Running Martes</p>
              </div>
            </div>

            <div className="flex bg-[#0B0F19] p-0.5 rounded-xl border border-radar-border text-xs">
              <button
                onClick={() => setActiveScreenTab('individual')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${activeScreenTab === 'individual' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Mi Estado
              </button>
              <button
                onClick={() => setActiveScreenTab('collective')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${activeScreenTab === 'collective' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <span>Pelotón</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
              <button
                onClick={() => setActiveScreenTab('permissions')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${activeScreenTab === 'permissions' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Permisos
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
                    <Heart className="w-4 h-4 text-rose-500 animate-pulse" /> Mi Frecuencia Cardíaca
                  </div>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-6xl sm:text-7xl font-black text-white font-['JetBrains_Mono',monospace] tracking-tight">
                      {hr}
                    </span>
                    <span className="text-lg font-bold text-slate-400">BPM</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-extrabold uppercase tracking-wide bg-rose-500/10 text-rose-300 border-rose-500/30">
                    <span>{zoneInfo.label}</span>
                    <span>•</span>
                    <span>{zoneInfo.name}</span>
                  </div>
                </div>

                {/* Sub Métricas Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#0B0F19] p-4 rounded-2xl border border-radar-border text-left">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Mi Ritmo</span>
                    <span className="text-xl font-extrabold text-white font-mono">{formatPace(currentPace)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Distancia</span>
                    <span className="text-xl font-extrabold text-white font-mono">{formatDistance(sample?.distance || 5800)}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Tiempo</span>
                    <span className="text-xl font-extrabold text-cyan-400 font-mono">{formatDuration(2280)}</span>
                  </div>
                </div>

                {/* Footer Dispositivo y Conexión */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-4 border-t border-radar-border/40">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>{sample?.sourceDevice || '📱 Sensor del Celular'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Zap className="w-3.5 h-3.5" /> Batería: 85%
                  </div>
                </div>
              </div>

              {/* Botón de Conexión Bluetooth de Banda Cardíaca */}
              <div className="p-4 rounded-2xl bg-radar-card border border-radar-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Bluetooth className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Vincular Banda Bluetooth</span>
                    <span className="text-[10px] text-slate-400">Polar H10, Garmin HRM, Magene, Wahoo</span>
                  </div>
                </div>
                <button
                  onClick={handleConnectBluetooth}
                  disabled={isBluetoothConnecting}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                >
                  {isBluetoothConnecting ? 'Buscando...' : bluetoothStatus === 'connected' ? '✓ Conectado' : 'Conectar'}
                </button>
              </div>
            </>
          )}

          {/* ================= TAB 2: ESTADO COLECTIVO (PELOTÓN) ================= */}
          {activeScreenTab === 'collective' && (
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
                      {formatPace(currentPace)}
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
                    paceDiff < -10 ? 'text-cyan-400' :
                    paceDiff > 10 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {paceDiff < -10 
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
                    const athPace = ath.lastSample?.pace || 340;
                    const athHR = ath.lastSample?.heartRate || 145;

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
                              {ath.devices[0]?.name || 'Sensor'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Ritmo</span>
                            <span className="text-xs font-bold font-mono text-white">
                              {formatPace(athPace)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">FC</span>
                            <span className="text-xs font-bold font-mono text-rose-400">
                              {athHR} BPM
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
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

    </div>
  );
};
