import { Athlete, Group, Coach, TrainingSession, AlertEvent, MetricSample, HistorySummary } from '../types';

export class DataStore {
  public coach: Coach;
  public groups: Map<string, Group> = new Map();
  public athletes: Map<string, Athlete> = new Map();
  public sessions: Map<string, TrainingSession> = new Map();
  public activeSessionId: string | null = null;
  public alerts: AlertEvent[] = [];
  public metricHistory: Map<string, MetricSample[]> = new Map(); // athleteId -> array of samples

  constructor() {
    this.coach = {
      id: 'coach-juan',
      name: 'Profesor Juan',
      lastName: 'Pérez',
      email: 'juan.entrenador@runradar.app',
      clubName: 'Club Running Central',
      organizationId: 'org-central',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };

    this.seedInitialData();
  }

  private seedInitialData() {
    const spanishFirstNames = [
      'Juan', 'Pedro', 'Ana', 'María', 'Lucas', 'Sofía', 'Martín', 'Camila', 
      'Gonzalo', 'Lucía', 'Diego', 'Valentina', 'Matías', 'Florencia', 'Joaquín', 
      'Julieta', 'Federico', 'Agustina', 'Facundo', 'Paula', 'Santiago', 'Micaela',
      'Nicolás', 'Carolina', 'Emiliano', 'Daniela', 'Esteban', 'Clara', 'Tomás',
      'Valeria', 'Rodrigo', 'Antonella', 'Maximiliano', 'Victoria', 'Bruno', 'Romina',
      'Ignacio', 'Laura', 'Franco', 'Belén', 'Mauro', 'Florencia', 'Ezequiel', 'Natalia',
      'Lautaro', 'Milagros', 'Mariano', 'Candela', 'Patricio', 'Abril', 'Ramiro', 'Sol',
      'Sebastián', 'Carla'
    ];

    const spanishLastNames = [
      'Gómez', 'Pérez', 'Rodríguez', 'López', 'Fernández', 'González', 'Martínez', 'Sánchez',
      'Romero', 'Díaz', 'Alvarez', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Acosta',
      'Benítez', 'Medina', 'Suárez', 'Herrera', 'Aguirre', 'Pereyra', 'Gutiérrez', 'Giménez'
    ];

    const deviceCombinations: Array<{
      source: MetricSample['source'];
      sourceDevice: string;
      brand: string;
      model: string;
    }> = [
      { source: 'phone', sourceDevice: '📱 Samsung Galaxy A54', brand: 'Samsung', model: 'Galaxy A54' },
      { source: 'phone', sourceDevice: '📱 iPhone 14', brand: 'Apple', model: 'iPhone 14' },
      { source: 'smartband', sourceDevice: '📱 Celular + ⌚ Xiaomi Band 8', brand: 'Xiaomi', model: 'Smart Band 8' },
      { source: 'smartband', sourceDevice: '📱 Celular + ⌚ Redmi Band 2', brand: 'Redmi', model: 'Smart Band 2' },
      { source: 'smartwatch', sourceDevice: '📱 Celular + ⌚ Garmin Forerunner 55', brand: 'Garmin', model: 'Forerunner 55' },
      { source: 'smartwatch', sourceDevice: '📱 Celular + ⌚ Amazfit GTS 4', brand: 'Amazfit', model: 'GTS 4' },
      { source: 'chest_strap', sourceDevice: '📱 Celular + ❤️ Polar H10', brand: 'Polar', model: 'H10 Chest Strap' },
      { source: 'smartwatch', sourceDevice: '📱 iPhone + ⌚ Apple Watch SE', brand: 'Apple', model: 'Apple Watch SE' },
    ];

    const groupsDef = [
      { id: 'group-martes', name: 'Running Martes', schedule: 'Martes 19:00 hs', count: 18, inviteCode: 'RUN-4821', targetPaceRange: [330, 375] as [number, number] },
      { id: 'group-jueves', name: 'Running Jueves', schedule: 'Jueves 19:00 hs', count: 24, inviteCode: 'RUN-7910', targetPaceRange: [345, 400] as [number, number] },
      { id: 'group-10k', name: 'Competición 10K', schedule: 'Sábados 08:30 hs', count: 12, inviteCode: 'RUN-1002', targetPaceRange: [270, 315] as [number, number] },
    ];

    let athleteIndex = 0;

    groupsDef.forEach((gDef) => {
      const athleteIds: string[] = [];

      for (let i = 0; i < gDef.count; i++) {
        const firstName = spanishFirstNames[athleteIndex % spanishFirstNames.length];
        const lastName = spanishLastNames[(athleteIndex * 3) % spanishLastNames.length];
        const athleteId = `athlete-${athleteIndex + 1}`;
        athleteIds.push(athleteId);

        const devCombo = deviceCombinations[athleteIndex % deviceCombinations.length];
        const maxHR = 180 + ((athleteIndex * 7) % 20); // 180 - 199 BPM

        // Generar estado inicial
        let status: Athlete['currentStatus'] = 'normal';
        let statusReason: string | undefined = undefined;

        if (i === 0 && gDef.id === 'group-martes') {
          // Pedro Gómez alerta
          status = 'alert';
          statusReason = 'FC por encima de 180 BPM';
        } else if (i === 1 && gDef.id === 'group-martes') {
          // Ana López atención
          status = 'attention';
          statusReason = 'Ritmo fuera de rango objetivo';
        } else if (i === 2 && gDef.id === 'group-martes') {
          // Martín desconexión
          status = 'attention';
          statusReason = 'Batería baja (8%)';
        }

        const athlete: Athlete = {
          id: athleteId,
          name: firstName,
          lastName: lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ejemplo.com`,
          phone: `+54 9 11 ${4000 + athleteIndex}-${1000 + athleteIndex}`,
          groupIds: [gDef.id],
          maxHeartRate: maxHR,
          restingHeartRate: 52 + ((athleteIndex * 3) % 15),
          targetPaceMin: gDef.targetPaceRange[0],
          targetPaceMax: gDef.targetPaceRange[1],
          currentStatus: status,
          statusReason: statusReason,
          lastSeen: Date.now() - (i === 2 ? 65000 : 2000),
          devices: [
            {
              id: `dev-${athleteId}-1`,
              type: 'phone',
              name: 'Celular',
              brand: devCombo.brand,
              model: devCombo.model,
              status: 'connected',
              isPrimaryGPS: true,
              batteryLevel: i === 2 ? 8 : 85 - ((athleteIndex * 5) % 40)
            },
            ...(devCombo.source !== 'phone' ? [{
              id: `dev-${athleteId}-2`,
              type: devCombo.source,
              name: devCombo.sourceDevice.replace('📱 Celular + ', ''),
              brand: devCombo.brand,
              model: devCombo.model,
              status: 'connected' as const,
              isPrimaryHR: true,
              batteryLevel: 90
            }] : [])
          ],
          permissions: {
            heartRate: true,
            location: true,
            workouts: true,
            steps: true,
            cadence: true,
            elevation: true,
            calories: true,
            wearables: devCombo.source !== 'phone',
            updatedAt: Date.now() - 86400000 * 3
          }
        };

        this.athletes.set(athleteId, athlete);
        athleteIndex++;
      }

      this.groups.set(gDef.id, {
        id: gDef.id,
        organizationId: 'org-central',
        coachId: this.coach.id,
        name: gDef.name,
        schedule: gDef.schedule,
        inviteCode: gDef.inviteCode,
        athleteCount: gDef.count,
        activeAthletesCount: gDef.count - 1,
        statusSummary: {
          normal: gDef.id === 'group-martes' ? 14 : (gDef.id === 'group-jueves' ? 21 : 10),
          attention: gDef.id === 'group-martes' ? 3 : (gDef.id === 'group-jueves' ? 2 : 2),
          alert: gDef.id === 'group-martes' ? 1 : (gDef.id === 'group-jueves' ? 1 : 0),
          offline: 0
        }
      });
    });

    // Crear sesión de entrenamiento activa por defecto
    const activeSession: TrainingSession = {
      id: 'session-live-01',
      groupId: 'group-martes',
      coachId: this.coach.id,
      name: 'Entrenamiento 8 km Aeróbico',
      startTime: Date.now() - 38 * 60 * 1000, // 38 minutos transcurridos
      status: 'active',
      targetDistanceKm: 8.0,
      targetPaceMin: 330, // 5:30/km
      targetPaceMax: 375, // 6:15/km
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

    this.sessions.set(activeSession.id, activeSession);
    this.activeSessionId = activeSession.id;

    // Alertas iniciales
    this.alerts = [
      {
        id: 'alert-1',
        athleteId: 'athlete-1',
        athleteName: 'Pedro Gómez',
        groupId: 'group-martes',
        ruleType: 'heart_rate_max',
        severity: 'alert',
        title: 'Frecuencia cardíaca elevada',
        message: 'FC en 181 BPM (Zona Z5) durante más de 60 segundos.',
        timestamp: Date.now() - 120000,
        acknowledged: false,
        valueRecorded: '181 BPM'
      },
      {
        id: 'alert-2',
        athleteId: 'athlete-3',
        athleteName: 'Martín Romero',
        groupId: 'group-martes',
        ruleType: 'low_battery',
        severity: 'attention',
        title: 'Batería baja en celular',
        message: 'Batería en 8%. Posible interrupción de telemetría.',
        timestamp: Date.now() - 300000,
        acknowledged: false,
        valueRecorded: '8%'
      }
    ];
  }

  public getAthleteHistory(athleteId: string, period: '7d' | '30d' | '90d'): HistorySummary {
    const multiplier = period === '7d' ? 1 : (period === '30d' ? 4 : 12);
    return {
      period,
      totalSessions: 3 * multiplier,
      totalDistanceKm: +(24.5 * multiplier).toFixed(1),
      avgPaceSeconds: 345, // 5:45/km
      avgHeartRate: 151,
      totalTrainingTimeMinutes: 145 * multiplier,
      trends: {
        distance: 'improving',
        pace: 'improving',
        heartRate: 'stable'
      }
    };
  }
}

export const dataStore = new DataStore();
