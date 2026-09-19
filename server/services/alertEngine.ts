import { AlertEvent, AlertRule, Athlete, MetricSample } from '../types';
import { calculateHeartRateZone } from '../../src/lib/calculations';

export class AlertEngine {
  private rules: AlertRule[] = [
    {
      id: 'rule-fc-max',
      name: 'Frecuencia Cardíaca Máxima',
      type: 'heart_rate_max',
      threshold: 180,
      durationSeconds: 60,
      severity: 'alert',
      message: 'FC por encima de 180 BPM durante más de 60 segundos.',
      enabled: true
    },
    {
      id: 'rule-z5-duration',
      name: 'Permanencia en Zona 5',
      type: 'zone_duration',
      threshold: 5, // Zona 5
      durationSeconds: 480, // 8 minutos
      severity: 'alert',
      message: 'Permanencia en Zona 5 (intensidad máxima) superior a 8 minutos.',
      enabled: true
    },
    {
      id: 'rule-disconnect',
      name: 'Desconexión de Telemetría',
      type: 'disconnection',
      threshold: 90, // 90 segundos sin datos
      severity: 'attention',
      message: 'No se reciben datos desde hace más de 90 segundos.',
      enabled: true
    },
    {
      id: 'rule-battery',
      name: 'Batería Crítica de Dispositivo',
      type: 'low_battery',
      threshold: 10, // 10%
      severity: 'attention',
      message: 'Batería del dispositivo inferior al 10%.',
      enabled: true
    },
    {
      id: 'rule-pace',
      name: 'Desvío de Ritmo Objetivo',
      type: 'pace_out_of_bounds',
      threshold: 45, // 45 segundos de desvío
      durationSeconds: 120,
      severity: 'attention',
      message: 'Ritmo fuera del rango objetivo configurado para la sesión.',
      enabled: true
    }
  ];

  // Tracking de duraciones continuas
  private highHrStartTimes: Map<string, number> = new Map();
  private z5StartTimes: Map<string, number> = new Map();
  private lastAlertsEmitted: Map<string, number> = new Map(); // athleteId+ruleId -> timestamp

  public evaluateSample(athlete: Athlete, sample: MetricSample, sessionTargetPaceMax?: number): {
    status: Athlete['currentStatus'];
    statusReason?: string;
    newAlert?: AlertEvent;
  } {
    const now = Date.now();
    let status: Athlete['currentStatus'] = 'normal';
    let statusReason: string | undefined = undefined;
    let newAlert: AlertEvent | undefined = undefined;

    const hr = sample.heartRate || 0;
    const zone = sample.zone || calculateHeartRateZone(hr, athlete.maxHeartRate);

    // 1. Regla FC Máxima (> 180 BPM)
    if (hr >= 180) {
      if (!this.highHrStartTimes.has(athlete.id)) {
        this.highHrStartTimes.set(athlete.id, now);
      }
      const duration = (now - this.highHrStartTimes.get(athlete.id)!) / 1000;
      if (duration >= 60) {
        status = 'alert';
        statusReason = `FC en ${hr} BPM por > 60s`;
        if (this.shouldEmitAlert(athlete.id, 'rule-fc-max', now)) {
          newAlert = this.createAlert(
            athlete,
            'heart_rate_max',
            'alert',
            'Frecuencia cardíaca elevada',
            `FC en ${hr} BPM por encima del umbral configurado (180 BPM).`,
            `${hr} BPM`
          );
        }
      }
    } else {
      this.highHrStartTimes.delete(athlete.id);
    }

    // 2. Regla Zona 5 (> 8 min)
    if (zone === 5) {
      if (!this.z5StartTimes.has(athlete.id)) {
        this.z5StartTimes.set(athlete.id, now);
      }
      const z5Duration = (now - this.z5StartTimes.get(athlete.id)!) / 1000;
      if (z5Duration >= 480) {
        status = 'alert';
        statusReason = `Más de 8 min en Zona 5`;
        if (this.shouldEmitAlert(athlete.id, 'rule-z5-duration', now)) {
          newAlert = this.createAlert(
            athlete,
            'zone_duration',
            'alert',
            'Zona máxima prolongada',
            `El corredor lleva más de 8 minutos en Zona 5.`,
            'Z5 (> 8 min)'
          );
        }
      }
    } else {
      this.z5StartTimes.delete(athlete.id);
    }

    // 3. Regla Batería Baja (< 10%)
    if (sample.battery !== undefined && sample.battery <= 10) {
      if (status !== 'alert') {
        status = 'attention';
        statusReason = `Batería baja (${sample.battery}%)`;
      }
      if (this.shouldEmitAlert(athlete.id, 'rule-battery', now)) {
        newAlert = this.createAlert(
          athlete,
          'low_battery',
          'attention',
          'Batería crítica',
          `Batería de ${sample.sourceDevice} al ${sample.battery}%.`,
          `${sample.battery}%`
        );
      }
    }

    // 4. Regla Desvío de Ritmo
    if (sessionTargetPaceMax && sample.pace && sample.pace > sessionTargetPaceMax + 60) {
      if (status === 'normal') {
        status = 'attention';
        statusReason = 'Ritmo por debajo del objetivo';
      }
    }

    return { status, statusReason, newAlert };
  }

  private shouldEmitAlert(athleteId: string, ruleId: string, now: number): boolean {
    const key = `${athleteId}:${ruleId}`;
    const last = this.lastAlertsEmitted.get(key) || 0;
    // Evitar spam de alertas: 3 minutos entre alertas del mismo tipo
    if (now - last > 180000) {
      this.lastAlertsEmitted.set(key, now);
      return true;
    }
    return false;
  }

  private createAlert(
    athlete: Athlete,
    ruleType: AlertRule['type'],
    severity: 'attention' | 'alert',
    title: string,
    message: string,
    valueRecorded?: string
  ): AlertEvent {
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      athleteId: athlete.id,
      athleteName: `${athlete.name} ${athlete.lastName}`,
      groupId: athlete.groupIds[0] || 'general',
      ruleType,
      severity,
      title,
      message,
      timestamp: Date.now(),
      acknowledged: false,
      valueRecorded
    };
  }

  public getRules(): AlertRule[] {
    return this.rules;
  }
}

export const alertEngine = new AlertEngine();
