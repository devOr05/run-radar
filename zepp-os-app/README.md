# RunRadar — Mini App Nativa para Amazfit (Zepp OS 3.0+)

Mini aplicación oficial de **RunRadar** para relojes inteligentes Amazfit (Bip 5, Bip 6, Active, Balance, T-Rex).

---

## 🌟 Características Principales

1. **⚡ 100% Automática (Sin abrir la app):**
   - Utiliza la API oficial `@zos/app-service` con permisos de servicio en segundo plano (`device:os.bg_service`).
   - El corredor no necesita abrir la aplicación en el reloj antes de salir a correr; el reloj empieza a medir y emitir solo.
   - Si el reloj se reinicia o se apaga, Zepp OS levanta el servicio de RunRadar automáticamente al encender.

2. **❤️ Frecuencia Cardíaca & Podómetro:**
   - Lee el sensor óptico PPG (`@zos/sensor.HeartRate`) segundo a segundo.
   - Lee el chip podómetro (`@zos/sensor.Step`) para pasos reales de la muñeca.

3. **📢 Órdenes Tácticas del DT con Vibración Háptica:**
   - Cuando el entrenador envía un mensaje táctico desde el panel web, el reloj vibra (`@zos/sensor.Vibrate`) y muestra la orden en pantalla (*"Aflojá / Caminá. Pulso muy alto"*).

---

## 🛠️ Requisitos de Desarrollo

- **Node.js:** v16 o superior.
- **Zeus CLI (SDK Oficial de Zepp OS):**
  ```bash
  npm install -g @zeppos/zeus-cli
  ```

---

## 🚀 Compilación y Pruebas

### 1. Compilar el paquete de la aplicación
En la carpeta `zepp-os-app/`:
```bash
zeus build
```
Esto genera el archivo instalable `.zab` (*Zepp App Bundle*) dentro de la carpeta `dist/`.

### 2. Probar de inmediato en tu Amazfit Bip 5 (Vía QR)
1. En tu teléfono, abre la app **Zepp**.
2. Ve a **Perfil > Ajustes > Acerca de** y toca **7 veces seguidas** el logo de Zepp para activar el *Modo Desarrollador*.
3. En la terminal de tu PC corre:
   ```bash
   zeus preview
   ```
4. Aparecerá un código QR en la consola.
5. En la app Zepp, ve a tu reloj > **Modo Desarrollador** > toca el icono de escáner QR arriba a la derecha y escanea el código.
6. ¡La app se instala en tu reloj en 5 segundos!

---

## 🏪 Publicación Oficial y Gratuita en la "Zepp App Store"

Para que cualquier corredor de tu club pueda instalarla con **1 solo clic** sin códigos QR ni modo desarrollador:

1. Entra a [Zepp Open Platform](https://developer.zepp.com) y crea tu cuenta gratuita.
2. Haz clic en **Create Mini Program** (Crear Mini Programa).
3. Ingresa:
   - **Nombre:** RunRadar
   - **Categoría:** Deportes y Salud (Sports & Health)
   - **Descripción:** Monitoreo en vivo de frecuencia cardíaca y telemetría para grupos de entrenamiento.
4. Sube el archivo `.zab` generado por `zeus build` y el icono de la app.
5. Haz clic en **Submit for Review** (Enviar a revisión).
6. En 24-48 horas, Zepp aprueba la app y queda disponible en la tienda oficial.
7. **Flujo del corredor:** Abre `Zepp > App Store > Buscar "RunRadar" > [Instalar]`. Cero pasos técnicos.
