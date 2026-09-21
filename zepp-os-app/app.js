import { start } from '@zos/app-service';

App({
  globalData: {
    isServiceRunning: false,
    currentHeartRate: 0,
    currentSteps: 0,
    lastCoachMessage: ''
  },

  onCreate(options) {
    console.log('RunRadar Zepp OS App Iniciada');

    // Iniciar automáticamente el servicio residente en segundo plano (Long Service)
    try {
      start({
        file: 'app-service/run_radar_service',
        complete_func: (res) => {
          console.log('Servicio en segundo plano RunRadar iniciado con éxito:', res);
          this.globalData.isServiceRunning = true;
        }
      });
    } catch (e) {
      console.warn('Error al iniciar el servicio de fondo:', e);
    }
  },

  onDestroy(options) {
    console.log('RunRadar UI cerrada (el servicio en segundo plano sigue activo)');
  }
});
