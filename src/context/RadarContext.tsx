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
  joinRunner: (data: { name: string; lastName: string; email: string; inviteCode: string; permissions: AthletePermissions }) => Promise<{ success: boolean; athlete?: Athlete; error?: string }>;
  updateRunnerPermissions: (athleteId: string, permissions: Partial<AthletePermissions>) => Promise<void>;
  exportCSV: (sessionId?: string) => void;
}

const RadarContext = createContext<RadarContextType | undefined>(undefined);

export const RadarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<TrainingSession | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [simulatorConfig, setSimulatorConfig] = useState<SimulatorConfig>({
    athleteCount: 50,
    playbackSpeed: 1,
    isRunning: true,
    noiseLevel: 'realistic',
    injectSpontaneousAlerts: true
  });
  const [userRole, setUserRole] = useState<'coach' | 'runner' | null>(null);
  const [currentRunnerId, setCurrentRunnerId] = useState<string | null>('athlete-1');

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
        athleteId: athleteParam || 'athlete-1'
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
          if (parsed.athleteId) setCurrentRunnerId(parsed.athleteId);
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

  const currentRunner = athletes.find(a => a.id === currentRunnerId) || athletes[0] || null;

  const startSession = async (data: { name: string; groupId: string; targetDistanceKm: number; targetDurationMinutes: number }) => {
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const session = await res.json();
        setActiveSession(session);
        setSimulatorConfig(prev => ({ ...prev, isRunning: true }));
      }
    } catch (e) {
      console.error('Error starting session', e);
    }
  };

  const pauseSession = async () => {
    try {
      const res = await fetch('/api/sessions/pause', { method: 'POST' });
      if (res.ok) {
        const session = await res.json();
        setActiveSession(session);
        setSimulatorConfig(prev => ({ ...prev, isRunning: session.status === 'active' }));
      }
    } catch (e) {
      console.error('Error pausing session', e);
    }
  };

  const stopSession = async () => {
    try {
      const res = await fetch('/api/sessions/stop', { method: 'POST' });
      if (res.ok) {
        setActiveSession(null);
        setSimulatorConfig(prev => ({ ...prev, isRunning: false }));
      }
    } catch (e) {
      console.error('Error stopping session', e);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/ack`, { method: 'POST' });
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    } catch (e) {
      console.error('Error acknowledging alert', e);
    }
  };

  const toggleSimulator = async () => {
    const endpoint = simulatorConfig.isRunning ? '/api/simulator/pause' : '/api/simulator/start';
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        const cfg = await res.json();
        setSimulatorConfig(cfg);
      }
    } catch (e) {
      console.error('Error toggling simulator', e);
    }
  };

  const setSimulatorSpeed = async (speed: 1 | 2 | 5) => {
    try {
      const res = await fetch('/api/simulator/speed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed })
      });
      if (res.ok) {
        const cfg = await res.json();
        setSimulatorConfig(cfg);
      }
    } catch (e) {
      console.error('Error setting simulator speed', e);
    }
  };

  const resetSimulator = async () => {
    try {
      const res = await fetch('/api/simulator/reset', { method: 'POST' });
      if (res.ok) {
        const cfg = await res.json();
        setSimulatorConfig(cfg);
      }
    } catch (e) {
      console.error('Error resetting simulator', e);
    }
  };

  const injectAlert = async (athleteId: string, alertType: 'high_hr' | 'z5' | 'low_battery' | 'disconnect') => {
    try {
      await fetch('/api/simulator/inject-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, type: alertType })
      });
    } catch (e) {
      console.error('Error injecting alert', e);
    }
  };

  const clearAlert = async (athleteId: string) => {
    try {
      await fetch('/api/simulator/clear-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId })
      });
    } catch (e) {
      console.error('Error clearing alert', e);
    }
  };

  const joinRunner = async (data: { name: string; lastName: string; email: string; inviteCode: string; permissions: AthletePermissions }) => {
    try {
      const res = await fetch('/api/runners/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setAthletes(prev => [...prev, result.athlete]);
        setCurrentRunnerId(result.athlete.id);
        return { success: true, athlete: result.athlete };
      }
      return { success: false, error: result.error || 'Error al unirse al grupo' };
    } catch (e) {
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };

  const updateRunnerPermissions = async (athleteId: string, permissions: Partial<AthletePermissions>) => {
    try {
      const res = await fetch(`/api/runners/${athleteId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissions)
      });
      if (res.ok) {
        const result = await res.json();
        setAthletes(prev => prev.map(a => a.id === athleteId ? { ...a, permissions: result.permissions } : a));
      }
    } catch (e) {
      console.error('Error updating permissions', e);
    }
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
        updateRunnerPermissions,
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
