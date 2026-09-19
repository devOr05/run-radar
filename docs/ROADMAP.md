# 🗺️ Roadmap de Evolución — RunRadar (RR)

## Fase 1: MVP Robusto (Completado) ✅
* Central de Monitoreo con Dashboard de Grupos y semáforo de estados (🟢 🟡 🔴 ⚪).
* Telemetría en vivo con FC, Zonas (Z1–Z5), Ritmo, Distancia, Tiempo y Fuente.
* Mapa interactivo en tiempo real con Leaflet y trazado de rutas.
* Motor de alertas configurables y no médicas.
* Experiencia minimalista del corredor en 3 pasos con permisos transparentes.
* Simulador multi-atleta de 10 a 100 corredores con control x1, x2, x5 y eventos de prueba.
* Exportación CSV de sesiones.
* Capa de adaptadores (`PhoneSensorAdapter`, `BluetoothHeartRateAdapter`, `HealthConnectAdapter`, `AppleHealthKitAdapter`).

## Fase 2: Aplicación Móvil Nativa para Corredores (Próximo) 📱
* Empaquetado Capacitor / React Native para iOS y Android con background location service optimizado.
* Sincronización offline en búfer local para zonas sin cobertura celular (sincroniza al reconectar).
* Soporte nativo para lectura continua de sensores en segundo plano minimizando el consumo de batería.

## Fase 3: Integraciones Directas Cloud con Fabricantes ☁️
* Garmin Connect API (Push de actividades y telemetría).
* Polar Open AccessLink API.
* Strava Webhooks para importación automática post-entrenamiento.
* Suunto API & Coros Training Hub.

## Fase 4: Escalabilidad a 10.000 Corredores Concurrentes 🚀
* Migración del broker de WebSockets a Redis Pub/Sub con clúster de servidores de telemetría.
* Almacenamiento en base de datos de series temporales (TimescaleDB / ClickHouse) para analítica masiva.
* Microservicio de geo-cercas y detección automática de desvío de circuitos.
