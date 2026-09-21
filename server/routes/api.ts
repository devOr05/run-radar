import { Router } from 'express';
import { dataStore } from '../services/dataStore';
import { simulatorEngine } from '../services/simulator';
import { exportSessionToCSV } from '../../src/lib/calculations';
import { Athlete, AthletePermissions } from '../types';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'RunRadar (RR)', timestamp: Date.now() });
});

// Coach Info
apiRouter.get('/coach/me', (_req, res) => {
  res.json(dataStore.coach);
});

// Grupos
apiRouter.get('/groups', (_req, res) => {
  res.json(Array.from(dataStore.groups.values()));
});

apiRouter.get('/groups/:id', (req, res) => {
  const group = dataStore.groups.get(req.params.id);
  if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });

  const athletes = Array.from(dataStore.athletes.values()).filter(a => a.groupIds.includes(group.id));
  res.json({ ...group, athletes });
});

// Atletas
apiRouter.get('/athletes', (req, res) => {
  const groupId = req.query.groupId as string;
  let athletes = Array.from(dataStore.athletes.values());
  if (groupId) {
    athletes = athletes.filter(a => a.groupIds.includes(groupId));
  }
  res.json(athletes);
});

apiRouter.get('/athletes/:id', (req, res) => {
  const athlete = dataStore.athletes.get(req.params.id);
  if (!athlete) return res.status(404).json({ error: 'Atleta no encontrado' });
  res.json(athlete);
});

apiRouter.get('/athletes/:id/history', (req, res) => {
  const period = (req.query.period as '7d' | '30d' | '90d') || '7d';
  const history = dataStore.getAthleteHistory(req.params.id, period);
  res.json(history);
});

// Registro de Corredor (Onboarding sin fricción)
apiRouter.post('/runners/join', (req, res) => {
  const { name, lastName, email, phone, inviteCode, devices, permissions } = req.body;

  // Buscar grupo por código
  const group = Array.from(dataStore.groups.values()).find(g => g.inviteCode.toUpperCase() === inviteCode?.toUpperCase());
  if (!group) {
    return res.status(400).json({ error: 'Código de invitación no válido' });
  }

  const newId = `athlete-${Date.now()}`;
  const defaultPerms: AthletePermissions = permissions || {
    heartRate: true,
    location: true,
    workouts: true,
    steps: true,
    cadence: true,
    elevation: true,
    calories: true,
    wearables: true,
    updatedAt: Date.now()
  };

  const newAthlete: Athlete = {
    id: newId,
    name: name || 'Nuevo',
    lastName: lastName || 'Corredor',
    email: email || `${newId}@runradar.app`,
    phone,
    groupIds: [group.id],
    maxHeartRate: 185,
    restingHeartRate: 60,
    targetPaceMin: group.targetPaceRange?.[0] || 330,
    targetPaceMax: group.targetPaceRange?.[1] || 390,
    currentStatus: 'normal',
    lastSeen: Date.now(),
    devices: devices || [
      {
        id: `dev-${newId}-phone`,
        type: 'phone',
        name: '📱 Celular Principal',
        status: 'connected',
        isPrimaryGPS: true,
        isPrimaryHR: false,
        batteryLevel: 92
      }
    ],
    permissions: defaultPerms
  };

  dataStore.athletes.set(newId, newAthlete);
  group.athleteCount = Array.from(dataStore.athletes.values()).filter(a => a.groupIds.includes(group.id)).length;
  
  res.json({ success: true, athlete: newAthlete, group });
});

// Actualizar Permisos
apiRouter.put('/runners/:id/permissions', (req, res) => {
  const athlete = dataStore.athletes.get(req.params.id);
  if (!athlete) return res.status(404).json({ error: 'Atleta no encontrado' });

  athlete.permissions = {
    ...athlete.permissions,
    ...req.body,
    updatedAt: Date.now()
  };

  res.json({ success: true, permissions: athlete.permissions });
});

// Sesiones
apiRouter.get('/sessions/active', (_req, res) => {
  if (!dataStore.activeSessionId) return res.json(null);
  const session = dataStore.sessions.get(dataStore.activeSessionId);
  res.json(session || null);
});

apiRouter.post('/sessions/start', (req, res) => {
  const { name, groupId, targetDistanceKm, targetDurationMinutes } = req.body;
  const newSessionId = `session-${Date.now()}`;
  
  const newSession = {
    id: newSessionId,
    groupId: groupId || 'group-martes',
    coachId: dataStore.coach.id,
    name: name || 'Entrenamiento Grupal',
    startTime: Date.now(),
    status: 'active' as const,
    targetDistanceKm: Number(targetDistanceKm) || 8,
    targetDurationMinutes: Number(targetDurationMinutes) || 60,
    targetZones: [2, 3, 4] as (1 | 2 | 3 | 4 | 5)[],
    stats: {
      avgHeartRate: 152,
      totalDistanceKm: 0,
      activeAthletes: dataStore.athletes.size,
      alertsCount: 0,
      durationSeconds: 0
    }
  };

  dataStore.sessions.set(newSessionId, newSession);
  dataStore.activeSessionId = newSessionId;
  simulatorEngine.start();

  res.json(newSession);
});

apiRouter.post('/sessions/pause', (_req, res) => {
  if (dataStore.activeSessionId) {
    const session = dataStore.sessions.get(dataStore.activeSessionId);
    if (session) {
      session.status = session.status === 'active' ? 'paused' : 'active';
      if (session.status === 'paused') simulatorEngine.pause();
      else simulatorEngine.start();
      return res.json(session);
    }
  }
  res.status(400).json({ error: 'No hay sesión activa' });
});

apiRouter.post('/sessions/stop', (_req, res) => {
  if (dataStore.activeSessionId) {
    const session = dataStore.sessions.get(dataStore.activeSessionId);
    if (session) {
      session.status = 'completed';
      session.endTime = Date.now();
      dataStore.activeSessionId = null;
      simulatorEngine.pause();
      return res.json(session);
    }
  }
  res.status(400).json({ error: 'No hay sesión activa para detener' });
});

// Exportación CSV
apiRouter.get('/sessions/:id/export-csv', (req, res) => {
  const session = dataStore.sessions.get(req.params.id) || (dataStore.activeSessionId ? dataStore.sessions.get(dataStore.activeSessionId) : null);
  const group = session ? dataStore.groups.get(session.groupId) : null;
  const groupAthletes = Array.from(dataStore.athletes.values()).filter(a => session ? a.groupIds.includes(session.groupId) : true);

  const athletesData = groupAthletes.map(a => ({
    name: `${a.name} ${a.lastName}`,
    status: a.currentStatus,
    heartRate: a.lastSample?.heartRate,
    zone: a.lastSample?.zone,
    pace: a.lastSample?.pace,
    distance: a.lastSample?.distance,
    cadence: a.lastSample?.cadence,
    calories: a.lastSample?.calories,
    sourceDevice: a.devices.map(d => d.name).join(' + ')
  }));

  const csv = exportSessionToCSV(session?.name || 'Entrenamiento en Vivo', group?.name || 'Todos los Grupos', athletesData);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=runradar_sesion_${Date.now()}.csv`);
  res.send(csv);
});

// Alertas
apiRouter.get('/alerts', (_req, res) => {
  res.json(dataStore.alerts);
});

apiRouter.post('/alerts/:id/ack', (req, res) => {
  const alert = dataStore.alerts.find(a => a.id === req.params.id);
  if (alert) {
    alert.acknowledged = true;
    return res.json({ success: true, alert });
  }
  res.status(404).json({ error: 'Alerta no encontrada' });
});

// Controles del Simulador
apiRouter.post('/simulator/start', (_req, res) => {
  simulatorEngine.start();
  res.json(simulatorEngine.getConfig());
});

apiRouter.post('/simulator/pause', (_req, res) => {
  simulatorEngine.pause();
  res.json(simulatorEngine.getConfig());
});

apiRouter.post('/simulator/speed', (req, res) => {
  const speed = Number(req.body.speed) as 1 | 2 | 5;
  if ([1, 2, 5].includes(speed)) {
    simulatorEngine.setSpeed(speed);
  }
  res.json(simulatorEngine.getConfig());
});

apiRouter.post('/simulator/reset', (_req, res) => {
  simulatorEngine.reset();
  res.json(simulatorEngine.getConfig());
});

apiRouter.post('/simulator/inject-alert', (req, res) => {
  const { athleteId, type } = req.body;
  simulatorEngine.injectAlert(athleteId, type);
  res.json({ success: true });
});

apiRouter.post('/simulator/clear-alert', (req, res) => {
  const { athleteId } = req.body;
  simulatorEngine.clearAlert(athleteId);
  res.json({ success: true });
});

apiRouter.get('/simulator/config', (_req, res) => {
  res.json(simulatorEngine.getConfig());
});

// Endpoint para Side Service de Zepp OS y apps de reloj
apiRouter.post('/telemetry/sample', (req, res) => {
  const { heartRate, steps, calories, timestamp, athleteId, sourceDevice } = req.body;
  if (athleteId) {
    const athlete = dataStore.athletes.get(athleteId);
    if (athlete) {
      if (athlete.lastSample) {
        if (heartRate) athlete.lastSample.heartRate = heartRate;
        if (steps) athlete.lastSample.steps = steps;
        if (calories) athlete.lastSample.calories = calories;
        athlete.lastSample.timestamp = timestamp || Date.now();
      }
      athlete.lastSeen = Date.now();
    }
  }
  res.json({ success: true, timestamp: Date.now() });
});
