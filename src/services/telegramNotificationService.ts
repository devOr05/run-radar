// Servicio de Notificaciones Silenciosas a Telegram para RunRadar
// Configurado con el mismo bot y chat de Visión IT / Taller IT

const TELEGRAM_BOT_TOKEN = '8535485891:AAEvAOiKwef-PlGffxwcJubUKYuB819sd90';
const TELEGRAM_CHAT_ID = '1577936762';

export async function sendTelegramNotification(message: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    return response.ok;
  } catch (error) {
    console.warn('Error enviando notificación a Telegram:', error);
    return false;
  }
}

// Helpers para eventos específicos
export async function notifyNewRunner(runnerName: string, groupName?: string, deviceName?: string) {
  const text = `🏃 <b>Nuevo Corredor en RunRadar</b>\n\n` +
    `👤 <b>Atleta:</b> ${runnerName}\n` +
    `👥 <b>Grupo:</b> ${groupName || 'Modo Libre (Sin Entrenador)'}\n` +
    `⌚ <b>Dispositivo:</b> ${deviceName || 'Solo Celular'}\n` +
    `🕒 <b>Fecha:</b> ${new Date().toLocaleTimeString('es-AR')}`;
  return sendTelegramNotification(text);
}

export async function notifyNewGroupCreated(groupName: string, coachName: string) {
  const text = `🏆 <b>Nuevo Grupo Creado en RunRadar</b>\n\n` +
    `👥 <b>Grupo:</b> ${groupName}\n` +
    `👨‍🏫 <b>Entrenador:</b> ${coachName}\n` +
    `🕒 <b>Fecha:</b> ${new Date().toLocaleTimeString('es-AR')}`;
  return sendTelegramNotification(text);
}

export async function notifyCriticalAlert(athleteName: string, heartRate: number, alertType: string) {
  const text = `🚨 <b>ALERTA CRÍTICA RUNRADAR</b>\n\n` +
    `👤 <b>Atleta:</b> ${athleteName}\n` +
    `❤️ <b>Frecuencia Cardíaca:</b> ${heartRate} BPM\n` +
    `⚠️ <b>Motivo:</b> ${alertType}\n` +
    `🕒 <b>Hora:</b> ${new Date().toLocaleTimeString('es-AR')}`;
  return sendTelegramNotification(text);
}

export async function notifyAdminAccess(ipOrSource: string = 'Web') {
  const text = `🔐 <b>Acceso al Centro de Control RunRadar</b>\n\n` +
    `🔑 <b>PIN Verificado con éxito</b>\n` +
    `🌐 <b>Origen:</b> ${ipOrSource}\n` +
    `🕒 <b>Hora:</b> ${new Date().toLocaleString('es-AR')}`;
  return sendTelegramNotification(text);
}
