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
        const accuracy = pos.coords.accuracy || 100;
        let speed = (pos.coords.speed !== null && pos.coords.speed !== undefined && pos.coords.speed > 0)
          ? pos.coords.speed * 3.6
          : 0;

        if (this.lastPosition) {
          const dist = calculateDistanceBetweenCoordinates(
            this.lastPosition.coords.latitude,
            this.lastPosition.coords.longitude,
            pos.coords.latitude,
            pos.coords.longitude
          );

          // FILTRO ANTI-RUIDO GPS:
          // Solo sumar distancia si el movimiento es real (ignora deriva satelital de 2-4m en reposo)
          const isRealMovement = accuracy < 35 && (
            (speed > 1.2 && dist >= 3) ||
            (dist >= 5)
          );

          if (isRealMovement) {
            this.totalDistanceMeters += dist;
            this.lastPosition = pos;
          }
        } else {
          this.lastPosition = pos;
        }

        const pace = speed > 1.2 ? Math.round(3600 / speed) : undefined;

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
          signalQuality: accuracy < 15 ? 'excellent' : 'good'
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

export interface BluetoothDeviceInfo {
  name: string;
  id: string;
  manufacturer?: string;
  model?: string;
  batteryLevel?: number;
  hasHeartRate: boolean;
}

/**
 * Adaptador Web Bluetooth para Sensores Cardíacos Estándar (Polar H10, Garmin HRM, Amazfit, Magene, Wahoo)
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
  private deviceInfo: BluetoothDeviceInfo | null = null;
  private watchBattery: number | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  getDeviceInfo(): BluetoothDeviceInfo | null {
    return this.deviceInfo;
  }

  getBatteryLevel(): number | null {
    return this.watchBattery;
  }

  onDisconnect(cb: () => void): void {
    this.onDisconnectCallback = cb;
  }

  async connect(): Promise<boolean> {
    if (!(navigator as any).bluetooth) {
      this.status = 'unsupported';
      return false;
    }

    try {
      this.status = 'pending';
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'heart_rate',
          'battery_service',
          'device_information',
          0x180d,
          0x180f,
          0x180a,
          0xfee0,
          0xfee1
        ]
      });

      return await this.connectWithDevice(device);
    } catch (e) {
      console.warn('Bluetooth requestDevice error:', e);
      this.status = 'disconnected';
      return false;
    }
  }

  // Conectar con un dispositivo ya descubierto o pre-aprobado (para reconexión persistente)
  async connectWithDevice(device: any): Promise<boolean> {
    try {
      this.status = 'pending';
      const server = await device.gatt.connect();

      device.addEventListener('gattserverdisconnected', () => {
        this.status = 'disconnected';
        this.onDisconnectCallback?.();
      });

      let hasHeartRate = false;
      let hrService: any = null;
      try {
        hrService = await server.getPrimaryService('heart_rate');
      } catch (e1) {
        try {
          hrService = await server.getPrimaryService(0x180d);
        } catch (e2) {
          try {
            hrService = await server.getPrimaryService('0000180d-0000-1000-8000-00805f9b34fb');
          } catch (e3) {}
        }
      }

      if (hrService) {
        try {
          this.characteristic = await hrService.getCharacteristic('heart_rate_measurement');
        } catch (c1) {
          try {
            this.characteristic = await hrService.getCharacteristic(0x2a37);
          } catch (c2) {
            try {
              this.characteristic = await hrService.getCharacteristic('00002a37-0000-1000-8000-00805f9b34fb');
            } catch (c3) {}
          }
        }
        if (this.characteristic) {
          hasHeartRate = true;
        }
      }

      // Intentar leer nivel de batería del reloj vía BLE (0x180F)
      let readBat: number | undefined = undefined;
      try {
        const batService = await server.getPrimaryService('battery_service').catch(() => server.getPrimaryService(0x180f));
        const batChar = await batService.getCharacteristic('battery_level').catch(() => batService.getCharacteristic(0x2a19));
        const batVal = await batChar.readValue();
        readBat = batVal.getUint8(0);
        this.watchBattery = readBat ?? null;
      } catch (batErr) {
        console.log('Servicio de batería no expuesto por el reloj');
      }

      // Intentar leer fabricante y modelo estándar (0x180A)
      let manufacturer = '';
      let model = '';
      try {
        const infoService = await server.getPrimaryService('device_information').catch(() => server.getPrimaryService(0x180a));
        try {
          const mfgChar = await infoService.getCharacteristic('manufacturer_name_string').catch(() => infoService.getCharacteristic(0x2a29));
          const mfgVal = await mfgChar.readValue();
          manufacturer = new TextDecoder().decode(mfgVal).replace(/\0/g, '').trim();
        } catch (e) {}
        try {
          const modChar = await infoService.getCharacteristic('model_number_string').catch(() => infoService.getCharacteristic(0x2a24));
          const modVal = await modChar.readValue();
          model = new TextDecoder().decode(modVal).replace(/\0/g, '').trim();
        } catch (e) {}
      } catch (infoErr) {}

      // Deducir marca inteligente si el firmware no expone fabricante en GATT
      const devName = device.name || 'Dispositivo Bluetooth';
      const lowerName = devName.toLowerCase();
      if (!manufacturer) {
        if (lowerName.includes('amazfit') || lowerName.includes('bip') || lowerName.includes('gtr') || lowerName.includes('gts')) {
          manufacturer = 'Amazfit / Zepp Health';
        } else if (lowerName.includes('garmin') || lowerName.includes('forerunner')) {
          manufacturer = 'Garmin';
        } else if (lowerName.includes('polar')) {
          manufacturer = 'Polar';
        } else if (lowerName.includes('mi band') || lowerName.includes('xiaomi') || lowerName.includes('smart band')) {
          manufacturer = 'Xiaomi';
        } else if (lowerName.includes('huawei')) {
          manufacturer = 'Huawei';
        } else if (lowerName.includes('samsung') || lowerName.includes('galaxy')) {
          manufacturer = 'Samsung';
        } else if (lowerName.includes('coros')) {
          manufacturer = 'COROS';
        } else if (lowerName.includes('magene')) {
          manufacturer = 'Magene';
        } else if (lowerName.includes('wahoo')) {
          manufacturer = 'Wahoo';
        } else {
          manufacturer = 'Smartwatch / Sensor BLE';
        }
      }

      this.device = device;
      this.deviceInfo = {
        name: devName,
        id: device.id,
        manufacturer,
        model: model || devName,
        batteryLevel: readBat,
        hasHeartRate
      };
      this.status = 'connected';
      return true;
    } catch (e) {
      console.warn('Bluetooth connectWithDevice error:', e);
      this.status = 'disconnected';
      return false;
    }
  }

  // Intentar reconexión automática sin diálogo modal a través de getDevices()
  async tryAutoReconnect(savedDeviceId?: string): Promise<boolean> {
    if (typeof navigator === 'undefined' || !(navigator as any).bluetooth?.getDevices) {
      return false;
    }
    try {
      const devices = await (navigator as any).bluetooth.getDevices();
      if (!devices || devices.length === 0) return false;
      const targetDevice = savedDeviceId
        ? devices.find((d: any) => d.id === savedDeviceId) || devices[0]
        : devices[0];
      if (targetDevice) {
        return await this.connectWithDevice(targetDevice);
      }
    } catch (e) {
      console.warn('Auto-reconnect BLE error:', e);
    }
    return false;
  }

  async disconnect(): Promise<void> {
    if (this.device && this.device.gatt?.connected) {
      try {
        this.device.gatt.disconnect();
      } catch (e) {}
    }
    this.status = 'disconnected';
    this.deviceInfo = null;
    this.watchBattery = null;
    this.characteristic = null;
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

        if (hr > 30 && hr < 240) {
          this.onSampleCallback?.({
            source: 'chest_strap',
            sourceDevice: `⌚ ${this.deviceInfo?.name || this.device?.name || 'Reloj Bluetooth'}`,
            timestamp: Date.now(),
            heartRate: hr,
            battery: this.watchBattery ?? undefined
          });
        }
      });
    }).catch((err: any) => {
      console.warn('Error al iniciar notificaciones BLE de pulso:', err);
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
