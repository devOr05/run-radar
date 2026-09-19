import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Athlete } from '../../types';
import { formatPace, formatDistance, getStatusDetails, getZoneDetails, calculateHeartRateZone } from '../../lib/calculations';
import { Heart, Gauge, MapPin, Radio, Compass, Flag, Navigation } from 'lucide-react';

interface LiveMapViewProps {
  athletes: Athlete[];
  onSelectAthlete: (athleteId: string) => void;
  enableTrackbackToggle?: boolean;
}

// Generador de Iconos SVG personalizados para Leaflet según estado
function createStatusMarkerIcon(status: Athlete['currentStatus'], initials: string) {
  let color = '#10B981'; // green
  let glow = 'rgba(16, 185, 129, 0.4)';
  if (status === 'alert') {
    color = '#EF4444'; // red
    glow = 'rgba(239, 68, 68, 0.6)';
  } else if (status === 'attention') {
    color = '#F59E0B'; // yellow/amber
    glow = 'rgba(245, 158, 11, 0.5)';
  } else if (status === 'offline') {
    color = '#64748B'; // gray
    glow = 'transparent';
  }

  const svgHtml = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #0B0F19;
        border: 2.5px solid ${color};
        box-shadow: 0 0 12px ${glow};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 800;
        font-size: 11px;
        font-family: sans-serif;
      ">
        ${initials}
      </div>
      <div style="
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid #0B0F19;
      "></div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-runner-pin',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
}

// Icono del Punto de Salida para volver sobre sus pasos
function createStartPointMarkerIcon() {
  const svgHtml = `
    <div style="
      background: #10B981;
      color: black;
      font-weight: 900;
      font-size: 10px;
      padding: 3px 7px;
      border-radius: 8px;
      border: 2px solid white;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
      display: flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
      font-family: sans-serif;
    ">
      🏁 SALIDA
    </div>
  `;
  return L.divIcon({
    html: svgHtml,
    className: 'start-point-pin',
    iconSize: [64, 24],
    iconAnchor: [32, 12],
  });
}

export const LiveMapView: React.FC<LiveMapViewProps> = ({ athletes, onSelectAthlete, enableTrackbackToggle = true }) => {
  // Centro por defecto: Palermo / Circuito Running (-34.5711, -58.4173)
  const defaultCenter: [number, number] = [-34.5711, -58.4173];
  const [trackbackActive, setTrackbackActive] = useState(false);

  const activeAthletesWithCoords = useMemo(() => {
    return athletes.filter(a => a.lastSample?.latitude && a.lastSample?.longitude);
  }, [athletes]);

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-radar-border shadow-2xl bg-[#0B0F19]">
      
      {/* Overlay Banner Izquierdo */}
      <div className="absolute top-4 left-4 z-[1000] bg-[#0B0F19]/90 backdrop-blur border border-radar-border px-3.5 py-2 rounded-xl flex items-center gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-bold text-white uppercase tracking-wider">Radar en Vivo</span>
        </div>
        <span className="text-slate-500">•</span>
        <span className="text-slate-300 font-medium">{activeAthletesWithCoords.length} corredores en mapa</span>
      </div>

      {/* Botón Overlay Derecho: Volver sobre sus pasos (Trackback) */}
      {enableTrackbackToggle && (
        <div className="absolute top-4 right-4 z-[1000]">
          <button
            onClick={() => setTrackbackActive(!trackbackActive)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xl backdrop-blur border ${
              trackbackActive 
                ? 'bg-amber-400 text-black border-amber-300 shadow-amber-400/25 ring-2 ring-amber-400/50' 
                : 'bg-[#0B0F19]/90 text-slate-300 border-radar-border hover:text-white hover:border-slate-600'
            }`}
            title="Mostrar rastro GPS completo y camino de regreso a la salida"
          >
            <Compass className={`w-4 h-4 ${trackbackActive ? 'animate-spin' : ''}`} />
            <span>{trackbackActive ? '🧭 Ruta de Retorno (Trackback): ACTIVA' : '🧭 Volver sobre mis pasos'}</span>
          </button>
        </div>
      )}

      {/* Banner flotante de Trackback activo */}
      {trackbackActive && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-amber-950/90 border border-amber-500/50 text-amber-200 px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur shadow-2xl flex items-center gap-2">
          <Navigation className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>Rastro GPS iluminado: sigue la línea continua para regresar al punto 🏁 SALIDA.</span>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={15}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        {/* CartoDB Dark Matter tiles for sports telemetry aesthetic */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Marcadores y Trails */}
        {activeAthletesWithCoords.map((athlete) => {
          const lat = athlete.lastSample!.latitude!;
          const lng = athlete.lastSample!.longitude!;
          const initials = `${athlete.name[0]}${athlete.lastName[0]}`;
          const icon = createStatusMarkerIcon(athlete.currentStatus, initials);
          const sample = athlete.lastSample;
          const hr = sample?.heartRate || 0;
          const zone = sample?.zone || calculateHeartRateZone(hr, athlete.maxHeartRate);
          const zoneInfo = getZoneDetails(zone);

          return (
            <React.Fragment key={athlete.id}>
              {/* Trail reciente o Ruta Trackback para volver sobre sus pasos */}
              {athlete.trail && athlete.trail.length > 1 && (
                <Polyline
                  positions={athlete.trail}
                  color={
                    trackbackActive
                      ? '#F59E0B'
                      : athlete.currentStatus === 'alert'
                      ? '#EF4444'
                      : athlete.currentStatus === 'attention'
                      ? '#F59E0B'
                      : '#00F0FF'
                  }
                  weight={trackbackActive ? 5 : 3}
                  opacity={trackbackActive ? 0.95 : 0.6}
                  dashArray={trackbackActive ? undefined : "4, 4"}
                />
              )}

              {/* Pin de Salida si Trackback está activo */}
              {trackbackActive && athlete.trail && athlete.trail.length > 0 && (
                <Marker
                  position={athlete.trail[0]}
                  icon={createStartPointMarkerIcon()}
                >
                  <Popup>
                    <div className="p-1 text-xs">
                      <strong className="text-emerald-400 block mb-0.5">🏁 Punto de Partida</strong>
                      <span className="text-slate-200">Ruta de inicio de {athlete.name}. Sigue la línea para volver.</span>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Pin del Atleta */}
              <Marker position={[lat, lng]} icon={icon}>
                <Popup>
                  <div className="p-1 min-w-[180px]">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5 mb-2">
                      <span className="font-bold text-white text-sm">
                        {athlete.name} {athlete.lastName}
                      </span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${zoneInfo.bg} ${zoneInfo.color}`}>
                        {getStatusDetails(athlete.currentStatus).label}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Heart className="w-3.5 h-3.5 text-rose-500" /> FC:
                        </span>
                        <span className="font-bold text-white font-mono">{hr} BPM ({zoneInfo.label})</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Ritmo:
                        </span>
                        <span className="font-bold text-white font-mono">{formatPace(sample?.pace)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Distancia:
                        </span>
                        <span className="font-bold text-white font-mono">{formatDistance(sample?.distance)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectAthlete(athlete.id)}
                      className="mt-3 w-full text-center py-1 rounded bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 transition"
                    >
                      Ver Perfil Completo
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};
