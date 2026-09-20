import { Athlete, Group, Coach, TrainingSession, AlertEvent, MetricSample } from '../types';

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

const centerLat = -34.5711;
const centerLng = -58.4173;
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
    timestamp: Date.now() - 1000,
    heartRate: hr,
    zone: (i === 0 ? 5 : (hr > 150 ? 4 : (hr > 130 ? 3 : 2))) as any,
    pace: basePace,
    speed: basePace > 0 ? 3600 / basePace : 10,
    cadence: 162 + ((i * 2) % 18),
    distance: 4200 + (i * 120),
    latitude: lat,
    longitude: lng,
    altitude: 25,
    calories: 310 + (i * 15),
    battery: i === 2 ? 8 : 88,
    signalQuality: 'excellent',
    source: i % 2 === 0 ? 'smartwatch' : 'phone',
    sourceDevice: i % 2 === 0 ? '⌚ Garmin Forerunner' : '📱 Celular GPS'
  };

  const trail: [number, number][] = [];
  for (let t = 10; t >= 0; t--) {
    const pastAngle = angle - (t * 0.05);
    trail.push([
      centerLat + Math.sin(pastAngle) * radiusLat,
      centerLng + Math.cos(pastAngle) * radiusLng
    ]);
  }

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
