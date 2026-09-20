import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Athlete, 
  Group, 
  Coach, 
  TrainingSession, 
  AlertEvent, 
  MetricSample, 
  SimulatorConfig,
  AthletePermissions
} from '../types';
import { supabaseService, isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { 
  initialCoach, 
  initialGroups, 
  initialAthletes, 
  initialActiveSession, 
  initialAlerts 
} from '../data/initialData';

interface RadarContextType {
  coach: Coach | null;
  groups: Group[];
  athletes: Athlete[];
  selectedGroupId: string | null;
  selectedAthleteId: string | null;
  activeSession: TrainingSession | null;
  alerts: AlertEvent[];
  simulatorConfig: SimulatorConfig;
  userRole: 'coach' | 'runner' | null;
  currentRunner: Athlete | null;
  isConnected: boolean;
  
  // Actions
  setSelectedGroupId: (id: string | null) => void;
  setSelectedAthleteId: (id: string | null) => void;
  setUserRole: (role: 'coach' | 'runner' | null) => void;
  setCurrentRunnerId: (id: string | null) => void;
  startSession: (data: { name: string; groupId: string; targetDistanceKm: number; targetDurationMinutes: number }) => Promise<void>;
  pauseSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  toggleSimulator: () => Promise<void>;
  setSimulatorSpeed: (speed: 1 | 2 | 5) => Promise<void>;
  resetSimulator: () => Promise<void>;
  injectAlert: (athleteId: string, alertType: 'high_hr' | 'z5' | 'low_battery' | 'disconnect') => Promise<void>;
  clearAlert: (athleteId: string) => Promise<void>;
  joinRunner: (data: { name: string; lastName?: string; email?: string; phone?: string; inviteCode?: string; permissions: AthletePermissions }) => Promise<{ success: boolean; athlete?: Athlete; error?: string }>;
  createGroup: (data: { name: string; schedule?: string; description?: string; inviteCode?: string; targetDistance?: number; targetPaceRange?: [number, number] }) => Promise<Group>;
  emitRunnerSample: (sample: Partial<MetricSample>) => void;
  updateRunnerPermissions: (athleteId: string, permissions: Partial<AthletePermissions>) => Promise<void>;
  updateRunnerProfile: (data: { name: string; lastName?: string; email?: string; phone?: string }) => Promise<void>;
  joinGroup: (codeOrUrl: string) => Promise<{ success: boolean; group?: Group; error?: string }>;
  leaveGroup: () => Promise<void>;
  exportCSV: (sessionId?: string) => void;
}

const RadarContext = createContext<RadarContextType | undefined>(undefined);

export const RadarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [coach, setCoach] = useState<Coach | null>(initialCoach);
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [athletes, setAthletes] = useState<Athlete[]>(() => {
    try {
      const savedCustom = localStorage.getItem('runradar_custom_athletes');
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom) as Athlete[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mockWithoutCustom = initialAthletes.filter(a => !parsed.some(p => p.id === a.id));
          return [...parsed, ...mockWithoutCustom];
        }
      }
    } catch (e) {}
    return initialAthletes;
  });
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>('group-martes');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(initialActiveSession);
  const [alerts, setAlerts] = useState<AlertEvent[]>(initialAlerts);
  const [simulatorConfig, setSimulatorConfig] = useState<SimulatorConfig>({
    athleteCount: 25,
    playbackSpeed: 1,
    isRunning: false,
    noiseLevel: 'realistic',
    injectSpontaneousAlerts: false
  });
  const [userRole, setUserRole] = useState<'coach' | 'runner' | null>(null);
  const [currentRunnerId, setCurrentRunnerId] = useState<string | null>(null);

  // 1. Detección de invitaciones por WhatsApp/QR (?join=...) y Auto-Login persistente del celular
  useEffect(() => {
    // Solicitar persistencia al sistema operativo móvil para evitar que borre datos
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }

    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    const athleteParam = urlParams.get('atleta') || urlParams.get('athlete');

    // Caso A: El corredor viene desde un link de WhatsApp o escaneó el QR
    if (joinCode) {
      setUserRole('runner');
      if (athleteParam) {
        setCurrentRunnerId(athleteParam);
      }
      localStorage.setItem('runradar_session', JSON.stringify({
        role: 'runner',
        groupCode: joinCode,
        athleteId: athleteParam || null
      }));
      return;
    }

    // Caso B: El dueño del teléfono ya usó la app instalada -> Auto-login instantáneo
    try {
      const saved = localStorage.getItem('runradar_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role) {
          setUserRole(parsed.role);
          // Si tenía 'athlete-1' guardado por el bug anterior pero sin URL param, no infectar con el mock
          if (parsed.athleteId && parsed.athleteId !== 'athlete-1') {
            setCurrentRunnerId(parsed.athleteId);
          } else if (parsed.athleteId === 'athlete-1' && !athleteParam) {
            setCurrentRunnerId(null);
          }
          if (parsed.groupId) setSelectedGroupId(parsed.groupId);
        }
      }
    } catch (e) {
      console.warn('Error al restaurar sesión previa del dispositivo', e);
    }
  }, []);

  const handleSetUserRole = (role: 'coach' | 'runner' | null) => {
    setUserRole(role);
    if (role) {
      try {
        const currentSaved = localStorage.getItem('runradar_session');
        const parsed = currentSaved ? JSON.parse(currentSaved) : {};
        localStorage.setItem('runradar_session', JSON.stringify({
          ...parsed,
          role,
          athleteId: role === 'runner' ? currentRunnerId : undefined
        }));
      } catch (e) {}
    } else {
      localStorage.removeItem('runradar_session');
      setSelectedGroupId(null);
      setSelectedAthleteId(null);
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  };

  const handleSetCurrentRunnerId = (id: string | null) => {
    setCurrentRunnerId(id);
    if (id) {
      try {
        const currentSaved = localStorage.getItem('runradar_session');
        const parsed = currentSaved ? JSON.parse(currentSaved) : { role: 'runner' };
        localStorage.setItem('runradar_session', JSON.stringify({
          ...parsed,
          athleteId: id
        }));
      } catch (e) {}
    }
  };

  // Conectar con servidor Socket.io
  useEffect(() => {
    const s = io(window.location.origin, {
      reconnectionAttempts: 5,
      timeout: 5000,
    });

    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('initial-state', (data) => {
      if (data.coach) setCoach(data.coach);
      if (data.groups) setGroups(data.groups);
      if (data.athletes) setAthletes(data.athletes);
      if (data.activeSession !== undefined) setActiveSession(data.activeSession);
      if (data.alerts) setAlerts(data.alerts);
      if (data.simulatorConfig) setSimulatorConfig(data.simulatorConfig);
    });

    s.on('telemetry-sample', (sample: MetricSample) => {
      setAthletes((prevAthletes) => {
        return prevAthletes.map((ath) => {
          if (ath.id !== sample.athleteId) return ath;

          const updatedTrail = ath.trail ? [...ath.trail] : [];
          if (sample.latitude && sample.longitude) {
            updatedTrail.push([sample.latitude, sample.longitude]);
            if (updatedTrail.length > 20) updatedTrail.shift();
          }

          return {
            ...ath,
            lastSample: sample,
            lastSeen: sample.timestamp,
            trail: updatedTrail
          };
        });
      });
    });

    s.on('alerts-update', (newAlerts: AlertEvent[]) => {
      setAlerts(newAlerts);
    });

    setSocket(s);

    // Fallback inicial por API REST en caso de carga previa
    fetch('/api/coach/me').then(r => r.ok ? r.json() : null).then(c => c && setCoach(c)).catch(() => {});
    fetch('/api/groups').then(r => r.ok ? r.json() : null).then(g => g && setGroups(g)).catch(() => {});
    fetch('/api/athletes').then(r => r.ok ? r.json() : null).then(a => a && setAthletes(a)).catch(() => {});
    fetch('/api/sessions/active').then(r => r.ok ? r.json() : null).then(s => s && setActiveSession(s)).catch(() => {});
    fetch('/api/alerts').then(r => r.ok ? r.json() : null).then(al => al && setAlerts(al)).catch(() => {});

    return () => {
      s.disconnect();
    };
  }, []);

  // Suscribirse a Supabase Realtime si está configurado en la nube
  useEffect(() => {
    if (!isSupabaseConfigured || !selectedGroupId) return;

    const channel = supabaseService.subscribeToGroupTelemetry(selectedGroupId, (sample) => {
      setAthletes((prevAthletes) => {
        return prevAthletes.map((ath) => {
          if (ath.id !== sample.athleteId) return ath;
          const updatedTrail = ath.trail ? [...ath.trail] : [];
          if (sample.latitude && sample.longitude) {
            updatedTrail.push([sample.latitude, sample.longitude]);
            if (updatedTrail.length > 50) updatedTrail.shift();
          }
          return {
            ...ath,
            lastSample: sample,
            lastSeen: Date.now(),
            trail: updatedTrail,
          };
        });
      });
    });

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [selectedGroupId]);

  const currentRunner = currentRunnerId 
    ? (athletes.find(a => a.id === currentRunnerId) || null) 
    : null;

  const startSession = async (data: { name: string; groupId: string; targetDistanceKm: number; targetDurationMinutes: number }) => {
    const newSession: TrainingSession = {
      id: `session-${Date.now()}`,
      groupId: data.groupId || 'group-martes',
      coachId: coach?.id || 'coach-juan',
      name: data.name || 'Entrenamiento Grupal',
      startTime: Date.now(),
      status: 'active',
      targetDistanceKm: Number(data.targetDistanceKm) || 8,
      targetDurationMinutes: Number(data.targetDurationMinutes) || 60,
      targetZones: [2, 3, 4],
      stats: {
        avgHeartRate: 152,
        totalDistanceKm: 0,
        activeAthletes: athletes.length,
        alertsCount: alerts.length,
        durationSeconds: 0
      }
    };
    setActiveSession(newSession);
    setSimulatorConfig(prev => ({ ...prev, isRunning: true }));

    try {
      fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {});
    } catch (e) {}
  };

  const pauseSession = async () => {
    setActiveSession(prev => prev ? { ...prev, status: prev.status === 'active' ? 'paused' : 'active' } : null);
    setSimulatorConfig(prev => ({ ...prev, isRunning: !prev.isRunning }));
    try {
      fetch('/api/sessions/pause', { method: 'POST' }).catch(() => {});
    } catch (e) {}
  };

  const stopSession = async () => {
    setActiveSession(null);
    setSimulatorConfig(prev => ({ ...prev, isRunning: false }));
    try {
      fetch('/api/sessions/stop', { method: 'POST' }).catch(() => {});
    } catch (e) {}
  };

  const acknowledgeAlert = async (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    try {
      fetch(`/api/alerts/${alertId}/ack`, { method: 'POST' }).catch(() => {});
    } catch (e) {}
  };

  const toggleSimulator = async () => {
    setSimulatorConfig(prev => ({ ...prev, isRunning: !prev.isRunning }));
    try {
      const endpoint = simulatorConfig.isRunning ? '/api/simulator/pause' : '/api/simulator/start';
      fetch(endpoint, { method: 'POST' }).catch(() => {});
    } catch (e) {}
  };

  const setSimulatorSpeed = async (speed: 1 | 2 | 5) => {
    setSimulatorConfig(prev => ({ ...prev, playbackSpeed: speed }));
    try {
      fetch('/api/simulator/speed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed })
      }).catch(() => {});
    } catch (e) {}
  };

  const resetSimulator = async () => {
    setAthletes(initialAthletes);
    setAlerts(initialAlerts);
    try {
      fetch('/api/simulator/reset', { method: 'POST' }).catch(() => {});
    } catch (e) {}
  };

  const injectAlert = async (athleteId: string, alertType: 'high_hr' | 'z5' | 'low_battery' | 'disconnect') => {
    const athlete = athletes.find(a => a.id === athleteId);
    const newAlert: AlertEvent = {
      id: `alert-${Date.now()}`,
      athleteId,
      athleteName: athlete ? `${athlete.name} ${athlete.lastName}` : 'Atleta',
      groupId: selectedGroupId || 'group-martes',
      ruleType: alertType === 'high_hr' ? 'heart_rate_max' : 'low_battery',
      severity: alertType === 'high_hr' ? 'alert' : 'attention',
      title: alertType === 'high_hr' ? 'FC elevada' : 'Batería baja',
      message: alertType === 'high_hr' ? 'FC superior a 180 BPM' : 'Nivel de batería crítico',
      timestamp: Date.now(),
      acknowledged: false,
      valueRecorded: alertType === 'high_hr' ? '184 BPM' : '9%'
    };
    setAlerts(prev => [newAlert, ...prev]);
    try {
      fetch('/api/simulator/inject-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, type: alertType })
      }).catch(() => {});
    } catch (e) {}
  };

  const clearAlert = async (athleteId: string) => {
    setAlerts(prev => prev.filter(a => a.athleteId !== athleteId));
    try {
      fetch('/api/simulator/clear-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId })
      }).catch(() => {});
    } catch (e) {}
  };

  const normalizeStr = (s: string) => 
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const findMatchingGroup = (query: string, groupsList: Group[]): Group | null => {
    if (!query) return null;
    const clean = query.trim();
    const upper = clean.toUpperCase();
    const norm = normalizeStr(clean);

    // 1. Coincidencia exacta por inviteCode
    const byCode = groupsList.find(g => g.inviteCode?.toUpperCase() === upper);
    if (byCode) return byCode;

    // 2. Coincidencia exacta por ID
    const byId = groupsList.find(g => g.id.toUpperCase() === upper);
    if (byId) return byId;

    // 3. Coincidencia por nombre exacto (sin tildes / minúsculas)
    const byExactName = groupsList.find(g => normalizeStr(g.name) === norm);
    if (byExactName) return byExactName;

    // 4. Coincidencia por subcadena de nombre si la búsqueda tiene al menos 3 caracteres
    if (norm.length >= 3) {
      const byPartial = groupsList.find(g => 
        normalizeStr(g.name).includes(norm) || norm.includes(normalizeStr(g.name))
      );
      if (byPartial) return byPartial;
    }

    return null;
  };

  const joinRunner = async (data: { name: string; lastName?: string; email?: string; phone?: string; inviteCode?: string; permissions: AthletePermissions }) => {
    const matchedGroup = data.inviteCode 
      ? findMatchingGroup(data.inviteCode, groups)
      : null;
    const newId = `athlete-${Date.now()}`;
    const newAthlete: Athlete = {
      id: newId,
      name: data.name?.trim() || 'Corredor',
      lastName: data.lastName?.trim() || '',
      email: data.email?.trim() || `${newId}@runradar.app`,
      phone: data.phone?.trim() || undefined,
      groupIds: matchedGroup ? [matchedGroup.id] : [],
      maxHeartRate: 185,
      restingHeartRate: 60,
      targetPaceMin: matchedGroup?.targetPaceRange?.[0] || 330,
      targetPaceMax: matchedGroup?.targetPaceRange?.[1] || 375,
      currentStatus: 'normal',
      lastSeen: Date.now(),
      devices: [
        {
          id: `dev-${newId}-phone`,
          type: 'phone',
          name: '📱 Celular Principal',
          status: 'connected',
          isPrimaryGPS: true,
          batteryLevel: 98
        }
      ],
      permissions: data.permissions || {
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

    // Intentar backend si existe
    try {
      fetch('/api/runners/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {});
    } catch (e) {}

    // Guardar en Supabase si está disponible
    if (isSupabaseConfigured && supabase) {
      supabase.from('athletes').upsert({
        id: newAthlete.id,
        name: newAthlete.name,
        last_name: newAthlete.lastName,
        email: newAthlete.email,
        phone: newAthlete.phone,
        group_ids: newAthlete.groupIds,
        max_heart_rate: newAthlete.maxHeartRate,
        resting_heart_rate: newAthlete.restingHeartRate,
        permissions: newAthlete.permissions
      }).then(() => {}, (err: any) => console.warn('Supabase athlete insert err', err));
    }

    setAthletes(prev => {
      const next = [...prev.filter(a => a.id !== newAthlete.id), newAthlete];
      try {
        const customAthletes = next.filter(a => a.id.startsWith('athlete-') || a.id === newAthlete.id);
        localStorage.setItem('runradar_custom_athletes', JSON.stringify(customAthletes));
      } catch (e) {}
      return next;
    });

    setCurrentRunnerId(newAthlete.id);
    if (matchedGroup) {
      setSelectedGroupId(matchedGroup.id);
    } else {
      setSelectedGroupId(null);
    }

    try {
      localStorage.setItem('runradar_session', JSON.stringify({
        role: 'runner',
        athleteId: newAthlete.id,
        athleteName: `${newAthlete.name} ${newAthlete.lastName}`.trim(),
        groupId: matchedGroup ? matchedGroup.id : null,
        groupCode: matchedGroup ? matchedGroup.inviteCode : null
      }));
    } catch (e) {}

    return { success: true, athlete: newAthlete };
  };

  const parseJoinCode = (raw: string): string => {
    try {
      if (raw.includes('join=')) {
        const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
        const code = url.searchParams.get('join');
        if (code) return code.trim().toUpperCase();
      }
    } catch (e) {}
    return raw.trim().toUpperCase();
  };

  const joinGroup = async (codeOrNameOrUrl: string) => {
    const code = parseJoinCode(codeOrNameOrUrl);
    const targetGroup = findMatchingGroup(code, groups) || findMatchingGroup(codeOrNameOrUrl, groups);
    if (!targetGroup) {
      return { success: false, error: `Grupo no encontrado ("${codeOrNameOrUrl}"). Puedes ingresar el código o el nombre de tu grupo.` };
    }

    if (currentRunnerId) {
      setAthletes(prev => prev.map(ath => {
        if (ath.id !== currentRunnerId) return ath;
        const updated = {
          ...ath,
          groupIds: [targetGroup.id]
        };
        if (isSupabaseConfigured && supabase) {
          supabase.from('athletes').upsert({
            id: updated.id,
            group_ids: updated.groupIds
          }).then(() => {}, (e) => console.warn(e));
        }
        return updated;
      }));
    }

    setSelectedGroupId(targetGroup.id);

    try {
      const saved = localStorage.getItem('runradar_session');
      const parsed = saved ? JSON.parse(saved) : {};
      localStorage.setItem('runradar_session', JSON.stringify({
        ...parsed,
        groupId: targetGroup.id,
        groupCode: targetGroup.inviteCode
      }));
    } catch (e) {}

    return { success: true, group: targetGroup };
  };

  const leaveGroup = async () => {
    if (currentRunnerId) {
      setAthletes(prev => prev.map(ath => {
        if (ath.id !== currentRunnerId) return ath;
        const updated = {
          ...ath,
          groupIds: []
        };
        if (isSupabaseConfigured && supabase) {
          supabase.from('athletes').upsert({
            id: updated.id,
            group_ids: []
          }).then(() => {}, (e) => console.warn(e));
        }
        return updated;
      }));
    }
    setSelectedGroupId(null);
    try {
      const saved = localStorage.getItem('runradar_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        delete parsed.groupId;
        delete parsed.groupCode;
        localStorage.setItem('runradar_session', JSON.stringify(parsed));
      }
    } catch (e) {}
  };

  const createGroup = async (data: {
    name: string;
    schedule?: string;
    description?: string;
    inviteCode?: string;
    targetDistance?: number;
    targetPaceRange?: [number, number];
  }): Promise<Group> => {
    const newId = `group-${Date.now()}`;
    const code = data.inviteCode || `RUN-${Math.floor(1000 + Math.random() * 9000)}`;

    const newGroup: Group = {
      id: newId,
      organizationId: 'org-central',
      coachId: coach?.id || 'coach-juan',
      name: data.name,
      description: data.description || '',
      schedule: data.schedule || 'Días a convenir',
      inviteCode: code,
      targetDistance: data.targetDistance || 8,
      targetPaceRange: data.targetPaceRange || [330, 390],
      athleteCount: 0,
      activeAthletesCount: 0,
      statusSummary: { normal: 0, attention: 0, alert: 0, offline: 0 }
    };

    setGroups(prev => [newGroup, ...prev]);
    setSelectedGroupId(newId);

    if (isSupabaseConfigured && supabase) {
      supabase.from('groups').upsert({
        id: newGroup.id,
        coach_id: newGroup.coachId,
        name: newGroup.name,
        description: newGroup.description,
        schedule: newGroup.schedule,
        invite_code: newGroup.inviteCode,
        target_distance: newGroup.targetDistance,
        target_pace_range: newGroup.targetPaceRange
      }).then(() => {}, (err: any) => console.warn('Supabase group upsert err', err));
    }

    return newGroup;
  };

  const emitRunnerSample = (partialSample: Partial<MetricSample>) => {
    if (!currentRunnerId) return;

    setAthletes((prevAthletes) => {
      return prevAthletes.map((ath) => {
        if (ath.id !== currentRunnerId) return ath;

        const prev = ath.lastSample;
        const lat = partialSample.latitude ?? prev?.latitude;
        const lng = partialSample.longitude ?? prev?.longitude;
        const hr = partialSample.heartRate !== undefined ? partialSample.heartRate : prev?.heartRate;
        const pace = partialSample.pace !== undefined ? partialSample.pace : prev?.pace;
        const speed = partialSample.speed !== undefined ? partialSample.speed : (prev?.speed ?? 0);
        const distance = partialSample.distance !== undefined ? partialSample.distance : (prev?.distance ?? 0);
        const battery = partialSample.battery !== undefined ? partialSample.battery : prev?.battery;

        const updatedTrail = ath.trail ? [...ath.trail] : [];
        if (lat && lng) {
          updatedTrail.push([lat, lng]);
          if (updatedTrail.length > 50) updatedTrail.shift();
        }

        const fullSample: MetricSample = {
          athleteId: ath.id,
          timestamp: Date.now(),
          heartRate: hr,
          zone: hr ? ((hr > 175 ? 5 : (hr > 155 ? 4 : (hr > 135 ? 3 : 2))) as any) : undefined,
          pace: pace,
          speed: speed,
          cadence: partialSample.cadence !== undefined ? partialSample.cadence : prev?.cadence,
          distance: distance,
          latitude: lat,
          longitude: lng,
          altitude: partialSample.altitude !== undefined ? partialSample.altitude : prev?.altitude,
          battery: battery,
          signalQuality: (partialSample.signalQuality || prev?.signalQuality || 'excellent') as any,
          source: partialSample.source ?? prev?.source ?? 'phone',
          sourceDevice: partialSample.sourceDevice ?? prev?.sourceDevice ?? '📱 GPS Celular'
        };

        if (isSupabaseConfigured && selectedGroupId) {
          supabaseService.broadcastSample(selectedGroupId, fullSample);
        }

        return {
          ...ath,
          lastSample: fullSample,
          lastSeen: Date.now(),
          trail: updatedTrail
        };
      });
    });
  };

  const updateRunnerPermissions = async (athleteId: string, permissions: Partial<AthletePermissions>) => {
    setAthletes(prev => prev.map(a => a.id === athleteId ? {
      ...a,
      permissions: { ...a.permissions, ...permissions, updatedAt: Date.now() }
    } : a));
    try {
      fetch(`/api/runners/${athleteId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissions)
      }).catch(() => {});
    } catch (e) {}
  };

  const updateRunnerProfile = async (data: { name: string; lastName?: string; email?: string; phone?: string }) => {
    let runnerId = currentRunnerId;
    if (!runnerId) {
      runnerId = `athlete-${Date.now()}`;
      setCurrentRunnerId(runnerId);
    }

    setAthletes((prev) => {
      const existing = prev.find((a) => a.id === runnerId);
      const updated: Athlete = existing
        ? {
            ...existing,
            name: data.name.trim(),
            lastName: data.lastName !== undefined ? data.lastName.trim() : existing.lastName,
            email: data.email !== undefined ? data.email.trim() : existing.email,
            phone: data.phone !== undefined ? data.phone.trim() : existing.phone
          }
        : {
            id: runnerId!,
            name: data.name.trim(),
            lastName: (data.lastName || '').trim(),
            email: (data.email || '').trim(),
            phone: (data.phone || '').trim(),
            groupIds: selectedGroupId ? [selectedGroupId] : [],
            maxHeartRate: 185,
            restingHeartRate: 60,
            currentStatus: 'normal',
            lastSeen: Date.now(),
            devices: [],
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

      const next = [...prev.filter((a) => a.id !== runnerId), updated];

      try {
        const customAthletes = next.filter((a) => a.id === runnerId || a.id.startsWith('athlete-'));
        localStorage.setItem('runradar_custom_athletes', JSON.stringify(customAthletes));
      } catch (e) {}

      return next;
    });

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('athletes')
        .upsert({
          id: runnerId,
          name: data.name.trim(),
          last_name: data.lastName?.trim() || '',
          email: data.email?.trim() || '',
          phone: data.phone?.trim() || ''
        })
        .then(() => {}, (err) => console.warn('Supabase athlete profile update err', err));
    }

    try {
      const saved = localStorage.getItem('runradar_session');
      const parsed = saved ? JSON.parse(saved) : {};
      localStorage.setItem('runradar_session', JSON.stringify({
        ...parsed,
        role: 'runner',
        athleteId: runnerId,
        athleteName: `${data.name.trim()} ${data.lastName?.trim() || ''}`.trim()
      }));
    } catch (e) {}
  };

  const exportCSV = (sessionId?: string) => {
    const id = sessionId || activeSession?.id || 'current';
    window.open(`/api/sessions/${id}/export-csv`, '_blank');
  };

  return (
    <RadarContext.Provider
      value={{
        coach,
        groups,
        athletes,
        selectedGroupId,
        selectedAthleteId,
        activeSession,
        alerts,
        simulatorConfig,
        userRole,
        currentRunner,
        isConnected,
        setSelectedGroupId,
        setSelectedAthleteId,
        setUserRole: handleSetUserRole,
        setCurrentRunnerId: handleSetCurrentRunnerId,
        startSession,
        pauseSession,
        stopSession,
        acknowledgeAlert,
        toggleSimulator,
        setSimulatorSpeed,
        resetSimulator,
        injectAlert,
        clearAlert,
        joinRunner,
        createGroup,
        emitRunnerSample,
        updateRunnerPermissions,
        updateRunnerProfile,
        joinGroup,
        leaveGroup,
        exportCSV,
      }}
    >
      {children}
    </RadarContext.Provider>
  );
};

export const useRadar = () => {
  const context = useContext(RadarContext);
  if (!context) {
    throw new Error('useRadar debe utilizarse dentro de un RadarProvider');
  }
  return context;
};
