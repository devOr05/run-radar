import { CompletedSessionRecord } from '../types';

/**
 * Interfaz para el resultado del parseo de archivos GPX o TCX
 */
export interface ParsedActivityData {
  title: string;
  sourceDevice: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  movingTimeSeconds: number;
  distanceMeters: number;
  avgPaceSeconds: number;
  bestPaceSeconds?: number;
  avgHeartRate: number;
  maxHeartRate: number;
  avgCadence: number;
  totalCalories: number;
  totalSteps: number;
  elevationGainMeters?: number;
  trackCoordinates: [number, number][];
  splits: { km: number; paceSeconds: number; avgHr: number }[];
}

/**
 * Cálculo de distancia entre 2 coordenadas con la fórmula de Haversine (en metros)
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Parser nativo y ultra liviano para archivos GPX generados por Amazfit (Zepp), Adidas Running, Garmin o Strava
 */
export function parseGpxFile(xmlString: string, fileName?: string): ParsedActivityData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  // Verificar si hay errores de sintaxis XML
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('El archivo GPX no tiene un formato XML válido.');
  }

  // Nombre de la actividad
  const nameNode = xmlDoc.querySelector('trk > name') || xmlDoc.querySelector('metadata > name');
  const activityTitle = nameNode?.textContent?.trim() || fileName?.replace(/\.[^/.]+$/, '') || 'Entrenamiento al aire libre';

  // Detección del dispositivo de origen en la cabecera del GPX (Zepp, Amazfit, Adidas, Garmin)
  const creator = xmlDoc.documentElement.getAttribute('creator') || '';
  let detectedDevice = '⌚ GPS Reloj Deportivo';
  if (/zepp|amazfit|huami/i.test(creator) || /zepp/i.test(xmlString)) {
    detectedDevice = '⌚ Amazfit (Zepp OS)';
  } else if (/runtastic|adidas/i.test(creator) || /adidas/i.test(xmlString)) {
    detectedDevice = '👟 Adidas Running';
  } else if (/garmin/i.test(creator)) {
    detectedDevice = '⌚ Garmin Connect';
  } else if (/strava/i.test(creator)) {
    detectedDevice = '🟠 Strava / Zepp Hub';
  }

  // Puntos del track (<trkpt>)
  const trkpts = xmlDoc.querySelectorAll('trkpt');
  if (trkpts.length === 0) {
    throw new Error('El archivo GPX no contiene puntos de track GPS (trkpt).');
  }

  const coordinates: [number, number][] = [];
  const hrList: number[] = [];
  const cadList: number[] = [];

  let totalDistanceMeters = 0;
  let prevLat: number | null = null;
  let prevLon: number | null = null;
  let prevTime: number | null = null;

  let startTime = 0;
  let endTime = 0;
  let elevationGain = 0;
  let prevEle: number | null = null;

  // Seguimiento de splits por cada 1 km
  const splits: { km: number; paceSeconds: number; avgHr: number }[] = [];
  let currentSplitMeters = 0;
  let currentSplitStartTime = 0;
  let currentSplitHrAccum = 0;
  let currentSplitHrCount = 0;
  let currentKmIndex = 1;

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt.getAttribute('lat') || '0');
    const lon = parseFloat(pt.getAttribute('lon') || '0');

    if (!isNaN(lat) && !isNaN(lon)) {
      coordinates.push([lat, lon]);

      // Tiempo
      const timeNode = pt.querySelector('time');
      const pointTime = timeNode?.textContent ? new Date(timeNode.textContent).getTime() : 0;

      if (i === 0 && pointTime > 0) {
        startTime = pointTime;
        currentSplitStartTime = pointTime;
      }
      if (pointTime > 0) {
        endTime = pointTime;
      }

      // Elevación
      const eleNode = pt.querySelector('ele');
      if (eleNode?.textContent) {
        const ele = parseFloat(eleNode.textContent);
        if (!isNaN(ele)) {
          if (prevEle !== null && ele > prevEle) {
            elevationGain += (ele - prevEle);
          }
          prevEle = ele;
        }
      }

      // Distancia acumulada
      if (prevLat !== null && prevLon !== null) {
        const d = calculateHaversineDistance(prevLat, prevLon, lat, lon);
        // Filtrar saltos irreales de GPS (> 150m en 1 segundo = 540 km/h)
        if (d > 0.5 && d < 150) {
          totalDistanceMeters += d;
          currentSplitMeters += d;
        }
      }

      // Frecuencia Cardíaca (Extensions de Garmin / Zepp / Strava)
      // Puede estar en <gpxtpx:hr>, <ns3:hr>, o simplemente <hr>
      const hrNode = 
        pt.querySelector('hr') ||
        pt.querySelector('TrackPointExtension > hr') ||
        pt.querySelector('*|hr');

      let currentHr = 0;
      if (hrNode?.textContent) {
        const hrVal = parseInt(hrNode.textContent, 10);
        if (hrVal > 40 && hrVal < 240) {
          hrList.push(hrVal);
          currentHr = hrVal;
          currentSplitHrAccum += hrVal;
          currentSplitHrCount++;
        }
      }

      // Cadencia (<gpxtpx:cad> o <cad>)
      const cadNode = pt.querySelector('cad') || pt.querySelector('*|cad');
      if (cadNode?.textContent) {
        const cadVal = parseInt(cadNode.textContent, 10);
        if (cadVal > 40 && cadVal < 240) {
          cadList.push(cadVal);
        }
      }

      // Verificación de Split por cada 1000m
      if (currentSplitMeters >= 1000 && pointTime > 0 && currentSplitStartTime > 0) {
        const splitSecs = Math.max(Math.round((pointTime - currentSplitStartTime) / 1000), 120);
        const splitAvgHr = currentSplitHrCount > 0 ? Math.round(currentSplitHrAccum / currentSplitHrCount) : 0;
        
        splits.push({
          km: currentKmIndex,
          paceSeconds: splitSecs,
          avgHr: splitAvgHr
        });

        currentKmIndex++;
        currentSplitMeters = 0;
        currentSplitStartTime = pointTime;
        currentSplitHrAccum = 0;
        currentSplitHrCount = 0;
      }

      prevLat = lat;
      prevLon = lon;
      if (pointTime > 0) prevTime = pointTime;
    }
  }

  // Si no había tiempo en los puntos, estimar
  if (startTime === 0 || endTime === 0 || endTime <= startTime) {
    startTime = Date.now() - 2400000; // 40 min antes
    endTime = Date.now();
  }

  const durationSeconds = Math.max(Math.round((endTime - startTime) / 1000), 60);
  const distanceKm = Math.max(totalDistanceMeters / 1000, 0.1);
  const avgPaceSeconds = Math.round(durationSeconds / distanceKm);

  const avgHeartRate = hrList.length > 0 
    ? Math.round(hrList.reduce((a, b) => a + b, 0) / hrList.length) 
    : 154;

  const maxHeartRate = hrList.length > 0 
    ? Math.max(...hrList) 
    : avgHeartRate + 14;

  const avgCadence = cadList.length > 0 
    ? Math.round(cadList.reduce((a, b) => a + b, 0) / cadList.length) 
    : 174;

  const totalCalories = Math.round(distanceKm * 65);
  const totalSteps = Math.round((durationSeconds / 60) * avgCadence);

  return {
    title: activityTitle,
    sourceDevice: detectedDevice,
    startTime,
    endTime,
    durationSeconds,
    movingTimeSeconds: Math.round(durationSeconds * 0.96),
    distanceMeters: Math.round(totalDistanceMeters),
    avgPaceSeconds,
    bestPaceSeconds: splits.length > 0 ? Math.min(...splits.map(s => s.paceSeconds)) : Math.round(avgPaceSeconds * 0.92),
    avgHeartRate,
    maxHeartRate,
    avgCadence,
    totalCalories,
    totalSteps,
    elevationGainMeters: Math.round(elevationGain),
    trackCoordinates: coordinates.slice(0, 300), // Muestra compacta para visualización
    splits
  };
}

/**
 * Parser para archivos TCX (Training Center XML) de Garmin / Polar / Zepp
 */
export function parseTcxFile(xmlString: string, fileName?: string): ParsedActivityData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  if (xmlDoc.querySelector('parsererror')) {
    throw new Error('El archivo TCX no tiene un formato XML válido.');
  }

  // Extraer valores resumen
  const totalTimeNode = xmlDoc.querySelector('TotalTimeSeconds');
  const distanceMetersNode = xmlDoc.querySelector('DistanceMeters');
  const caloriesNode = xmlDoc.querySelector('Calories');
  const avgHrNode = xmlDoc.querySelector('AverageHeartRateBpm > Value');
  const maxHrNode = xmlDoc.querySelector('MaximumHeartRateBpm > Value');

  const durationSeconds = totalTimeNode ? Math.round(parseFloat(totalTimeNode.textContent || '0')) : 1800;
  const distanceMeters = distanceMetersNode ? Math.round(parseFloat(distanceMetersNode.textContent || '0')) : 5000;
  const totalCalories = caloriesNode ? parseInt(caloriesNode.textContent || '0', 10) : Math.round((distanceMeters / 1000) * 65);
  const avgHeartRate = avgHrNode ? parseInt(avgHrNode.textContent || '150', 10) : 152;
  const maxHeartRate = maxHrNode ? parseInt(maxHrNode.textContent || '165', 10) : avgHeartRate + 12;

  const distanceKm = Math.max(distanceMeters / 1000, 0.1);
  const avgPaceSeconds = Math.round(durationSeconds / distanceKm);

  // Extraer coordenadas
  const trackpoints = xmlDoc.querySelectorAll('Trackpoint');
  const coordinates: [number, number][] = [];
  trackpoints.forEach(tp => {
    const lat = tp.querySelector('Position > LatitudeDegrees')?.textContent;
    const lon = tp.querySelector('Position > LongitudeDegrees')?.textContent;
    if (lat && lon) {
      coordinates.push([parseFloat(lat), parseFloat(lon)]);
    }
  });

  return {
    title: fileName?.replace(/\.[^/.]+$/, '') || 'Entrenamiento TCX',
    sourceDevice: '⌚ TCX Fitness Device (Garmin/Zepp)',
    startTime: Date.now() - (durationSeconds * 1000),
    endTime: Date.now(),
    durationSeconds,
    movingTimeSeconds: durationSeconds,
    distanceMeters,
    avgPaceSeconds,
    avgHeartRate,
    maxHeartRate,
    avgCadence: 172,
    totalCalories,
    totalSteps: Math.round((durationSeconds / 60) * 172),
    trackCoordinates: coordinates.slice(0, 300),
    splits: []
  };
}

/**
 * Cliente de Strava API v3
 */
export const stravaService = {
  // Configuración OAuth
  // Si el usuario configura sus credenciales en .env o en el localStorage
  getStorageAuth(): { accessToken: string; athleteId: string; athleteName: string; isConnected: boolean } {
    try {
      const saved = localStorage.getItem('runradar_strava_auth');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      accessToken: '',
      athleteId: '',
      athleteName: '',
      isConnected: false
    };
  },

  setStorageAuth(data: { accessToken: string; athleteId: string; athleteName: string }) {
    localStorage.setItem('runradar_strava_auth', JSON.stringify({
      ...data,
      isConnected: true,
      lastSyncTime: Date.now()
    }));
  },

  disconnect() {
    localStorage.removeItem('runradar_strava_auth');
  },

  /**
   * Obtener actividades recientes desde la API de Strava o reloj sincronizado
   */
  async getRecentActivities(accessToken: string): Promise<any[]> {
    if (!accessToken) return [];

    // Si es un token de prueba o cuenta conectada en modo demo/offline
    if (accessToken.startsWith('strava-tok-') || accessToken.startsWith('demo-')) {
      const now = Date.now();
      const lastDemoSync = parseInt(localStorage.getItem('runradar_demo_last_sync') || '0', 10);
      
      // Si es la primera vez o pasaron más de 5 minutos, sincronizar nueva corrida
      if (now - lastDemoSync > 300000 || lastDemoSync === 0) {
        localStorage.setItem('runradar_demo_last_sync', now.toString());
        return [{
          id: `act-${now}`,
          name: 'Entrenamiento Fondista (Amazfit Zepp OS)',
          distance: 8520,
          moving_time: 2630,
          elapsed_time: 2700,
          average_heartrate: 156,
          max_heartrate: 174,
          average_cadence: 88,
          calories: 615,
          device_name: 'Amazfit (Zepp OS)',
          start_date: new Date(now - 2700000).toISOString()
        }];
      }
      return [];
    }

    try {
      const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=5', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error de Strava API: ${response.statusText}`);
      }

      return await response.json();
    } catch (e) {
      console.warn('Error fetching Strava activities:', e);
      throw e;
    }
  },

  /**
   * Convierte un objeto de actividad de Strava en un CompletedSessionRecord listo para RunRadar
   */
  mapStravaActivityToSession(
    stravaAct: any,
    athleteId: string,
    athleteName: string,
    athleteAvatar: string | undefined,
    groupId: string,
    groupName: string
  ): Omit<CompletedSessionRecord, 'id' | 'syncTimestamp'> {
    const distanceMeters = Math.round(stravaAct.distance || 0);
    const movingSeconds = Math.round(stravaAct.moving_time || stravaAct.elapsed_time || 60);
    const distanceKm = Math.max(distanceMeters / 1000, 0.1);
    const avgPaceSeconds = Math.round(movingSeconds / distanceKm);

    const now = new Date(stravaAct.start_date || Date.now());
    const dateStr = `Hoy, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} hs`;

    // Detectar si fue grabado con Zepp / Amazfit o Adidas
    let sourceDev = '🟠 Strava Cloud Sync';
    if (stravaAct.device_name) {
      sourceDev = `⌚ ${stravaAct.device_name}`;
    } else if (stravaAct.external_id && /zepp|huami/i.test(stravaAct.external_id)) {
      sourceDev = '⌚ Amazfit (Zepp OS)';
    }

    return {
      groupId,
      groupName,
      athleteId,
      athleteName,
      athleteAvatar,
      sourceDevice: sourceDev,
      date: dateStr,
      startTime: new Date(stravaAct.start_date).getTime() || (Date.now() - movingSeconds * 1000),
      endTime: new Date(stravaAct.start_date).getTime() + (movingSeconds * 1000),
      durationSeconds: movingSeconds,
      distanceMeters,
      avgPaceSeconds,
      bestPaceSeconds: Math.round(avgPaceSeconds * 0.9),
      avgHeartRate: stravaAct.average_heartrate ? Math.round(stravaAct.average_heartrate) : 155,
      maxHeartRate: stravaAct.max_heartrate ? Math.round(stravaAct.max_heartrate) : 172,
      avgCadence: stravaAct.average_cadence ? Math.round(stravaAct.average_cadence * 2) : 174,
      totalCalories: stravaAct.calories ? Math.round(stravaAct.calories) : Math.round(distanceKm * 65),
      totalSteps: Math.round((movingSeconds / 60) * 174),
      syncType: 'offline_sync',
      notes: stravaAct.name || 'Entrenamiento sincronizado de Strava'
    };
  }
};
