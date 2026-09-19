import { MetricSample, MetricSource } from '../types';

export interface DeviceCapabilities {
  supportsHeartRate: boolean;
  supportsGPS: boolean;
  supportsDistance: boolean;
  supportsPace: boolean;
  supportsSpeed: boolean;
  supportsCadence: boolean;
  supportsElevation: boolean;
  supportsSteps: boolean;
  supportsCalories: boolean;
  supportsBattery: boolean;
  supportsLiveData: boolean;
}

export interface DeviceAdapter {
  id: string;
  name: string;
  type: MetricSource;
  status: 'connected' | 'pending' | 'disconnected' | 'unsupported';
  capabilities: DeviceCapabilities;
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  startStream(onSample: (sample: Partial<MetricSample>) => void): void;
  stopStream(): void;
}

/**
 * Adaptador para Sensores del Celular (GPS Geolocation + Acelerómetro)
 */
export class PhoneSensorAdapter implements DeviceAdapter {
  id = 'phone-sensor-internal';
  name = 'Sensores del Teléfono';
  type: MetricSource = 'phone';
  status: 'connected' | 'pending' | 'disconnected' | 'unsupported' = 'disconnected';
  
  capabilities: DeviceCapabilities = {
    supportsHeartRate: false,
    supportsGPS: true,
    supportsDistance: true,
    supportsPace: true,
    supportsSpeed: true,
    supportsCadence: true,
    supportsElevation: true,
    supportsSteps: true,
    supportsCalories: true,
    supportsBattery: true,
    supportsLiveData: true,
  };

  private watchId: number | null = null;
  private onSampleCallback: ((sample: Partial<MetricSample>) => void) | null = null;
  private lastPosition: GeolocationPosition | null = null;
  private totalDistanceMeters = 0;

  async connect(): Promise<boolean> {
    if (!('geolocation' in navigator)) {
      this.status = 'unsupported';
      return false;
    }
    this.status = 'connected';
    return true;
  }

  async disconnect(): Promise<void> {
    this.stopStream();
    this.status = 'disconnected';
  }

  startStream(onSample: (sample: Partial<MetricSample>) => void): void {
    this.onSampleCallback = onSample;
    if (!('geolocation' in navigator)) return;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        let speed = (pos.coords.speed || 0) * 3.6; // m/s a km/h
        if (this.lastPosition) {
          const dist = calculateDistanceBetweenCoordinates(
            this.lastPosition.coords.latitude,
            this.lastPosition.coords.longitude,
            pos.coords.latitude,
            pos.coords.longitude
          );
          this.totalDistanceMeters += dist;
        }
        this.lastPosition = pos;

        const pace = speed > 1 ? Math.round(3600 / speed) : undefined;

        this.onSampleCallback?.({
          source: 'phone',
          sourceDevice: 'Navegador Móvil GPS',
          timestamp: pos.timestamp || Date.now(),
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude || 0,
          speed: speed,
          pace: pace,
          distance: Math.round(this.totalDistanceMeters),
          signalQuality: pos.coords.accuracy < 15 ? 'excellent' : 'good'
        });
      },
      (err) => {
        console.warn('Phone GPS error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    );
  }

  stopStream(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

/**
 * Adaptador Web Bluetooth para Sensores Cardíacos Estándar (Polar H10, Garmin HRM, Magene, Wahoo)
 */
export class BluetoothHeartRateAdapter implements DeviceAdapter {
  id = 'bluetooth-hrm';
  name = 'Sensor Cardíaco Bluetooth (Banda/Reloj)';
  type: MetricSource = 'chest_strap';
  status: 'connected' | 'pending' | 'disconnected' | 'unsupported' = 'disconnected';

  capabilities: DeviceCapabilities = {
    supportsHeartRate: true,
    supportsGPS: false,
    supportsDistance: false,
    supportsPace: false,
    supportsSpeed: false,
    supportsCadence: false,
    supportsElevation: false,
    supportsSteps: false,
    supportsCalories: false,
    supportsBattery: true,
    supportsLiveData: true,
  };

  private device: any = null;
  private characteristic: any = null;
  private onSampleCallback: ((sample: Partial<MetricSample>) => void) | null = null;

  async connect(): Promise<boolean> {
    if (!(navigator as any).bluetooth) {
      this.status = 'unsupported';
      return false;
    }

    try {
      this.status = 'pending';
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service']
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      this.characteristic = await service.getCharacteristic('heart_rate_measurement');
      
      this.device = device;
      this.status = 'connected';
      return true;
    } catch (e) {
      console.warn('Bluetooth HRM connection error:', e);
      this.status = 'disconnected';
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.status = 'disconnected';
  }

  startStream(onSample: (sample: Partial<MetricSample>) => void): void {
    this.onSampleCallback = onSample;
    if (!this.characteristic) return;

    this.characteristic.startNotifications().then(() => {
      this.characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        // Heart Rate Measurement format (GATT standard)
        const flags = value.getUint8(0);
        let hr = 0;
        if (flags & 0x01) {
          hr = value.getUint16(1, true); // 16-bit HR
        } else {
          hr = value.getUint8(1);        // 8-bit HR
        }

        this.onSampleCallback?.({
          source: 'chest_strap',
          sourceDevice: this.device?.name || 'Sensor Cardíaco BLE',
          timestamp: Date.now(),
          heartRate: hr
        });
      });
    });
  }

  stopStream(): void {
    if (this.characteristic) {
      try {
        this.characteristic.stopNotifications();
      } catch (e) {
        // ignore
      }
    }
  }
}

/**
 * Adaptador de Health Connect (Android) - Capa Declarativa
 */
export class HealthConnectAdapter implements DeviceAdapter {
  id = 'health-connect-adapter';
  name = 'Android Health Connect';
  type: MetricSource = 'health_connect';
  status: 'connected' | 'pending' | 'disconnected' | 'unsupported' = 'disconnected';

  capabilities: DeviceCapabilities = {
    supportsHeartRate: true,
    supportsGPS: true,
    supportsDistance: true,
    supportsPace: true,
    supportsSpeed: true,
    supportsCadence: true,
    supportsElevation: true,
    supportsSteps: true,
    supportsCalories: true,
    supportsBattery: false,
    supportsLiveData: false,
  };

  async connect(): Promise<boolean> {
    // Verificación de disponibilidad del API
    this.status = 'connected';
    return true;
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected';
  }

  startStream(_onSample: (sample: Partial<MetricSample>) => void): void {}
  stopStream(): void {}
}

/**
 * Adaptador de Apple HealthKit (iOS) - Capa Declarativa
 */
export class AppleHealthKitAdapter implements DeviceAdapter {
  id = 'apple-healthkit-adapter';
  name = 'Apple HealthKit';
  type: MetricSource = 'healthkit';
  status: 'connected' | 'pending' | 'disconnected' | 'unsupported' = 'disconnected';

  capabilities: DeviceCapabilities = {
    supportsHeartRate: true,
    supportsGPS: true,
    supportsDistance: true,
    supportsPace: true,
    supportsSpeed: true,
    supportsCadence: true,
    supportsElevation: true,
    supportsSteps: true,
    supportsCalories: true,
    supportsBattery: false,
    supportsLiveData: false,
  };

  async connect(): Promise<boolean> {
    this.status = 'connected';
    return true;
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected';
  }

  startStream(_onSample: (sample: Partial<MetricSample>) => void): void {}
  stopStream(): void {}
}

// Utilidad matemática Haversine
function calculateDistanceBetweenCoordinates(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radio terrestre en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // metros
}
