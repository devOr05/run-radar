import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { apiRouter } from './routes/api';
import { simulatorEngine } from './services/simulator';
import { dataStore } from './services/dataStore';
import { MetricSample } from './types';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Montar API REST
app.use('/api', apiRouter);

// Servidor HTTP + WebSockets
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Cliente conectado: ${socket.id}`);

  // Enviar estado inicial
  socket.emit('initial-state', {
    coach: dataStore.coach,
    groups: Array.from(dataStore.groups.values()),
    athletes: Array.from(dataStore.athletes.values()),
    activeSession: dataStore.activeSessionId ? dataStore.sessions.get(dataStore.activeSessionId) : null,
    alerts: dataStore.alerts,
    simulatorConfig: simulatorEngine.getConfig()
  });

  // Evento cuando un corredor real envía telemetría
  socket.on('runner-telemetry', (sample: MetricSample) => {
    const athlete = dataStore.athletes.get(sample.athleteId);
    if (athlete) {
      athlete.lastSample = sample;
      athlete.lastSeen = Date.now();
      // Re-emitir a todos los dashboards de entrenadores
      io.emit('telemetry-sample', sample);
    }
  });

  // Subscripción de grupo
  socket.on('join-group-room', (groupId: string) => {
    socket.join(`group:${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Cliente desconectado: ${socket.id}`);
  });
});

// Conectar callback del simulador para emitir eventos por WebSocket a todos los clientes
simulatorEngine.setTelemetryCallback((sample: MetricSample) => {
  io.emit('telemetry-sample', sample);
  
  // Si se generó una alerta nueva recientemente, sincronizar alertas
  if (dataStore.alerts.length > 0 && Date.now() - dataStore.alerts[0].timestamp < 2000) {
    io.emit('alerts-update', dataStore.alerts);
  }
});

// Iniciar simulador por defecto en modo demostración
simulatorEngine.start();

server.listen(port, () => {
  console.log(`🚀 [RunRadar Server] Corriendo en http://localhost:${port}`);
  console.log(`📡 [Socket.io] Servidor WebSocket activo`);
});
