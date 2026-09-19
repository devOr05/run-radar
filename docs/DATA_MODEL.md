# 📊 Modelo de Datos Normalizado — RunRadar (RR)

## 1. Muestra de Métrica Normalizada (`MetricSample`)

El sistema **no** almacena campos propietarios por fabricante (ej: `garminHeartRate`, `xiaomiPace`). Toda telemetría se normaliza en la estructura `MetricSample`:

```typescript
export interface MetricSample {
  athleteId: string;             // ID único del corredor
  source: MetricSource;          // 'phone' | 'smartband' | 'smartwatch' | 'chest_strap' | 'health_connect' | 'healthkit'
  sourceDevice: string;          // Descripción legible (ej: "📱 Samsung S23 + ⌚ Garmin 265")
  timestamp: number;             // Epoch en milisegundos
  heartRate?: number;            // Frecuencia cardíaca en BPM
  zone?: 1 | 2 | 3 | 4 | 5;       // Zona cardíaca (Z1: Recuperación, Z2: Aeróbico, Z3: Tempo, Z4: Umbral, Z5: Máximo)
  pace?: number;                 // Ritmo instantáneo en segundos por km (ej: 330 = 5:30/km)
  speed?: number;                // Velocidad en km/h
  distance?: number;             // Metros totales acumulados en la sesión
  cadence?: number;              // Pasos por minuto (SPM)
  latitude?: number;             // Coordenada GPS latitud
  longitude?: number;            // Coordenada GPS longitud
  altitude?: number;             // Altitud en metros
  calories?: number;             // Calorías estimadas
  steps?: number;                // Pasos acumulados
  battery?: number;              // Nivel de batería del dispositivo (0-100%)
  signalQuality?: 'excellent' | 'good' | 'poor' | 'lost';
}
```

## 2. Entidades Principales

* **Organization:** Entidad matriz (ej: `Club Running Central`). Aísla a entrenadores y atletas de otros clubes.
* **Coach:** Perfil del entrenador responsable de grupos y sesiones.
* **Group:** Grupo de entrenamiento con código corto de invitación (ej: `RUN-4821`), días de horario y ritmos objetivo.
* **Athlete:** Perfil del corredor, sus dispositivos vinculados, permisos otorgados y estado actual (🟢 Normal, 🟡 Atención, 🔴 Alerta, ⚪ Sin Datos).
* **TrainingSession:** Sesión grupal en vivo con objetivos de distancia, ritmo, duración y métricas agregadas.
* **AlertEvent:** Eventos fisiológicos o de desconexión detectados en tiempo real.
