import { HeartRate, Step, Calorie } from '@zos/sensor';
import { Vibrate, VIBRATOR_SCENARIO_NOTIFICATION } from '@zos/sensor';

AppService({
  heartRateSensor: null,
  stepSensor: null,
  calorieSensor: null,
  vibrator: null,
  intervalTimer: null,
  lastHeartRate: 0,
  lastSteps: 0,
  lastCalories: 0,

  onInit(params) {
    console.log('RunRadar Long Service Iniciado en Segundo Plano');

    try {
      this.heartRateSensor = new HeartRate();
      this.stepSensor = new Step();
      this.calorieSensor = new Calorie();
      this.vibrator = new Vibrate();

      // Iniciar monitoreo activo del sensor óptico cardíaco
      this.heartRateSensor.onCurrentChange(() => {
        const hr = this.heartRateSensor.getCurrent();
        if (hr && hr > 35 && hr < 240) {
          this.lastHeartRate = hr;
          const app = getApp();
          if (app && app.globalData) {
            app.globalData.currentHeartRate = hr;
          }
        }
      });

      // Iniciar monitoreo del chip podómetro del reloj
      this.stepSensor.onChange(() => {
        const st = this.stepSensor.getCurrent();
        if (st !== undefined) {
          this.lastSteps = st;
          const app = getApp();
          if (app && app.globalData) {
            app.globalData.currentSteps = st;
          }
        }
      });

      // Bucle de emisión periódica de telemetría hacia el Side Service (cada 1 segundo)
      this.intervalTimer = setInterval(() => {
        this.emitTelemetrySample();
      }, 1000);

    } catch (err) {
      console.warn('Error inicializando sensores en segundo plano:', err);
    }
  },

  emitTelemetrySample() {
    const hr = this.lastHeartRate || (this.heartRateSensor ? this.heartRateSensor.getCurrent() : 0);
    const steps = this.lastSteps || (this.stepSensor ? this.stepSensor.getCurrent() : 0);
    const calories = this.calorieSensor ? this.calorieSensor.getCurrent() : 0;

    const payload = {
      type: 'TELEMETRY_PACKET',
      heartRate: hr,
      steps: steps,
      calories: calories,
      timestamp: Date.now()
    };

    // Si hay canal de mensajería BLE activo con la app Zepp del celular, enviamos el paquete
    if (typeof messaging !== 'undefined' && messaging.peerSocket && messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      try {
        messaging.peerSocket.send(payload);
      } catch (e) {
        // En espera de reconexión BLE
      }
    }
  },

  // Manejar mensajes tácticos y órdenes que el entrenador envía al reloj
  onReceiveMessage(message) {
    if (!message) return;

    if (message.type === 'COACH_ORDER') {
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.lastCoachMessage = message.text || '';
      }

      // Disparar vibración física háptica en la muñeca del corredor
      try {
        if (this.vibrator) {
          this.vibrator.stop();
          this.vibrator.setMode(VIBRATOR_SCENARIO_NOTIFICATION);
          this.vibrator.start();
        }
      } catch (e) {
        console.warn('Error al activar vibrador:', e);
      }
    }
  },

  onDestroy() {
    console.log('RunRadar Background Service Detenido');
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }
});
