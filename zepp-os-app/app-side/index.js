import { BaseSideService } from '@zeppos/zml/base-side';

AppSideService(
  BaseSideService({
    onInit() {
      console.log('RunRadar Side Service Iniciado en el Celular (App Zepp)');

      // Escuchar paquetes de telemetría provenientes del reloj
      if (typeof messaging !== 'undefined' && messaging.peerSocket) {
        messaging.peerSocket.onmessage = (event) => {
          const data = event.data;
          if (!data) return;

          if (data.type === 'TELEMETRY_PACKET') {
            this.forwardTelemetryToRunRadar(data);
          }
        };
      }
    },

    async forwardTelemetryToRunRadar(data) {
      try {
        const endpoint = 'https://runradar.vercel.app/api/telemetry/sample';
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            source: 'smartwatch',
            sourceDevice: 'Amazfit Zepp OS (Bip/Active)',
            heartRate: data.heartRate,
            steps: data.steps,
            calories: data.calories,
            timestamp: data.timestamp || Date.now()
          })
        });

        // Si el servidor responde con una orden táctica pendiente del DT para el reloj:
        if (response.ok) {
          const result = await response.json();
          if (result && result.pendingCoachOrder) {
            this.sendCoachOrderToWatch(result.pendingCoachOrder);
          }
        }
      } catch (err) {
        // En caso de estar sin internet momentáneo
        console.warn('Error al conectar con el servidor RunRadar:', err);
      }
    },

    sendCoachOrderToWatch(orderText) {
      if (typeof messaging !== 'undefined' && messaging.peerSocket && messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        messaging.peerSocket.send({
          type: 'COACH_ORDER',
          text: orderText
        });
      }
    },

    onDestroy() {
      console.log('RunRadar Side Service Detenido');
    }
  })
);
