import { createWidget, widget, align, text_style } from '@zos/ui';
import { HeartRate, Step } from '@zos/sensor';

Page({
  state: {
    hrTextWidget: null,
    stepTextWidget: null,
    statusTextWidget: null,
    coachMessageWidget: null,
    heartRateSensor: null,
    stepSensor: null,
    updateTimer: null
  },

  build() {
    // 1. Título Superior
    createWidget(widget.TEXT, {
      x: 10,
      y: 20,
      w: 300,
      h: 30,
      color: 0x00F0FF,
      text_size: 20,
      align_h: align.CENTER_H,
      text: 'RUNRADAR'
    });

    // 2. Indicador de Estado de Conexión
    this.state.statusTextWidget = createWidget(widget.TEXT, {
      x: 10,
      y: 55,
      w: 300,
      h: 24,
      color: 0x10B981,
      text_size: 14,
      align_h: align.CENTER_H,
      text: '🟢 Conectado al Pelotón'
    });

    // 3. Frecuencia Cardíaca Gigante
    createWidget(widget.TEXT, {
      x: 10,
      y: 95,
      w: 300,
      h: 22,
      color: 0xF43F5E,
      text_size: 14,
      align_h: align.CENTER_H,
      text: '❤️ PULSO EN VIVO'
    });

    this.state.hrTextWidget = createWidget(widget.TEXT, {
      x: 10,
      y: 125,
      w: 300,
      h: 70,
      color: 0xFFFFFF,
      text_size: 52,
      align_h: align.CENTER_H,
      text: '--'
    });

    createWidget(widget.TEXT, {
      x: 10,
      y: 195,
      w: 300,
      h: 20,
      color: 0x94A3B8,
      text_size: 14,
      align_h: align.CENTER_H,
      text: 'BPM'
    });

    // 4. Contador de Pasos
    this.state.stepTextWidget = createWidget(widget.TEXT, {
      x: 10,
      y: 235,
      w: 300,
      h: 30,
      color: 0x38BDF8,
      text_size: 18,
      align_h: align.CENTER_H,
      text: '👣 0 pasos'
    });

    // 5. Caja de Mensajes del Entrenador
    this.state.coachMessageWidget = createWidget(widget.TEXT, {
      x: 15,
      y: 285,
      w: 290,
      h: 60,
      color: 0xFBBF24,
      text_size: 13,
      align_h: align.CENTER_H,
      text_style: text_style.WRAP,
      text: 'Esperando instrucciones del DT...'
    });

    // Inicializar sensores locales para refresco de pantalla
    try {
      this.state.heartRateSensor = new HeartRate();
      this.state.stepSensor = new Step();

      this.state.updateTimer = setInterval(() => {
        this.refreshScreenData();
      }, 1000);
    } catch (e) {
      console.warn('Error al vincular sensores en pantalla:', e);
    }
  },

  refreshScreenData() {
    const app = getApp();
    const hr = (app && app.globalData && app.globalData.currentHeartRate) || 
               (this.state.heartRateSensor ? this.state.heartRateSensor.getCurrent() : 0);
    
    const steps = (app && app.globalData && app.globalData.currentSteps) || 
                  (this.state.stepSensor ? this.state.stepSensor.getCurrent() : 0);

    const coachMsg = (app && app.globalData && app.globalData.lastCoachMessage) || '';

    if (this.state.hrTextWidget) {
      this.state.hrTextWidget.setProperty(widget.PROP_TEXT, hr > 0 ? String(hr) : '--');
    }

    if (this.state.stepTextWidget) {
      this.state.stepTextWidget.setProperty(widget.PROP_TEXT, `👣 ${steps.toLocaleString()} pasos`);
    }

    if (this.state.coachMessageWidget && coachMsg) {
      this.state.coachMessageWidget.setProperty(widget.PROP_TEXT, `📢 DT: "${coachMsg}"`);
    }
  },

  onDestroy() {
    if (this.state.updateTimer) {
      clearInterval(this.state.updateTimer);
      this.state.updateTimer = null;
    }
  }
});
