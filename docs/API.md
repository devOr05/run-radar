# 🌐 Especificación de la API REST y WebSockets — RunRadar (RR)

## 1. Endpoints REST

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Estado del servidor |
| `GET` | `/api/coach/me` | Información del entrenador actual |
| `GET` | `/api/groups` | Listado de grupos del entrenador |
| `GET` | `/api/groups/:id` | Detalle del grupo y sus atletas |
| `GET` | `/api/athletes` | Listado de atletas (filtro opcional por `groupId`) |
| `GET` | `/api/athletes/:id` | Perfil detallado del atleta |
| `GET` | `/api/athletes/:id/history` | Historial de evolución (`7d`, `30d`, `90d`) |
| `POST` | `/api/runners/join` | Registro y unión de un nuevo corredor por código/QR |
| `PUT` | `/api/runners/:id/permissions` | Actualización de permisos del corredor |
| `GET` | `/api/sessions/active` | Sesión de entrenamiento activa actual |
| `POST` | `/api/sessions/start` | Iniciar nueva sesión de entrenamiento |
| `POST` | `/api/sessions/pause` | Pausar / reanudar sesión |
| `POST` | `/api/sessions/stop` | Finalizar sesión |
| `GET` | `/api/sessions/:id/export-csv` | Descarga de reporte completo en formato CSV |
| `GET` | `/api/alerts` | Listado de alertas históricas y activas |
| `POST` | `/api/alerts/:id/ack` | Marcar alerta como leída/atendida |
| `POST` | `/api/simulator/start` | Iniciar simulador de telemetría |
| `POST` | `/api/simulator/pause` | Pausar simulador |
| `POST` | `/api/simulator/speed` | Ajustar velocidad del simulador (`1`, `2`, `5`) |
| `POST` | `/api/simulator/inject-alert` | Forzar evento de prueba en un corredor |

## 2. Eventos WebSocket (Socket.io)

* **`initial-state`:** Emitido al conectarse un cliente con la carga inicial completa.
* **`telemetry-sample`:** Broadcast de cada muestra normalizada (`MetricSample`) a 1Hz.
* **`alerts-update`:** Broadcast cuando surge una nueva alerta o cambia el estado de atención.
* **`runner-telemetry`:** Recibe telemetría emitida desde el teléfono/reloj de un corredor real.
