import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Athlete } from '../../types';
import { formatPace, formatDistance, getStatusDetails, getZoneDetails, calculateHeartRateZone } from '../../lib/calculations';
import { Heart, Gauge, MapPin, Radio, Crosshair, Navigation } from 'lucide-react';

interface LiveMapViewProps {
  athletes: Athlete[];
  onSelectAthlete: (athleteId: string) => void;
}

// Icono animado para la ubicación GPS real del usuario (Tú estás aquí)
function createUserGPSMarkerIcon() {
  const svgHtml = `
    <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
      <div style="
        position: absolute;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: rgba(6, 182, 212, 0.3);
        animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        position: absolute;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #06b6d4;
        border: 3px solid #ffffff;
        box-shadow: 0 0 12px rgba(6, 182, 212, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'user-gps-pin',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

// Generador de Iconos SVG personalizados para Leaflet según estado del corredor
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

// Subcomponente interno con acceso a la API del mapa Leaflet
const MapCenterController: React.FC<{
  userLocation: [number, number] | null;
  athleteCoords: [number, number][];
  manualTrigger: number;
}> = ({ userLocation, athleteCoords, manualTrigger }) => {
  const map = useMap();
  const initialDoneRef = useRef(false);

  // Centrado manual cuando el usuario pulsa "Centrar en mi GPS"
  useEffect(() => {
    if (manualTrigger > 0 && userLocation) {
      map.flyTo(userLocation, 16, { duration: 1.2 });
    }
  }, [manualTrigger, userLocation, map]);

  // Centrado inicial inteligente al resolver GPS real o atletas
  useEffect(() => {
    if (!initialDoneRef.current) {
      if (userLocation) {
        map.setView(userLocation, 15);
        initialDoneRef.current = true;
      } else if (athleteCoords.length > 0) {
        if (athleteCoords.length === 1) {
          map.setView(athleteCoords[0], 15);
        } else {
          const bounds = L.latLngBounds(athleteCoords);
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        }
        initialDoneRef.current = true;
      }
    }
  }, [userLocation, athleteCoords, map]);

  return null;
};

export const LiveMapView: React.FC<LiveMapViewProps> = ({ athletes, onSelectAthlete }) => {
  // Centro de referencia inicial: Mar del Plata (-38.0055, -57.5426)
  const defaultCenter: [number, number] = [-38.0055, -57.5426];

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [manualCenterTrigger, setManualCenterTrigger] = useState(0);

  // Filtrar atletas activos que tengan coordenadas
  const activeAthletesWithCoords = useMemo(() => {
    return athletes.filter(a => a.lastSample?.latitude && a.lastSample?.longitude);
  }, [athletes]);

  const athleteCoords = useMemo(() => {
    return activeAthletesWithCoords.map(a => [a.lastSample!.latitude!, a.lastSample!.longitude!] as [number, number]);
  }, [activeAthletesWithCoords]);

  // Resolver nombre de la ciudad según latitud/longitud
  const resolveCityName = async (lat: number, lng: number) => {
    // Reconocimiento instantáneo Mar del Plata y zonas clave
    if (lat >= -38.25 && lat <= -37.80 && lng >= -57.80 && lng <= -57.35) {
      setLocationName('Mar del Plata, Buenos Aires');
      return;
    }
    if (lat >= -34.75 && lat <= -34.45 && lng >= -58.60 && lng <= -58.30) {
      setLocationName('Buenos Aires, CABA');
      return;
    }
    if (lat >= -31.50 && lat <= -31.30 && lng >= -64.30 && lng <= -64.10) {
      setLocationName('Córdoba');
      return;
    }
    if (lat >= -33.05 && lat <= -32.85 && lng >= -60.75 && lng <= -60.60) {
      setLocationName('Rosario, Santa Fe');
      return;
    }

    // Geocodificación inversa vía Nominatim OSM
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        signal: ctrl.signal,
        headers: { 'Accept-Language': 'es' }
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.municipality || data.address?.county;
        const state = data.address?.state || data.address?.country;
        if (city) {
          setLocationName(`${city}, ${state || ''}`);
          return;
        }
      }
    } catch (e) {}

    setLocationName(`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
  };

  // Detección de GPS en tiempo real
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return;

    // Lectura inicial inmediata
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        resolveCityName(coords[0], coords[1]);
      },
      (err) => {
        console.warn('GPS no disponible de inmediato:', err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );

    // Seguimiento continuo del GPS
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        if (!locationName) {
          resolveCityName(coords[0], coords[1]);
        }
      },
      (err) => {
        console.warn('GPS watch error:', err);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-radar-border shadow-2xl bg-[#0B0F19]">
      
      {/* Overlay Banner Superior Izquierdo: Estado del Radar y Ubicación Detectada */}
      <div className="absolute top-3.5 left-3.5 z-[1000] bg-[#0B0F19]/95 backdrop-blur-md border border-radar-border px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-xs shadow-xl">
        <div className="flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-extrabold text-white uppercase tracking-wider text-[11px]">Radar</span>
        </div>
        <span className="text-slate-600">•</span>
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
          <Navigation className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />
          <span>{locationName || (userLocation ? 'GPS Detectado' : 'Mar del Plata (Base)')}</span>
          {gpsAccuracy !== null && (
            <span className="text-[10px] text-slate-400 font-mono">±{gpsAccuracy}m</span>
          )}
        </div>
        <span className="text-slate-600">•</span>
        <span className="text-slate-300 font-medium text-[11px]">
          {activeAthletesWithCoords.length} en radar
        </span>
      </div>

      {/* Botón Flotante Superior Derecho: Centrar en mi GPS */}
      <button
        onClick={() => {
          if (userLocation) {
            setManualCenterTrigger(prev => prev + 1);
          } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setUserLocation(coords);
                setManualCenterTrigger(prev => prev + 1);
                resolveCityName(coords[0], coords[1]);
              },
              () => alert('Por favor habilita el permiso de ubicación en tu navegador.')
            );
          }
        }}
        className="absolute top-3.5 right-3.5 z-[1000] bg-slate-900/95 hover:bg-cyan-500 hover:text-black text-cyan-400 border border-cyan-500/40 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-xl transition active:scale-95 cursor-pointer"
        title="Centrar mapa en mi posición GPS"
      >
        <Crosshair className="w-4 h-4" />
        <span className="hidden sm:inline">Centrar en mi GPS</span>
      </button>

      <MapContainer
        center={userLocation || defaultCenter}
        zoom={15}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Controlador automático de centrado de mapa */}
        <MapCenterController
          userLocation={userLocation}
          athleteCoords={athleteCoords}
          manualTrigger={manualCenterTrigger}
        />

        {/* CartoDB Dark Matter tiles para estética deportiva de alto contraste */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Pin de Ubicación Real del Usuario (Tú estás aquí) */}
        {userLocation && (
          <Marker position={userLocation} icon={createUserGPSMarkerIcon()} zIndexOffset={1000}>
            <Popup>
              <div className="p-1 min-w-[170px] text-xs">
                <div className="flex items-center gap-1.5 font-bold text-cyan-400 border-b border-slate-700 pb-1 mb-1.5">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Tu Ubicación GPS en Vivo</span>
                </div>
                <div className="text-white font-semibold mb-1">
                  {locationName || 'Mar del Plata'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Coords: {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}
                  {gpsAccuracy !== null && ` • Precisión: ±${gpsAccuracy}m`}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marcadores y Trails de Corredores Activos */}
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
