import { Athlete, MetricSample, SimulatorConfig } from '../types';
import { calculateHeartRateZone } from '../../src/lib/calculations';
import { dataStore } from './dataStore';
import { alertEngine } from './alertEngine';

interface SimulatedRunnerState {
  athleteId: string;
  baseHeartRate: number;
  currentHeartRate: number;
  basePace: number;          // sec/km
  currentPace: number;
  cadence: number;
  distanceMeters: number;
  battery: number;
  angle: number;             // Para circuito circular
  speedFactor: number;
  isDisconnected: boolean;
  forcedAlert?: 'high_hr' | 'z5' | 'low_battery' | null;
}

export class SimulatorEngine {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private tickRateMs: number = 1000;
  private playbackSpeed: 1 | 2 | 5 = 1;
  private runnerStates: Map<string, SimulatedRunnerState> = new Map();
  private onTelemetryCallback: ((sample: MetricSample) => void) | null = null;
  
  // Coordenadas base del circuito (Parque Rosedal / Circuito Running)
  private centerLat = -34.5711;
  private centerLng = -58.4173;
  private radiusLat = 0.0045; // ~500m
  private radiusLng = 0.0060;

  constructor() {
    this.initRunnerStates();
  }

  public initRunnerStates() {
    this.runnerStates.clear();
    const athletes = Array.from(dataStore.athletes.values());

    athletes.forEach((athlete, index) => {
      const baseHr = 135 + ((index * 3) % 25); // 135 - 160
      const basePace = 300 + ((index * 15) % 90); // 5:00 - 6:30/km
      const initialAngle = (index / athletes.length) * Math.PI * 2;
      const baseBattery = 95 - ((index * 3) % 30);

      this.runnerStates.set(athlete.id, {
        athleteId: athlete.id,
        baseHeartRate: baseHr,
        currentHeartRate: index === 0 ? 181 : baseHr, // Pedro Gómez inicia elevado
        basePace: basePace,
        currentPace: basePace,
        cadence: 160 + ((index * 2) % 20),
        distanceMeters: 4000 + (index * 150),
        battery: index === 2 ? 8 : baseBattery,
        angle: initialAngle,
        speedFactor: 0.95 + (Math.random() * 0.1),
        isDisconnected: false,
        forcedAlert: index === 0 ? 'high_hr' : (index === 2 ? 'low_battery' : null)
      });
    });
  }

  public setTelemetryCallback(cb: (sample: MetricSample) => void) {
    this.onTelemetryCallback = cb;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.intervalId = setInterval(() => {
      this.tick();
    }, this.tickRateMs / this.playbackSpeed);
  }

  public pause() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public setSpeed(speed: 1 | 2 | 5) {
    this.playbackSpeed = speed;
    if (this.isRunning) {
      this.pause();
      this.start();
    }
  }

  public reset() {
    this.pause();
    this.initRunnerStates();
  }

  public injectAlert(athleteId: string, alertType: 'high_hr' | 'z5' | 'low_battery' | 'disconnect') {
    const state = this.runnerStates.get(athleteId);
    if (!state) return;

    if (alertType === 'high_hr') {
      state.currentHeartRate = 186;
      state.forcedAlert = 'high_hr';
    } else if (alertType === 'z5') {
      state.currentHeartRate = 188;
      state.forcedAlert = 'z5';
    } else if (alertType === 'low_battery') {
      state.battery = 5;
      state.forcedAlert = 'low_battery';
    } else if (alertType === 'disconnect') {
      state.isDisconnected = true;
      setTimeout(() => {
        state.isDisconnected = false;
      }, 20000);
    }
  }

  public clearAlert(athleteId: string) {
    const state = this.runnerStates.get(athleteId);
    if (!state) return;
    state.forcedAlert = null;
    state.currentHeartRate = state.baseHeartRate;
    state.isDisconnected = false;
    state.battery = 85;
  }

  private tick() {
    const athletes = Array.from(dataStore.athletes.values());
    const now = Date.now();

    athletes.forEach((athlete) => {
      let state = this.runnerStates.get(athlete.id);
      if (!state) return;

      if (state.isDisconnected) {
        // No emitir métricas durante desconexión
        athlete.currentStatus = 'attention';
        athlete.statusReason = 'Sin datos hace 90s';
        return;
      }

      // 1. Simulación de avance en circuito GPS
      const angularSpeed = (0.008 * state.speedFactor * this.playbackSpeed);
      state.angle += angularSpeed;
      const lat = this.centerLat + Math.sin(state.angle) * this.radiusLat + (Math.sin(now / 10000 + athlete.id.length) * 0.0003);
      const lng = this.centerLng + Math.cos(state.angle) * this.radiusLng + (Math.cos(now / 10000 + athlete.id.length) * 0.0003);

      // 2. Simulación de Frecuencia Cardíaca y Ritmo
      if (state.forcedAlert === 'high_hr' || state.forcedAlert === 'z5') {
        state.currentHeartRate = Math.min(192, Math.max(182, state.currentHeartRate + (Math.random() * 2 - 1)));
      } else {
        const jitter = (Math.random() * 4 - 2);
        state.currentHeartRate = Math.min(
          athlete.maxHeartRate - 5,
          Math.max(120, state.currentHeartRate + jitter * 0.3)
        );
      }

      // Variación sutil de ritmo
      const speedKmh = 3600 / state.currentPace;
      const distanceDeltaMeters = (speedKmh * 1000 / 3600) * (this.tickRateMs / 1000) * this.playbackSpeed;
      state.distanceMeters += distanceDeltaMeters;

      // Consumo de batería
      if (Math.random() < 0.05) {
        state.battery = Math.max(1, state.battery - 0.1);
      }

      const calculatedZone = calculateHeartRateZone(Math.round(state.currentHeartRate), athlete.maxHeartRate);

      // Dispositivo primario
      const primaryDev = athlete.devices.find(d => d.isPrimaryHR) || athlete.devices[0];

      const sample: MetricSample = {
        athleteId: athlete.id,
        source: primaryDev.type,
        sourceDevice: athlete.devices.map(d => d.name).join(' + '),
        timestamp: now,
        heartRate: Math.round(state.currentHeartRate),
        zone: calculatedZone,
        pace: Math.round(state.currentPace),
        speed: +(speedKmh).toFixed(1),
        distance: Math.round(state.distanceMeters),
        cadence: Math.round(state.cadence + (Math.random() * 4 - 2)),
        latitude: +(lat).toFixed(6),
        longitude: +(lng).toFixed(6),
        altitude: 25 + Math.round(Math.sin(state.angle * 2) * 5),
        calories: Math.round((state.distanceMeters / 1000) * 65),
        steps: Math.round((state.distanceMeters / 1000) * 1250),
        battery: Math.round(state.battery),
        signalQuality: 'excellent'
      };

      // Evaluar en motor de alertas
      const { status, statusReason, newAlert } = alertEngine.evaluateSample(athlete, sample, athlete.targetPaceMax);
      
      athlete.currentStatus = status;
      athlete.statusReason = statusReason;
      athlete.lastSample = sample;
      athlete.lastSeen = now;

      // Actualizar trail de coordenadas (últimas 15 posiciones)
      if (!athlete.trail) athlete.trail = [];
      athlete.trail.push([sample.latitude!, sample.longitude!]);
      if (athlete.trail.length > 20) athlete.trail.shift();

      if (newAlert) {
        dataStore.alerts.unshift(newAlert);
        if (dataStore.alerts.length > 100) dataStore.alerts.pop();
      }

      // Guardar en historial de métricas
      if (!dataStore.metricHistory.has(athlete.id)) {
        dataStore.metricHistory.set(athlete.id, []);
      }
      const history = dataStore.metricHistory.get(athlete.id)!;
      history.push(sample);
      if (history.length > 500) history.shift();

      // Emitir vía callback
      this.onTelemetryCallback?.(sample);
    });

    // Actualizar resumen de grupos
    this.updateGroupSummaries();
  }

  private updateGroupSummaries() {
    dataStore.groups.forEach((group) => {
      let normal = 0;
      let attention = 0;
      let alert = 0;
      let offline = 0;

      const groupAthletes = Array.from(dataStore.athletes.values()).filter(a => a.groupIds.includes(group.id));
      groupAthletes.forEach(a => {
        if (a.currentStatus === 'normal') normal++;
        else if (a.currentStatus === 'attention') attention++;
        else if (a.currentStatus === 'alert') alert++;
        else offline++;
      });

      group.statusSummary = { normal, attention, alert, offline };
      group.athleteCount = groupAthletes.length;
      group.activeAthletesCount = normal + attention + alert;
    });

    // Actualizar sesión activa
    if (dataStore.activeSessionId) {
      const session = dataStore.sessions.get(dataStore.activeSessionId);
      if (session && session.status === 'active') {
        const athletes = Array.from(dataStore.athletes.values());
        const totalDistance = athletes.reduce((acc, a) => acc + ((a.lastSample?.distance || 0) / 1000), 0);
        const validHRs = athletes.map(a => a.lastSample?.heartRate).filter(Boolean) as number[];
        const avgHR = validHRs.length > 0 ? Math.round(validHRs.reduce((a, b) => a + b, 0) / validHRs.length) : 150;

        session.stats = {
          avgHeartRate: avgHR,
          totalDistanceKm: +(totalDistance).toFixed(1),
          activeAthletes: athletes.filter(a => a.currentStatus !== 'offline').length,
          alertsCount: dataStore.alerts.filter(a => !a.acknowledged).length,
          durationSeconds: Math.floor((Date.now() - session.startTime) / 1000)
        };
      }
    }
  }

  public getConfig(): SimulatorConfig {
    return {
      athleteCount: 50,
      playbackSpeed: this.playbackSpeed,
      isRunning: this.isRunning,
      noiseLevel: 'realistic',
      injectSpontaneousAlerts: true
    };
  }
}

export const simulatorEngine = new SimulatorEngine();
