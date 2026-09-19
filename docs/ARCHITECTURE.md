# 🏛️ Arquitectura del Sistema — RunRadar (RR)

## 1. Diagrama de Flujo y Capas

```
┌─────────────────────────────────────────────────────────────┐
│                      CAPA CLIENTE                           │
│  ┌──────────────────────────────┐ ┌──────────────────────┐  │
│  │ Central Entrenador (Web/PWA) │ │ App Corredor (Móvil) │  │
│  │ • Dashboard Grupos           │ │ • Onboarding 3 pasos │  │
│  │ • Telemetría en Vivo         │ │ • Sensores Teléfono  │  │
│  │ • Mapa Leaflet               │ │ • BLE Banda Cardíaca │  │
│  │ • Motor de Alertas           │ │ • Control Permisos   │  │
│  └──────────────────────────────┘ └──────────────────────┘  │
└──────────────┬──────────────────────────────▲───────────────┘
               │ HTTP / REST                  │ WebSocket (Socket.io)
               ▼                              │
┌─────────────────────────────────────────────┴───────────────┐
│                      CAPA SERVIDOR                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Node.js + Express REST API                            │  │
│  │ • /api/groups, /api/athletes, /api/sessions           │  │
│  │ • /api/runners/join, /api/sessions/export-csv         │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Realtime Telemetry & WebSocket Gateway (Socket.io)    │  │
│  │ • Subscripción a salas de grupo (group:id)            │  │
│  │ • Broadcast de telemetría a 1Hz                       │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Motor de Alertas Fisiológicas (AlertEngine)          │  │
│  │ • Regla FC > 180 BPM (>60s)                           │  │
│  │ • Regla Permanencia Z5 (>8 min)                       │  │
│  │ • Regla Desconexión (>90s)                            │  │
│  │ • Regla Batería Baja (<10%)                           │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Simulador Multi-Atleta de Alta Densidad (10 a 100)    │  │
│  │ • Circuitos GPS realistas                             │  │
│  │ • Inyección de eventos y control x1, x2, x5           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 2. Principios de Diseño
* **Baja Latencia:** Telemetría push inmediata vía WebSockets sin polling en loop.
* **Tolerancia a Desconexiones:** Si un corredor pierde señal temporalmente, la interfaz indica `⚪ SIN DATOS` o `🟡 ATENCIÓN` con tiempo transcurrido ("hace 90 s") sin crashear.
* **Cero Fricción para el Corredor:** El corredor solo se une con un código/QR y sus datos fluyen automáticamente.
* **Priorización de Atención para el Entrenador:** La interfaz ordena y destaca automáticamente a quienes requieren atención primero.
