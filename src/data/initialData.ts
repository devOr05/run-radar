import { Athlete, Group, Coach, TrainingSession, AlertEvent, MetricSample, CompletedSessionRecord } from '../types';

export const initialCoach: Coach = {
  id: 'coach-juan',
  name: 'Profesor Juan',
  lastName: 'Pérez',
  email: 'juan.entrenador@runradar.app',
  clubName: 'Club Running Central',
  organizationId: 'org-central',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

export const initialGroups: Group[] = [
  {
    id: 'group-martes',
    organizationId: 'org-central',
    coachId: 'coach-juan',
    name: 'Pelotón Fondistas A',
    schedule: 'Martes 19:00 hs',
    inviteCode: 'RUN-4821',
    targetDistance: 8.0,
    targetPaceRange: [330, 375],
    athleteCount: 18,
    activeAthletesCount: 17,
    statusSummary: { normal: 14, attention: 3, alert: 1, offline: 0 }
  },
  {
    id: 'group-jueves',
    organizationId: 'org-central',
    coachId: 'coach-juan',
    name: 'Grupo Progresivo Jueves',
    schedule: 'Jueves 19:00 hs',
    inviteCode: 'RUN-7910',
    targetDistance: 10.0,
    targetPaceRange: [345, 400],
    athleteCount: 24,
    activeAthletesCount: 23,
    statusSummary: { normal: 21, attention: 2, alert: 1, offline: 0 }
  },
  {
    id: 'group-10k',
    organizationId: 'org-central',
    coachId: 'coach-juan',
    name: 'Competición 10K Elite',
    schedule: 'Sábados 08:30 hs',
    inviteCode: 'RUN-1002',
    targetDistance: 10.0,
    targetPaceRange: [270, 315],
    athleteCount: 12,
    activeAthletesCount: 12,
    statusSummary: { normal: 10, attention: 2, alert: 0, offline: 0 }
  }
];

const spanishFirstNames = [
  'Pedro', 'Ana', 'Martín', 'Sofía', 'Lucas', 'Camila', 'Gonzalo', 'Lucía',
  'Diego', 'Valentina', 'Matías', 'Florencia', 'Joaquín', 'Julieta', 'Federico',
  'Agustina', 'Facundo', 'Paula', 'Santiago', 'Micaela', 'Nicolás', 'Carolina'
];

const spanishLastNames = [
  'Gómez', 'López', 'Rodríguez', 'Fernández', 'González', 'Martínez', 'Sánchez',
  'Romero', 'Díaz', 'Alvarez', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Acosta'
];

// Coordenadas base de referencia: Mar del Plata (-38.0055, -57.5426)
const centerLat = -38.0055;
const centerLng = -57.5426;
const radiusLat = 0.0045;
const radiusLng = 0.0060;

export const initialAthletes: Athlete[] = spanishFirstNames.slice(0, 18).map((firstName, i) => {
  const lastName = spanishLastNames[i % spanishLastNames.length];
  const athleteId = `athlete-${i + 1}`;
  const angle = (i / 18) * Math.PI * 2;
  const lat = centerLat + Math.sin(angle) * radiusLat;
  const lng = centerLng + Math.cos(angle) * radiusLng;
  const baseHr = 135 + ((i * 3) % 25);
  const basePace = 300 + ((i * 15) % 90);
  const maxHR = 180 + ((i * 7) % 20);

  let status: Athlete['currentStatus'] = 'normal';
  let statusReason: string | undefined = undefined;
  let hr = baseHr;

  if (i === 0) {
    status = 'alert';
    statusReason = 'FC por encima de 180 BPM';
    hr = 182;
  } else if (i === 1) {
    status = 'attention';
    statusReason = 'Ritmo fuera de rango objetivo';
  } else if (i === 2) {
    status = 'attention';
    statusReason = 'Batería baja (8%)';
  }

  const sample: MetricSample = {
    athleteId,
    timestamp: Date.now(),
    heartRate: undefined,
    zone: undefined,
    pace: undefined,
    speed: 0,
    cadence: 0,
    distance: 0,
    latitude: undefined,
    longitude: undefined,
    altitude: 0,
    calories: 0,
    battery: 100,
    signalQuality: 'excellent',
    source: 'phone',
    sourceDevice: '📱 Celular GPS'
  };

  const trail: [number, number][] = [];

  return {
    id: athleteId,
    name: firstName,
    lastName: lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ejemplo.com`,
    phone: `+54 9 11 ${4000 + i}-${1000 + i}`,
    groupIds: ['group-martes'],
    maxHeartRate: maxHR,
    restingHeartRate: 55,
    targetPaceMin: 330,
    targetPaceMax: 375,
    currentStatus: status,
    statusReason: statusReason,
    lastSeen: Date.now() - 1000,
    lastSample: sample,
    trail: trail,
    devices: [
      {
        id: `dev-${athleteId}-1`,
        type: 'phone',
        name: '📱 Celular Principal',
        status: 'connected',
        isPrimaryGPS: true,
        batteryLevel: i === 2 ? 8 : 88
      }
    ],
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
  };
});

export const initialActiveSession: TrainingSession = {
  id: 'session-live-01',
  groupId: 'group-martes',
  coachId: 'coach-juan',
  name: 'Entrenamiento 8 km Aeróbico',
  startTime: Date.now() - 38 * 60 * 1000,
  status: 'active',
  targetDistanceKm: 8.0,
  targetDurationMinutes: 60,
  targetZones: [2, 3, 4],
  stats: {
    avgHeartRate: 153,
    totalDistanceKm: 92.4,
    activeAthletes: 18,
    alertsCount: 2,
    durationSeconds: 38 * 60 + 14
  }
};

export const initialAlerts: AlertEvent[] = [
  {
    id: 'alert-1',
    athleteId: 'athlete-1',
    athleteName: 'Pedro Gómez',
    groupId: 'group-martes',
    ruleType: 'heart_rate_max',
    severity: 'alert',
    title: 'Frecuencia cardíaca elevada',
    message: 'FC en 182 BPM (Zona Z5) durante más de 60 segundos.',
    timestamp: Date.now() - 120000,
    acknowledged: false,
    valueRecorded: '182 BPM'
  },
  {
    id: 'alert-2',
    athleteId: 'athlete-3',
    athleteName: 'Martín Rodríguez',
    groupId: 'group-martes',
    ruleType: 'low_battery',
    severity: 'attention',
    title: 'Batería baja en dispositivo',
    message: 'Nivel de batería crítico (8%). Posible pérdida de telemetría.',
    timestamp: Date.now() - 180000,
    acknowledged: false,
    valueRecorded: '8%'
  }
];

export const initialCompletedSessions: CompletedSessionRecord[] = [
  {
    id: 'session-rec-1',
    groupId: 'group-martes',
    groupName: 'Pelotón Fondistas A',
    athleteId: 'athlete-1',
    athleteName: 'Pedro Gómez',
    sourceDevice: '⌚ Amazfit Balance',
    date: 'Hoy, 07:30 hs',
    startTime: Date.now() - 3600000 * 2,
    endTime: Date.now() - 3600000 * 1.3,
    durationSeconds: 2480, // ~41 mins
    distanceMeters: 8200,  // 8.2 km
    avgPaceSeconds: 302,   // 5:02/km
    bestPaceSeconds: 275,  // 4:35/km
    avgHeartRate: 158,
    maxHeartRate: 176,
    avgCadence: 176,
    totalCalories: 620,
    totalSteps: 7240,
    syncTimestamp: Date.now() - 1800000,
    syncType: 'offline_sync',
    notes: 'Entrenamiento completado sin celular. Sincronizado desde el reloj al volver.',
    splits: [
      { km: 1, paceSeconds: 320, avgHr: 142 },
      { km: 2, paceSeconds: 310, avgHr: 150 },
      { km: 3, paceSeconds: 305, avgHr: 155 },
      { km: 4, paceSeconds: 300, avgHr: 160 },
      { km: 5, paceSeconds: 298, avgHr: 163 },
      { km: 6, paceSeconds: 295, avgHr: 166 },
      { km: 7, paceSeconds: 290, avgHr: 170 },
      { km: 8, paceSeconds: 285, avgHr: 174 }
    ]
  },
  {
    id: 'session-rec-2',
    groupId: 'group-martes',
    groupName: 'Pelotón Fondistas A',
    athleteId: 'athlete-2',
    athleteName: 'Ana López',
    sourceDevice: '⌚ Garmin Forerunner 265',
    date: 'Hoy, 08:00 hs',
    startTime: Date.now() - 3600000 * 3,
    endTime: Date.now() - 3600000 * 2.35,
    durationSeconds: 2325, // ~38m 45s
    distanceMeters: 8000,  // 8.0 km
    avgPaceSeconds: 290,   // 4:50/km
    bestPaceSeconds: 270,  // 4:30/km
    avgHeartRate: 164,
    maxHeartRate: 181,
    avgCadence: 182,
    totalCalories: 590,
    totalSteps: 7080,
    syncTimestamp: Date.now() - 3600000,
    syncType: 'offline_sync',
    notes: 'Fondo parejo, sensaciones muy buenas en los últimos 2 km.'
  },
  {
    id: 'session-rec-3',
    groupId: 'group-jueves',
    groupName: 'Grupo Progresivo Jueves',
    athleteId: 'athlete-5',
    athleteName: 'Lucas Sofía',
    sourceDevice: '⌚ Xiaomi Smart Band 9',
    date: 'Ayer, 19:15 hs',
    startTime: Date.now() - 86400000,
    endTime: Date.now() - 86400000 + 3250000,
    durationSeconds: 3250, // 54 mins
    distanceMeters: 10500, // 10.5 km
    avgPaceSeconds: 309,   // 5:09/km
    avgHeartRate: 152,
    maxHeartRate: 169,
    avgCadence: 174,
    totalCalories: 780,
    totalSteps: 9420,
    syncTimestamp: Date.now() - 82000000,
    syncType: 'offline_sync',
    notes: 'Sincronizado vía Mi Fitness / RunRadar offline.'
  }
];

