import { AthleteStatus, MetricSample } from '../types';

/**
 * Calcula la zona cardíaca del atleta (Z1 a Z5) en base a su FC Máxima
 */
export function calculateHeartRateZone(heartRate: number, maxHeartRate: number = 185): 1 | 2 | 3 | 4 | 5 {
  if (heartRate <= 0 || !heartRate) return 1;
  const pct = (heartRate / maxHeartRate) * 100;

  if (pct < 60) return 1; // Z1: Recuperación Activa (< 60%)
  if (pct < 70) return 2; // Z2: Aeróbico Ligero / Base (60-70%)
  if (pct < 80) return 3; // Z3: Tempo / Aeróbico Moderado (70-80%)
  if (pct < 90) return 4; // Z4: Umbral Anaeróbico (80-90%)
  return 5;               // Z5: Máxima Intensidad / Anaeróbico (> 90%)
}

/**
 * Nombre y color de la Zona Cardíaca
 */
export function getZoneDetails(zone: 1 | 2 | 3 | 4 | 5): { label: string; name: string; color: string; bg: string; border: string } {
  switch (zone) {
    case 1:
      return { label: 'Z1', name: 'Recuperación', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40' };
    case 2:
      return { label: 'Z2', name: 'Aeróbico Base', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40' };
    case 3:
      return { label: 'Z3', name: 'Tempo', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40' };
    case 4:
      return { label: 'Z4', name: 'Umbral', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40' };
    case 5:
      return { label: 'Z5', name: 'Máximo', color: 'text-rose-500', bg: 'bg-rose-500/20', border: 'border-rose-500/40' };
  }
}

/**
 * Formatea ritmo en segundos/km a formato "MM:SS/km"
 */
export function formatPace(secondsPerKm?: number): string {
  if (!secondsPerKm || secondsPerKm <= 0 || !isFinite(secondsPerKm)) return '--:--/km';
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}/km`;
}

/**
 * Convierte velocidad (km/h) a ritmo (segundos/km)
 */
export function speedToPace(kmh?: number): number {
  if (!kmh || kmh <= 0) return 0;
  return Math.round(3600 / kmh);
}

/**
 * Formatea distancia en metros a km legibles (ej: 5.8 km)
 */
export function formatDistance(meters?: number): string {
  if (meters === undefined || meters === null || isNaN(meters)) return '0.0 km';
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

/**
 * Formatea segundos transcurridos a "MM:SS" o "HH:MM:SS"
 */
export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds < 0) return '00:00';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Formatea tiempo relativo ("hace 4 s", "hace 2 min", "hace 1 h")
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'Sin datos';
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  
  if (diffSeconds < 5) return 'En vivo';
  if (diffSeconds < 60) return `hace ${diffSeconds} s`;
  const diffMins = Math.floor(diffSeconds / 60);
  if (diffMins < 60) return `hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  return `hace ${diffHours} h`;
}

/**
 * Detalles y estilos visuales para los 4 estados principales del atleta
 */
export function getStatusDetails(status: AthleteStatus): {
  icon: string;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  ringColor: string;
  accentBg: string;
} {
  switch (status) {
    case 'alert':
      return {
        icon: '🔴',
        label: 'ALERTA',
        badgeBg: 'bg-red-950/80',
        badgeText: 'text-red-400',
        badgeBorder: 'border-red-500/50',
        ringColor: 'ring-red-500/40 ring-2',
        accentBg: 'bg-red-500',
      };
    case 'attention':
      return {
        icon: '🟡',
        label: 'ATENCIÓN',
        badgeBg: 'bg-amber-950/80',
        badgeText: 'text-amber-400',
        badgeBorder: 'border-amber-500/50',
        ringColor: 'ring-amber-500/40 ring-1',
        accentBg: 'bg-amber-500',
      };
    case 'normal':
      return {
        icon: '🟢',
        label: 'NORMAL',
        badgeBg: 'bg-emerald-950/80',
        badgeText: 'text-emerald-400',
        badgeBorder: 'border-emerald-500/50',
        ringColor: '',
        accentBg: 'bg-emerald-500',
      };
    case 'offline':
    default:
      return {
        icon: '⚪',
        label: 'SIN DATOS',
        badgeBg: 'bg-slate-900/80',
        badgeText: 'text-slate-400',
        badgeBorder: 'border-slate-700/50',
        ringColor: '',
        accentBg: 'bg-slate-500',
      };
  }
}

/**
 * Generador de CSV para exportación de sesiones
 */
export function exportSessionToCSV(
  sessionName: string,
  groupName: string,
  athletesData: Array<{
    name: string;
    status: string;
    heartRate?: number;
    zone?: number;
    pace?: number;
    distance?: number;
    cadence?: number;
    calories?: number;
    sourceDevice?: string;
  }>
): string {
  const headers = [
    'Corredor',
    'Estado',
    'FC (BPM)',
    'Zona FC',
    'Ritmo (min/km)',
    'Distancia (km)',
    'Cadencia (SPM)',
    'Calorías (kcal)',
    'Dispositivos'
  ];

  const rows = athletesData.map(a => [
    `"${a.name}"`,
    `"${a.status.toUpperCase()}"`,
    a.heartRate || 0,
    a.zone ? `Z${a.zone}` : 'N/A',
    `"${formatPace(a.pace)}"`,
    ((a.distance || 0) / 1000).toFixed(2),
    a.cadence || 0,
    a.calories || 0,
    `"${a.sourceDevice || 'Celular'}"`
  ]);

  const metaHeader = `# RUNRADAR (RR) - REPORTE DE SESION DE RUNNING\n# Sesion: ${sessionName}\n# Grupo: ${groupName}\n# Fecha: ${new Date().toLocaleString()}\n\n`;
  return metaHeader + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
