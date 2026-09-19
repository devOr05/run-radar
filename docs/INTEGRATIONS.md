# 🔌 Capa de Integraciones de Dispositivos (Device Adapter Layer)

## 1. Niveles de Equipamiento del Corredor (Sin Obligar a Comprar Hardware)

Un corredor recreativo puede participar con cualquiera de los siguientes niveles:
* **Nivel 1 (Base):** 📱 Solo Celular (GPS, distancia, ritmo, pasos estimados vía acelerómetro).
* **Nivel 2:** 📱 Celular + ⌚ Smartband (Xiaomi Band, Huawei Band, Fitbit).
* **Nivel 3:** 📱 Celular + ⌚ Smartwatch con GPS integrado (Apple Watch, Garmin Forerunner, Polar Pacer, Amazfit).
* **Nivel 4:** 📱 Celular + ⌚ Reloj + ❤️ Sensor de Pecho (Polar H10, Garmin HRM-Pro, Wahoo TICKR).

## 2. Jerarquía de Fusión de Datos (Data Fusion Priority)

Cuando el sistema recibe métricas de múltiples dispositivos del mismo corredor, aplica la siguiente prioridad por canal:

```
FRECUENCIA CARDÍACA:
Sensor de Pecho BLE (0x180D) > Smartwatch > Smartband > Health API > Celular

UBICACIÓN & GPS:
GPS Nativo del Celular (Alta Precisión) > GPS de Smartwatch > Health Connect / HealthKit

PASOS & CADENCIA:
Podómetro / Wearable > Sensor del Celular > Health API
```

## 3. Adaptadores Oficiales

* **`PhoneSensorAdapter`:** Utiliza `navigator.geolocation` y `DeviceMotionEvent` para telemetría sin periféricos.
* **`BluetoothHeartRateAdapter`:** Utiliza Web Bluetooth API conectándose al servicio GATT estándar `heart_rate` (UUID `0x180D`) con soporte para bandas universales.
* **`HealthConnectAdapter`:** Capa para Android Health Connect (lectura de ejercicios y biometría consolidada).
* **`AppleHealthKitAdapter`:** Capa para Apple HealthKit en iOS.
