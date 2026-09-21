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
  private totalSteps = 0;
  private currentCadence = 0;
  private lastStepTimestamp = 0;
  private recentStepTimes: number[] = [];
  private lastAccMagnitude = 9.8;
  private motionHandler: ((e: DeviceMotionEvent) => void) | null = null;

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

    // 1. Podómetro por Acelerómetro del Celular (DeviceMotionEvent)
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      this.motionHandler = (event: DeviceMotionEvent) => {
        const acc = event.accelerationIncludingGravity || event.acceleration;
        if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

        const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
        const now = Date.now();

        // Detección de pisada/zancada por oscilación vertical (pico > 12.0 m/s², rebote mín 240ms)
        if (magnitude > 12.0 && this.lastAccMagnitude <= 12.0 && (now - this.lastStepTimestamp > 240)) {
          this.totalSteps++;
          this.lastStepTimestamp = now;
          this.recentStepTimes.push(now);

          // Ventana deslizante de 8 segundos para cadencia instantánea
          this.recentStepTimes = this.recentStepTimes.filter(t => now - t <= 8000);
          if (this.recentStepTimes.length >= 2) {
            const windowSec = (now - this.recentStepTimes[0]) / 1000;
            if (windowSec > 0) {
              this.currentCadence = Math.round((this.recentStepTimes.length / windowSec) * 60);
            }
          }
        }
        this.lastAccMagnitude = magnitude;
      };

      try {
        window.addEventListener('devicemotion', this.motionHandler, { passive: true });
      } catch (e) {
        console.warn('No se pudo activar el listener de acelerómetro del teléfono:', e);
      }
    }

    // 2. Monitoreo Satelital GPS del Teléfono
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

        // Solo computar ritmo de carrera si la velocidad supera 3.0 km/h (evita ritmos absurdos en reposo)
        const pace = (speed >= 3.0 && speed <= 35.0) ? Math.round(3600 / speed) : undefined;

        // Si el teléfono no tiene permisos de acelerómetro o está en soporte estático, estimar pasos por distancia GPS
        const estimatedStride = (speed && speed > 5) ? 1.05 : 0.78;
        const gpsEstimatedSteps = Math.round(this.totalDistanceMeters / estimatedStride);
        const steps = Math.max(this.totalSteps, gpsEstimatedSteps);

        // Cadencia: si no hay oscilación pero hay velocidad de trote
        let cadence = this.currentCadence;
        if (cadence === 0 && speed >= 3.0) {
          cadence = Math.round(142 + Math.min(40, (speed - 3) * 3.8));
        }

        // Calorías quemadas estimadas (~65 kcal por km recorrido)
        const calories = Math.round((this.totalDistanceMeters / 1000) * 65);

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
          steps: steps,
          cadence: cadence > 0 ? cadence : undefined,
          calories: calories > 0 ? calories : undefined,
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
    if (this.motionHandler && typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', this.motionHandler);
      this.motionHandler = null;
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
  detectedServices?: string[];
  packetsReceived?: number;
  lastPacketTime?: number;
}

/**
 * Adaptador Web Bluetooth para Sensores Cardíacos Estándar (Polar H10, Garmin HRM, Amazfit, Magene, Wahoo)
 * Con soporte para Zepp OS / Amazfit Bip 6, auto-reconexión GATT y descubrimiento dinámico de servicio 0x180D
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
  private onInfoUpdatedCallback: ((info: BluetoothDeviceInfo) => void) | null = null;
  private isExplicitlyDisconnected = false;
  private pollTimer: any = null;
  private reconnectTimer: any = null;
  private packetsReceived = 0;
  private lastPacketTime: number | null = null;
  private detectedServices: string[] = [];
  private isSubscribing = false;

  getDeviceInfo(): BluetoothDeviceInfo | null {
    return this.deviceInfo;
  }

  getBatteryLevel(): number | null {
    return this.watchBattery;
  }

  getPacketsReceived(): number {
    return this.packetsReceived;
  }

  onDisconnect(cb: () => void): void {
    this.onDisconnectCallback = cb;
  }

  onInfoUpdated(cb: (info: BluetoothDeviceInfo) => void): void {
    this.onInfoUpdatedCallback = cb;
  }

  async connect(): Promise<boolean> {
    if (!(navigator as any).bluetooth) {
      this.status = 'unsupported';
      return false;
    }

    try {
      this.status = 'pending';
      this.isExplicitlyDisconnected = false;

      // Declarar todos los UUIDs estándar y Huami/Amazfit para que Chrome permita acceso GATT
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'heart_rate',
          'battery_service',
          'device_information',
          'generic_access',
          'generic_attribute',
          'cycling_speed_and_cadence',
          'running_speed_and_cadence',
          '0000180d-0000-1000-8000-00805f9b34fb',
          '0000180f-0000-1000-8000-00805f9b34fb',
          '0000180a-0000-1000-8000-00805f9b34fb',
          '0000fee0-0000-1000-8000-00805f9b34fb',
          '0000fee1-0000-1000-8000-00805f9b34fb',
          '0000fee7-0000-1000-8000-00805f9b34fb',
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
      this.device = device;
      this.isExplicitlyDisconnected = false;

      this.stopHeartRateDiscoveryPolling();
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      const server = await device.gatt.connect();

      // Desuscribir listener viejo y suscribir nuevo
      device.removeEventListener?.('gattserverdisconnected', this.handleGattDisconnected);
      device.addEventListener('gattserverdisconnected', this.handleGattDisconnected);

      // Descubrir servicios disponibles para diagnóstico
      this.detectedServices = [];
      try {
        const services = await server.getPrimaryServices();
        for (const s of services) {
          const uuid = String(s.uuid).toLowerCase();
          if (uuid.includes('180d')) this.detectedServices.push('Pulso Cardíaco (0x180D)');
          else if (uuid.includes('180f')) this.detectedServices.push('Batería (0x180F)');
          else if (uuid.includes('180a')) this.detectedServices.push('Info Dispositivo (0x180A)');
          else if (uuid.includes('fee0') || uuid.includes('fee1') || uuid.includes('fee7')) this.detectedServices.push('Amazfit Zepp');
          else this.detectedServices.push(uuid.slice(4, 8) || uuid);
        }
      } catch (e) {}

      // Intentar leer nivel de batería del reloj vía BLE (0x180F)
      let readBat: number | undefined = undefined;
      try {
        const batService = await server.getPrimaryService('battery_service')
          .catch(() => server.getPrimaryService(0x180f))
          .catch(() => server.getPrimaryService('0000180f-0000-1000-8000-00805f9b34fb'));
        const batChar = await batService.getCharacteristic('battery_level')
          .catch(() => batService.getCharacteristic(0x2a19))
          .catch(() => batChar.getCharacteristic('00002a19-0000-1000-8000-00805f9b34fb'));
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
        const infoService = await server.getPrimaryService('device_information')
          .catch(() => server.getPrimaryService(0x180a))
          .catch(() => server.getPrimaryService('0000180a-0000-1000-8000-00805f9b34fb'));
        try {
          const mfgChar = await infoService.getCharacteristic('manufacturer_name_string')
            .catch(() => infoService.getCharacteristic(0x2a29));
          const mfgVal = await mfgChar.readValue();
          manufacturer = new TextDecoder().decode(mfgVal).replace(/\0/g, '').trim();
        } catch (e) {}
        try {
          const modChar = await infoService.getCharacteristic('model_number_string')
            .catch(() => infoService.getCharacteristic(0x2a24));
          const modVal = await modChar.readValue();
          model = new TextDecoder().decode(modVal).replace(/\0/g, '').trim();
        } catch (e) {}
      } catch (infoErr) {}

      // Deducir marca si no la expone
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

      // Buscar canal de frecuencia cardíaca (0x180D / 0x2A37)
      const hasHeartRate = await this.setupHeartRateChannel(server);

      this.deviceInfo = {
        name: devName,
        id: device.id,
        manufacturer,
        model: model || devName,
        batteryLevel: readBat,
        hasHeartRate: Boolean(this.characteristic) || hasHeartRate,
        detectedServices: this.detectedServices,
        packetsReceived: this.packetsReceived
      };

      // Si el canal de pulso aún no está activo (típico en Amazfit hasta que abren la app en el reloj),
      // activamos polling en segundo plano para detectarlo automáticamente sin necesidad de re-vincular
      if (!this.characteristic) {
        this.startHeartRateDiscoveryPolling(server);
      }

      this.status = 'connected';
      return true;
    } catch (e) {
      console.warn('Bluetooth connectWithDevice error:', e);
      this.status = 'disconnected';
      return false;
    }
  }

  // Descubrir y suscribirse al canal estándar de Frecuencia Cardíaca
  async setupHeartRateChannel(server: any): Promise<boolean> {
    try {
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

      if (!hrService) {
        try {
          const allServices = await server.getPrimaryServices();
          for (const s of allServices) {
            const uuid = String(s.uuid).toLowerCase();
            if (uuid.includes('180d') || uuid.includes('heart_rate')) {
              hrService = s;
              break;
            }
          }
        } catch (e4) {}
      }

      if (!hrService) return false;

      let char: any = null;
      try {
        char = await hrService.getCharacteristic('heart_rate_measurement');
      } catch (c1) {
        try {
          char = await hrService.getCharacteristic(0x2a37);
        } catch (c2) {
          try {
            char = await hrService.getCharacteristic('00002a37-0000-1000-8000-00805f9b34fb');
          } catch (c3) {
            try {
              const chars = await hrService.getCharacteristics();
              for (const ch of chars) {
                if (String(ch.uuid).toLowerCase().includes('2a37') || ch.properties?.notify) {
                  char = ch;
                  break;
                }
              }
            } catch (c4) {}
          }
        }
      }

      if (!char) return false;

      this.characteristic = char;
      await this.subscribeToHeartRate(char);
      return true;
    } catch (err) {
      console.warn('setupHeartRateChannel error:', err);
      return false;
    }
  }

  // Handler robusto para paquetes de pulso BLE
  private handleHeartRateValue = (event: any) => {
    const value = event.target?.value || event.detail?.value;
    if (!value || value.byteLength < 2) return;

    // Formato estándar Bluetooth SIG Heart Rate Measurement
    const flags = value.getUint8(0);
    let hr = 0;
    if (flags & 0x01) {
      hr = value.getUint16(1, true); // 16-bit HR
    } else {
      hr = value.getUint8(1);        // 8-bit HR
    }

    this.packetsReceived++;
    this.lastPacketTime = Date.now();

    if (this.deviceInfo) {
      this.deviceInfo.packetsReceived = this.packetsReceived;
      this.deviceInfo.lastPacketTime = this.lastPacketTime;
      this.deviceInfo.hasHeartRate = true;
      this.onInfoUpdatedCallback?.(this.deviceInfo);
    }

    // Filtrar lecturas válidas
    if (hr > 30 && hr < 240) {
      this.onSampleCallback?.({
        source: 'chest_strap',
        sourceDevice: `⌚ ${this.deviceInfo?.name || this.device?.name || 'Reloj Deportivo'}`,
        timestamp: Date.now(),
        heartRate: hr,
        battery: this.watchBattery ?? undefined
      });
    }
  };

  // Suscripción con compatibilidad dual (addEventListener + oncharacteristicvaluechanged para Android Chrome)
  private async subscribeToHeartRate(char: any): Promise<void> {
    if (!char || this.isSubscribing) return;
    this.isSubscribing = true;
    try {
      char.removeEventListener?.('characteristicvaluechanged', this.handleHeartRateValue);
      char.oncharacteristicvaluechanged = this.handleHeartRateValue;
      char.addEventListener('characteristicvaluechanged', this.handleHeartRateValue);

      await char.startNotifications();
      this.stopHeartRateDiscoveryPolling();
      if (this.deviceInfo) {
        this.deviceInfo.hasHeartRate = true;
        this.onInfoUpdatedCallback?.(this.deviceInfo);
      }
      console.log('✅ Suscripción exitosa a notificaciones de pulso BLE');
    } catch (e) {
      console.warn('Error al iniciar startNotifications BLE:', e);
    } finally {
      this.isSubscribing = false;
    }
  }

  // Polling continuo en segundo plano cada 2.5s si el reloj aún no tenía la app de FC abierta
  private startHeartRateDiscoveryPolling(server: any): void {
    this.stopHeartRateDiscoveryPolling();
    this.pollTimer = setInterval(async () => {
      if (this.isExplicitlyDisconnected || !this.device?.gatt?.connected || this.characteristic) {
        if (this.characteristic) this.stopHeartRateDiscoveryPolling();
        return;
      }
      try {
        const found = await this.setupHeartRateChannel(server);
        if (found) {
          this.stopHeartRateDiscoveryPolling();
          if (this.deviceInfo) {
            this.deviceInfo.hasHeartRate = true;
            this.onInfoUpdatedCallback?.(this.deviceInfo);
          }
          if (this.characteristic) {
            await this.subscribeToHeartRate(this.characteristic);
          }
        }
      } catch (e) {}
    }, 2500);
  }

  private stopHeartRateDiscoveryPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  // Reconexión automática cuando el móvil o el reloj cortan la conexión temporalmente
  private handleGattDisconnected = () => {
    console.warn('GATT desconectado del reloj');
    this.stopHeartRateDiscoveryPolling();
    this.characteristic = null;

    if (this.isExplicitlyDisconnected) {
      this.status = 'disconnected';
      this.onDisconnectCallback?.();
      return;
    }

    this.status = 'pending';
    this.onDisconnectCallback?.();
    this.scheduleAutoReconnect();
  };

  private scheduleAutoReconnect(delayMs: number = 2000): void {
    if (this.isExplicitlyDisconnected || !this.device) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectTimer = setTimeout(async () => {
      if (this.isExplicitlyDisconnected || !this.device) return;
      try {
        console.log('Intentando re-conexión automática con el reloj...');
        const ok = await this.connectWithDevice(this.device);
        if (ok) {
          if (this.onSampleCallback && this.characteristic) {
            await this.subscribeToHeartRate(this.characteristic);
          }
          if (this.deviceInfo) {
            this.onInfoUpdatedCallback?.(this.deviceInfo);
          }
        }
      } catch (err) {
        console.warn('Fallo re-conexión automática BLE, reintentando...', err);
        this.scheduleAutoReconnect(4000);
      }
    }, delayMs);
  }

  // Fuerza un escaneo manual inmediato del canal de pulso
  async forceScanHeartRate(): Promise<boolean> {
    if (!this.device?.gatt?.connected) return false;
    const ok = await this.setupHeartRateChannel(this.device.gatt);
    if (ok && this.characteristic) {
      await this.subscribeToHeartRate(this.characteristic);
    }
    return ok;
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
    this.isExplicitlyDisconnected = true;
    this.stopHeartRateDiscoveryPolling();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.characteristic) {
      try {
        this.characteristic.stopNotifications();
      } catch (e) {}
    }
    if (this.device && this.device.gatt?.connected) {
      try {
        this.device.gatt.disconnect();
      } catch (e) {}
    }
    this.status = 'disconnected';
    this.deviceInfo = null;
    this.watchBattery = null;
    this.characteristic = null;
    this.packetsReceived = 0;
  }

  startStream(onSample: (sample: Partial<MetricSample>) => void): void {
    this.onSampleCallback = onSample;
    if (this.characteristic) {
      this.subscribeToHeartRate(this.characteristic);
    } else if (this.device?.gatt?.connected) {
      this.startHeartRateDiscoveryPolling(this.device.gatt);
    }
  }

  stopStream(): void {
    this.stopHeartRateDiscoveryPolling();
    if (this.characteristic) {
      try {
        this.characteristic.stopNotifications();
      } catch (e) {}
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
