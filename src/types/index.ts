export type AthleteStatus = 'normal' | 'attention' | 'alert' | 'offline';

export type MetricSource = 
  | 'phone' 
  | 'smartband' 
  | 'smartwatch' 
  | 'chest_strap' 
  | 'health_connect' 
  | 'healthkit' 
  | 'simulator';

export interface MetricSample {
  athleteId: string;
  source: MetricSource;
  sourceDevice: string;          // Ej: "Samsung S23", "Xiaomi Smart Band 8", "Garmin Forerunner 265"
  timestamp: number;             // Epoch ms
  heartRate?: number;            // BPM
  zone?: 1 | 2 | 3 | 4 | 5;       // Zona calculada (Z1 a Z5)
  pace?: number;                 // Segundos por km (ej: 330 = 5:30/km)
  speed?: number;                // km/h
  distance?: number;             // Metros acumulados
  cadence?: number;              // Pasos por minuto (SPM)
  latitude?: number;
  longitude?: number;
  altitude?: number;             // Metros
  calories?: number;             // kCal
  steps?: number;
  battery?: number;              // 0 - 100%
  signalQuality?: 'excellent' | 'good' | 'poor' | 'lost';
}

export interface AthletePermissions {
  heartRate: boolean;
  location: boolean;
  workouts: boolean;
  steps: boolean;
  cadence: boolean;
  elevation: boolean;
  calories: boolean;
  wearables: boolean;
  updatedAt: number;
}

export interface DeviceConfig {
  id: string;
  type: MetricSource;
  name: string;
  brand?: string;
  model?: string;
  status: 'connected' | 'pending' | 'disconnected' | 'unsupported';
  isPrimaryHR?: boolean;
  isPrimaryGPS?: boolean;
  batteryLevel?: number;
  lastSync?: number;
}

export interface Athlete {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  groupIds: string[];
  maxHeartRate: number;          // FC Máx estimada o testeada (ej: 185)
  restingHeartRate: number;      // FC Reposo (ej: 55)
  targetPaceMin?: number;        // Segundos/km
  targetPaceMax?: number;        // Segundos/km
  devices: DeviceConfig[];
  permissions: AthletePermissions;
  currentStatus: AthleteStatus;
  statusReason?: string;
  lastSample?: MetricSample;
  lastSeen: number;
  trail?: [number, number][];     // Coordenadas recientes para el mapa
}

export interface Group {
  id: string;
  organizationId: string;
  coachId: string;
  name: string;                  // Ej: "Running Martes", "10K Competición"
  description?: string;
  schedule?: string;             // Ej: "Martes y Jueves 19:00"
  inviteCode: string;            // Ej: "RUN-4821"
  targetDistance?: number;
  targetPaceRange?: [number, number];
  athleteCount: number;
  activeAthletesCount: number;
  statusSummary: {
    normal: number;
    attention: number;
    alert: number;
    offline: number;
  };
}

export interface TrainingSession {
  id: string;
  groupId: string;
  coachId: string;
  name: string;                  // Ej: "Entrenamiento 8 km Fartlek"
  startTime: number;
  endTime?: number;
  status: 'active' | 'paused' | 'completed';
  targetDistanceKm?: number;
  targetPaceMin?: number;        // Segundos/km
  targetPaceMax?: number;        // Segundos/km
  targetDurationMinutes?: number;
  targetZones?: (1 | 2 | 3 | 4 | 5)[];
  stats: {
    avgHeartRate: number;
    totalDistanceKm: number;
    activeAthletes: number;
    alertsCount: number;
    durationSeconds: number;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'heart_rate_max' | 'zone_duration' | 'disconnection' | 'pace_out_of_bounds' | 'route_deviation' | 'low_battery';
  threshold: number;             // Ej: 180 (BPM), 480 (8 mins en Z5), 90 (segundos sin datos), 10 (batería)
  durationSeconds?: number;
  severity: 'attention' | 'alert';
  message: string;
  enabled: boolean;
}

export interface AlertEvent {
  id: string;
  athleteId: string;
  athleteName: string;
  groupId: string;
  ruleType: AlertRule['type'];
  severity: 'attention' | 'alert';
  title: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  valueRecorded?: number | string;
}

export interface Coach {
  id: string;
  name: string;
  lastName: string;
  email: string;
  clubName: string;
  photoUrl?: string;
  organizationId: string;
}

export interface SimulatorConfig {
  athleteCount: 10 | 25 | 50 | 100;
  playbackSpeed: 1 | 2 | 5;
  isRunning: boolean;
  noiseLevel: 'low' | 'realistic' | 'stress_test';
  injectSpontaneousAlerts: boolean;
}

export interface HistorySummary {
  period: '7d' | '30d' | '90d';
  totalSessions: number;
  totalDistanceKm: number;
  avgPaceSeconds: number;
  avgHeartRate: number;
  totalTrainingTimeMinutes: number;
  trends: {
    distance: 'improving' | 'stable' | 'declining';
    pace: 'improving' | 'stable' | 'declining';
    heartRate: 'improving' | 'stable' | 'declining';
  };
}

export const SUPER_ADMIN_EMAIL = 'orostizagamario@gmail.com';

export type UserRole = 'super_admin' | 'coach' | 'runner';

export interface CoachMessage {
  id: string;
  coachId: string;
  coachName: string;
  targetAthleteId?: string; // Si no está presente, es para todo el grupo/pelotón
  targetAthleteName?: string;
  groupId: string;
  text: string;
  type: 'instruction' | 'warning' | 'cheer' | 'hydration';
  timestamp: number;
  delivered?: boolean;
}

export interface GroupChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: 'coach' | 'runner' | 'super_admin';
  text: string;
  timestamp: number;
}

export interface GroupForumPost {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  authorRole: 'coach' | 'runner' | 'super_admin';
  title: string;
  content: string;
  isPinned?: boolean;
  timestamp: number;
  likesCount: number;
  commentsCount: number;
  category?: 'announcement' | 'training' | 'race' | 'social';
}

export interface AICoachingSuggestion {
  id: string;
  athleteId: string;
  athleteName: string;
  groupId: string;
  type: 'overexertion' | 'pace_drop' | 'cadence_fatigue' | 'gap_alert' | 'hydration';
  priority: 'high' | 'medium' | 'low';
  currentValue: string;
  triggerReason: string;
  suggestedAction: string;
  suggestedMessage: string;
  timestamp: number;
}

