import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Athlete } from '../../types';
import { formatPace, formatDistance, getStatusDetails, getZoneDetails, calculateHeartRateZone } from '../../lib/calculations';
import { Heart, Gauge, MapPin, Radio } from 'lucide-react';

interface LiveMapViewProps {
  athletes: Athlete[];
  onSelectAthlete: (athleteId: string) => void;
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

export const LiveMapView: React.FC<LiveMapViewProps> = ({ athletes, onSelectAthlete }) => {
  // Centro por defecto: Palermo / Circuito Running (-34.5711, -58.4173)
  const defaultCenter: [number, number] = [-34.5711, -58.4173];

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
              {/* Trail reciente */}
              {athlete.trail && athlete.trail.length > 1 && (
                <Polyline
                  positions={athlete.trail}
                  color={
                    athlete.currentStatus === 'alert'
                      ? '#EF4444'
                      : athlete.currentStatus === 'attention'
                      ? '#F59E0B'
                      : '#00F0FF'
                  }
                  weight={3}
                  opacity={0.6}
                  dashArray="4, 4"
                />
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
