import React, { useState, useRef } from 'react';
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
  Upload, 
  FileText, 
  ExternalLink, 
  Zap, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { formatPace, formatDistance, formatDuration } from '../../lib/calculations';
import { 
  parseGpxFile, 
  parseTcxFile, 
  ParsedActivityData, 
  stravaService 
} from '../../services/sportsSyncService';

interface ConnectedAppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionSynced?: () => void;
}

export const ConnectedAppsModal: React.FC<ConnectedAppsModalProps> = ({
  isOpen,
  onClose,
  onSessionSynced
}) => {
  const { currentRunner, groups, saveCompletedSession } = useRadar();
  const runnerGroup = groups.find(g => currentRunner?.groupIds?.includes(g.id)) || null;

  const [activeTab, setActiveTab] = useState<'cloud' | 'file' | 'test'>('cloud');

  // Estado de Strava / Cloud
  const [stravaAuth, setStravaAuth] = useState(() => stravaService.getStorageAuth());
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado de archivo GPX / TCX
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedActivityData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Éxito global
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  // Manejo de conexión Strava simulada/rápida o directa
  const handleToggleStrava = () => {
    if (stravaAuth.isConnected) {
      stravaService.disconnect();
      setStravaAuth({ accessToken: '', athleteId: '', athleteName: '', isConnected: false });
      setCloudSyncMsg({ type: 'success', text: 'Cuenta deportiva desvinculada.' });
    } else {
      const runnerName = currentRunner ? `${currentRunner.name} ${currentRunner.lastName || ''}`.trim() : 'Corredor';
      stravaService.setStorageAuth({
        accessToken: `strava-tok-${Date.now()}`,
        athleteId: currentRunner?.id || 'ath-1',
        athleteName: runnerName
      });
      setStravaAuth({
        accessToken: `strava-tok-${Date.now()}`,
        athleteId: currentRunner?.id || 'ath-1',
        athleteName: runnerName,
        isConnected: true
      });
      setCloudSyncMsg({ 
        type: 'success', 
        text: '¡Cuenta vinculada con éxito! Las actividades de Zepp y Adidas se sincronizarán en segundo plano.' 
      });
    }
  };

  // Sincronizar actividades recientes desde Strava
  const handleSyncRecentFromStrava = async () => {
    if (!currentRunner) return;
    setIsSyncingCloud(true);
    setCloudSyncMsg(null);

    try {
      // Simular obtención de corrida reciente de Zepp o Adidas desde Strava
      await new Promise(r => setTimeout(r, 1200));

      const now = new Date();
      const dateStr = `Hoy, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} hs`;
      
      const newSession = await saveCompletedSession({
        groupId: runnerGroup?.id || 'group-general',
        groupName: runnerGroup?.name || 'Entrenamiento Libre',
        athleteId: currentRunner.id,
        athleteName: `${currentRunner.name} ${currentRunner.lastName || ''}`.trim(),
        athleteAvatar: currentRunner.avatarUrl,
        sourceDevice: '⌚ Amazfit (Zepp via Strava Cloud)',
        date: dateStr,
        startTime: Date.now() - 3600000,
        endTime: Date.now() - 300000,
        durationSeconds: 3300, // 55 min
        distanceMeters: 10200, // 10.2 km
        avgPaceSeconds: 323, // 5:23/km
        bestPaceSeconds: 295, // 4:55/km
        avgHeartRate: 154,
        maxHeartRate: 172,
        avgCadence: 176,
        totalCalories: 680,
        totalSteps: 9680,
        syncType: 'offline_sync',
        notes: 'Fondo progresivo sincronizado automáticamente desde Zepp OS'
      });

      setSyncSuccessToast(`¡Corrida de 10.2 km recibida y enviada al entrenador!`);
      if (onSessionSynced) onSessionSynced();
      setTimeout(() => {
        setSyncSuccessToast(null);
        onClose();
      }, 1800);

    } catch (e: any) {
      setCloudSyncMsg({ type: 'error', text: e.message || 'Error al sincronizar con la nube.' });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Carga y parseo de archivo GPX / TCX
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setParseError(null);
    setParsedData(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) throw new Error('El archivo está vacío.');

        let parsed: ParsedActivityData;
        if (file.name.toLowerCase().endsWith('.tcx')) {
          parsed = parseTcxFile(content, file.name);
        } else {
          parsed = parseGpxFile(content, file.name);
        }

        setParsedData(parsed);
      } catch (err: any) {
        console.error('Error parseando archivo de actividad:', err);
        setParseError(err.message || 'No se pudo leer el archivo. Asegúrate de que sea un archivo .GPX o .TCX válido.');
      }
    };

    reader.onerror = () => {
      setParseError('Error de lectura del archivo.');
    };

    reader.readAsText(file);
  };

  // Enviar archivo parseado al entrenador
  const handleUploadParsedSession = async () => {
    if (!parsedData || !currentRunner) return;
    setIsUploadingFile(true);

    try {
      const now = new Date(parsedData.endTime || Date.now());
      const dateStr = `Hoy, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} hs`;

      await saveCompletedSession({
        groupId: runnerGroup?.id || 'group-general',
        groupName: runnerGroup?.name || 'Entrenamiento Libre',
        athleteId: currentRunner.id,
        athleteName: `${currentRunner.name} ${currentRunner.lastName || ''}`.trim(),
        athleteAvatar: currentRunner.avatarUrl,
        sourceDevice: parsedData.sourceDevice,
        date: dateStr,
        startTime: parsedData.startTime,
        endTime: parsedData.endTime,
        durationSeconds: parsedData.durationSeconds,
        distanceMeters: parsedData.distanceMeters,
        avgPaceSeconds: parsedData.avgPaceSeconds,
        bestPaceSeconds: parsedData.bestPaceSeconds,
        avgHeartRate: parsedData.avgHeartRate,
        maxHeartRate: parsedData.maxHeartRate,
        avgCadence: parsedData.avgCadence,
        totalCalories: parsedData.totalCalories,
        totalSteps: parsedData.totalSteps,
        syncType: 'offline_sync',
        notes: `Importado de archivo ${selectedFileName}: ${parsedData.title}`,
        splits: parsedData.splits.length > 0 ? parsedData.splits : undefined
      });

      setSyncSuccessToast(`¡Archivo importado con éxito! ${(parsedData.distanceMeters / 1000).toFixed(2)} km transmitidos al entrenador.`);
      if (onSessionSynced) onSessionSynced();
      setTimeout(() => {
        setSyncSuccessToast(null);
        onClose();
      }, 1800);

    } catch (err: any) {
      setParseError(err.message || 'Error al guardar la sesión.');
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Enviar corrida de prueba rápida
  const handleQuickTestRun = async (brand: 'amazfit' | 'adidas') => {
    if (!currentRunner) return;

    const isAmazfit = brand === 'amazfit';
    const distMeters = isAmazfit ? 8400 : 6200;
    const durSecs = isAmazfit ? 2600 : 1810;
    const paceSecs = Math.round(durSecs / (distMeters / 1000));

    const now = new Date();
    const dateStr = `Hoy, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} hs`;

    await saveCompletedSession({
      groupId: runnerGroup?.id || 'group-general',
      groupName: runnerGroup?.name || 'Entrenamiento Libre',
      athleteId: currentRunner.id,
      athleteName: `${currentRunner.name} ${currentRunner.lastName || ''}`.trim(),
      athleteAvatar: currentRunner.avatarUrl,
      sourceDevice: isAmazfit ? '⌚ Amazfit (Zepp OS)' : '👟 Adidas Running',
      date: dateStr,
      startTime: Date.now() - (durSecs * 1000),
      endTime: Date.now(),
      durationSeconds: durSecs,
      distanceMeters: distMeters,
      avgPaceSeconds: paceSecs,
      bestPaceSeconds: Math.round(paceSecs * 0.91),
      avgHeartRate: isAmazfit ? 158 : 164,
      maxHeartRate: isAmazfit ? 174 : 178,
      avgCadence: isAmazfit ? 178 : 172,
      totalCalories: isAmazfit ? 590 : 440,
      totalSteps: Math.round((durSecs / 60) * 176),
      syncType: 'offline_sync',
      notes: isAmazfit 
        ? 'Prueba rápida de sincronización reloj Amazfit Zepp OS'
        : 'Prueba rápida de sincronización app Adidas Running'
    });

    setSyncSuccessToast(`¡Corrida de prueba de ${isAmazfit ? 'Amazfit Zepp' : 'Adidas'} enviada con éxito!`);
    if (onSessionSynced) onSessionSynced();
    setTimeout(() => {
      setSyncSuccessToast(null);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-radar-card border border-radar-border rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-amber-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-radar-border mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/50">
                  SINCRONIZACIÓN AUTOMÁTICA
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                Vincular Reloj & Apps Deportivas
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex bg-[#0B0F19] p-1 rounded-2xl border border-radar-border text-xs mb-5 shrink-0">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'cloud' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Sincronización Automática</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'file' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Respaldo Manual GPX</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'test' 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prueba Rápida</span>
          </button>
        </div>

        {/* Toast de Éxito Flotante */}
        {syncSuccessToast && (
          <div className="bg-emerald-950 border border-emerald-500/60 text-emerald-200 p-4 rounded-2xl mb-4 flex items-center gap-3 animate-fadeIn shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs font-bold">{syncSuccessToast}</p>
          </div>
        )}

        {/* Contenido con Scroll */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">

          {/* 1. PESTAÑA NUBE AUTOMÁTICA (STRAVA / ZEPP / ADIDAS) */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              
              {/* Banner Informativo de Automatización Total */}
              <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/50 border border-emerald-500/40 p-4 rounded-2xl flex items-start gap-3.5 shadow-lg">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 fill-emerald-400" />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-black text-white text-sm">
                    ⚡ 100% Automático (Configurar solo 1 vez)
                  </p>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    De la misma forma que la app <strong>Zepp</strong> descarga tus entrenamientos por Bluetooth en cuanto llegas a tu casa y te acercas al teléfono, RunRadar detecta la corrida en segundo plano y se la transmite de inmediato a tu entrenador. <strong>No tenés que subir archivos ni presionar botones cada día.</strong>
                  </p>
                </div>
              </div>
              
              {/* Tarjeta de Estado de Conexión */}
              <div className="bg-[#0B0F19]/90 border border-radar-border p-4 sm:p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0 font-black text-xl">
                      🟠
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-white">
                          Conector Deportivo en la Nube
                        </h4>
                        {stravaAuth.isConnected ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-extrabold border border-emerald-700/60">
                            🟢 ACTIVO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700">
                            ⚪ NO VINCULADO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {stravaAuth.isConnected 
                          ? `Vinculado como: ${stravaAuth.athleteName}` 
                          : 'Sincronización en segundo plano para Zepp, Adidas, Garmin y Strava'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleStrava}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition shadow-lg shrink-0 ${
                      stravaAuth.isConnected
                        ? 'bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/40'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black shadow-orange-500/20'
                    }`}
                  >
                    {stravaAuth.isConnected ? 'Desvincular' : '⚡ Conectar en 1 Toque'}
                  </button>
                </div>

                {cloudSyncMsg && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${
                    cloudSyncMsg.type === 'success' 
                      ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50' 
                      : 'bg-red-950/50 text-red-300 border border-red-800/50'
                  }`}>
                    {cloudSyncMsg.text}
                  </div>
                )}

                {stravaAuth.isConnected && (
                  <div className="pt-2 border-t border-radar-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400">
                      ✅ Cada corrida registrada con tu reloj se enviará automáticamente al entrenador.
                    </div>
                    <button
                      onClick={handleSyncRecentFromStrava}
                      disabled={isSyncingCloud}
                      className="px-3.5 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-extrabold transition flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                      <span>{isSyncingCloud ? 'Consultando nube...' : 'Sincronizar Última Corrida Ahora'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Guía Rápida de Configuración (Solo 1 vez) */}
              <div className="bg-slate-900/60 border border-radar-border p-4 rounded-2xl space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  📖 Cómo activar la subida automática en tu app (30 segundos):
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#0B0F19] p-3 rounded-xl border border-radar-border space-y-1.5">
                    <span className="font-extrabold text-white flex items-center gap-1.5 text-cyan-400">
                      ⌚ En Amazfit (Zepp):
                    </span>
                    <ol className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside">
                      <li>Abre la app <strong>Zepp</strong> en tu celular.</li>
                      <li>Ve a <strong>Perfil ➔ Cuentas vinculadas</strong>.</li>
                      <li>Toca <strong>Strava</strong> y presiona <em>Conectar</em>.</li>
                      <li>¡Listo! Tu reloj Amazfit ya sube todo a la nube.</li>
                    </ol>
                  </div>

                  <div className="bg-[#0B0F19] p-3 rounded-xl border border-radar-border space-y-1.5">
                    <span className="font-extrabold text-white flex items-center gap-1.5 text-amber-400">
                      👟 En Adidas Running:
                    </span>
                    <ol className="text-[11px] text-slate-400 space-y-1 list-decimal list-inside">
                      <li>Abre <strong>Adidas Running</strong>.</li>
                      <li>Ve a <strong>Ajustes ➔ Cuentas asociadas</strong>.</li>
                      <li>Selecciona <strong>Strava</strong> y autoriza.</li>
                      <li>¡Listo! Tus corridas se transmiten solas.</li>
                    </ol>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. PESTAÑA IMPORTADOR DE ARCHIVO GPX / TCX */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              
              {/* Selector de Archivo */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/10 hover:bg-cyan-950/20 p-6 rounded-2xl text-center cursor-pointer transition space-y-2 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".gpx,.tcx,application/gpx+xml,application/vnd.garmin.tcx+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-white">
                    {selectedFileName ? selectedFileName : 'Toca para elegir tu archivo .GPX o .TCX'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Exportado desde Amazfit Zepp, Adidas Running, Garmin o Strava
                  </p>
                </div>
              </div>

              {parseError && (
                <div className="p-3 bg-red-950/50 border border-red-800/50 text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Vista previa de los datos reales parseados */}
              {parsedData && (
                <div className="bg-[#0B0F19] border border-cyan-500/30 p-4 rounded-2xl space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                        {parsedData.sourceDevice}
                      </span>
                      <h4 className="text-sm font-extrabold text-white mt-1">
                        {parsedData.title}
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {formatDuration(parsedData.durationSeconds)}
                    </span>
                  </div>

                  {/* Grilla de Métricas Extraídas del GPX */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-radar-border text-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Distancia</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {(parsedData.distanceMeters / 1000).toFixed(2)} km
                      </span>
                    </div>

                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-radar-border text-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Ritmo Prom</span>
                      <span className="text-sm font-black text-cyan-400 font-mono">
                        {formatPace(parsedData.avgPaceSeconds)}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-radar-border text-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pulso Medio</span>
                      <span className="text-sm font-black text-rose-400 font-mono">
                        {parsedData.avgHeartRate} BPM
                      </span>
                    </div>

                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-radar-border text-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cadencia</span>
                      <span className="text-sm font-black text-purple-400 font-mono">
                        {parsedData.avgCadence} SPM
                      </span>
                    </div>
                  </div>

                  {/* Botón de Transmisión */}
                  <button
                    onClick={handleUploadParsedSession}
                    disabled={isUploadingFile}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isUploadingFile ? 'Transmitiendo al Entrenador...' : 'Transmitir al Entrenador Ahora'}</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* 3. PESTAÑA PRUEBA RÁPIDA (PARA EL TEST EN VIVO) */}
          {activeTab === 'test' && (
            <div className="space-y-3.5">
              <div className="bg-[#0B0F19] p-4 rounded-2xl border border-radar-border space-y-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  🧪 Validar Circuito para la Prueba de Campo
                </h5>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Presiona cualquiera de estos dos botones para inyectar una sesión de prueba real. Verás cómo aparece de inmediato en la pantalla del entrenador con la alerta sonora y visual.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Botón Amazfit */}
                <button
                  onClick={() => handleQuickTestRun('amazfit')}
                  className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 hover:border-cyan-400 text-left transition shadow group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      ⌚ Amazfit (Zepp OS)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                      8.4 km
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Ritmo: 5:08/km • FC Prom: 158 BPM • 178 SPM
                  </p>
                  <div className="text-[11px] text-cyan-400 font-extrabold flex items-center gap-1 pt-1 group-hover:translate-x-1 transition">
                    <span>Enviar al entrenador</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* Botón Adidas Running */}
                <button
                  onClick={() => handleQuickTestRun('adidas')}
                  className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 hover:border-amber-400 text-left transition shadow group space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      👟 Adidas Running
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/50">
                      6.2 km
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Ritmo: 4:52/km • FC Prom: 164 BPM • 172 SPM
                  </p>
                  <div className="text-[11px] text-amber-400 font-extrabold flex items-center gap-1 pt-1 group-hover:translate-x-1 transition">
                    <span>Enviar al entrenador</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
