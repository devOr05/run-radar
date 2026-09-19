# 🏃 RunRadar (RR) — Central de Monitoreo de Running

> *"Todos tus corredores. Toda la información. En una sola pantalla."*

---

## 🌟 Visión del Producto

**RunRadar (RR)** es una plataforma en tiempo real diseñada exclusivamente para profesores, entrenadores de running y grupos de entrenamiento recreativo.

Elimina por completo la sobrecarga cognitiva del entrenador y la fricción del corredor:
* **Entrenador:** Visualiza a todo el grupo en segundos con un semáforo directo de estados (🟢 Normal, 🟡 Atención, 🔴 Alerta, ⚪ Sin Datos), alertas fisiológicas no médicas en tiempo real, mapa GPS interactivo y exportación de sesiones.
* **Corredor:** Experiencia de cero fricción (*Instalar → Registrarse → Ingresar código/QR → Otorgar permisos → Listo*). Funciona con cualquier teléfono o reloj deportivo.
* **Simulador Multi-Atleta & Modo Demo:** Simulación de 10 a 100 corredores con telemetría realista, alertas inyectables y control de velocidad (1x, 2x, 5x) para pruebas instantáneas.

---

## 🚀 Inicio Rápido

### 1. Requisitos Previos
* Node.js v18+ y npm

### 2. Instalación
```bash
# Clonar o entrar en el directorio del proyecto
cd run-radar

# Instalar dependencias
npm install
```

### 3. Ejecutar en Modo Desarrollo
Puedes correr el backend y frontend juntos o en terminales separadas:

```bash
# Terminal 1: Servidor Node.js + Socket.io + Simulador
npm run server

# Terminal 2: Frontend Vite + React
npm run dev
```

Abre tu navegador en [http://localhost:5173](http://localhost:5173).

---

## 📱 Dos Experiencias en la Misma Aplicación

### 1. Central del Entrenador (Coach View)
* **Dashboard de Grupos:** Resumen instantáneo de grupos (`Running Martes`, `Running Jueves`, `10K Competición`) con contadores de semáforo.
* **Telemetría en Vivo:** Tarjetas de atletas con FC (BPM), Zona Cardíaca (Z1–Z5), Ritmo (min/km), Distancia, Batería y Fuente de datos.
* **Mapa de Radar en Vivo:** Visualización cartográfica con marcadores coloreados según estado y estelas de trayectoria.
* **Motor de Alertas:** Detección en vivo de FC > 180 BPM (>60s), permanencia en Z5 (>8 min), pérdida de señal (>90s) y batería baja (<10%).
* **Exportación CSV:** Descarga directa de métricas de la sesión con un solo clic.

### 2. App del Corredor (Runner View)
* **Onboarding en 3 pasos:** Nombre → Código de Grupo (`RUN-4821`) o QR → Permisos y Sensores.
* **Pantalla de Entrenamiento:** Visualización limpia de sus propias métricas activas sin gráficos abrumadores.
* **Control de Privacidad:** Permisos granulares y revocables en cualquier momento.
* **Compatibilidad de Dispositivos:** Sensores de celular (GPS / pasos), Bluetooth HRM (Polar H10, Garmin HRM, Magene), Health Connect y HealthKit.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Lucide Icons |
| **Mapas** | Leaflet, React-Leaflet, CartoDB Dark Tiles |
| **Tiempo Real** | Socket.io, WebSockets bidireccionales de baja latencia |
| **Backend** | Node.js, Express, TypeScript, REST API |
| **Simulador** | Motor matemático fisiológico con rutas GPS circulares y eventos dinámicos |

---

## 📚 Documentación Técnica

Para acceder a la documentación completa de la arquitectura y especificaciones:
* [`docs/ARCHITECTURE.md`](file:///docs/ARCHITECTURE.md) — Arquitectura general y capas de datos.
* [`docs/DATA_MODEL.md`](file:///docs/DATA_MODEL.md) — Modelo normalizado `MetricSample` y esquemas de base de datos.
* [`docs/INTEGRATIONS.md`](file:///docs/INTEGRATIONS.md) — Capa de adaptadores de dispositivos (Device Adapter Layer).
* [`docs/PERMISSIONS.md`](file:///docs/PERMISSIONS.md) — Matriz de permisos progresivos en Android/iOS.
* [`docs/PRIVACY.md`](file:///docs/PRIVACY.md) — Principios éticos y de privacidad deportiva.
* [`docs/SECURITY.md`](file:///docs/SECURITY.md) — Aislamiento multi-tenant y seguridad.
* [`docs/API.md`](file:///docs/API.md) — Especificación de endpoints REST y eventos WebSocket.
* [`docs/ROADMAP.md`](file:///docs/ROADMAP.md) — Hoja de ruta de evolución a 10.000 atletas.
