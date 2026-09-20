import { Athlete, Group, AICoachingSuggestion } from '../types';

/**
 * Motor de IA Asistente para el Entrenador (Running AI Copilot)
 * Analiza la telemetría en vivo del pelotón y detecta patrones de fatiga, descolgados y sobreesfuerzo,
 * generando mensajes tácticos listos para enviar al smartwatch o teléfono del atleta con 1 solo clic.
 */
export class AICoachingService {
  /**
   * Analiza a todos los atletas del grupo activo y devuelve sugerencias priorizadas
   */
  static generateSuggestions(
    athletes: Athlete[],
    group?: Group | null,
    sessionSeconds: number = 0
  ): AICoachingSuggestion[] {
    const suggestions: AICoachingSuggestion[] = [];
    if (!athletes || athletes.length === 0) return suggestions;

    const targetPaceMin = group?.targetPaceRange?.[0] || 300; // 5:00
    const targetPaceMax = group?.targetPaceRange?.[1] || 360; // 6:00
    const now = Date.now();

    for (const athlete of athletes) {
      const sample = athlete.lastSample;
      if (!sample) continue;

      const hr = sample.heartRate;
      const maxHr = athlete.maxHeartRate || 185;
      const pace = sample.pace;
      const cadence = sample.cadence;
      const athleteName = `${athlete.name} ${athlete.lastName}`.trim();

      // 1. Alerta Crítica: Sobreesfuerzo / Zona Cardíaca Roja
      if (hr && hr > maxHr * 0.93) {
        suggestions.push({
          id: `ai-hr-${athlete.id}-${Math.floor(now / 30000)}`,
          athleteId: athlete.id,
          athleteName,
          groupId: group?.id || 'general',
          type: 'overexertion',
          priority: 'high',
          currentValue: `${hr} BPM (Zona 5 extrema)`,
          triggerReason: `Frecuencia al 93%+ de su FC máx (${maxHr} BPM). Riesgo de sobrecarga o fatiga aguda.`,
          suggestedAction: 'Pedirle que reduzca el ritmo de inmediato.',
          suggestedMessage: `⚠️ ${athlete.name}, bajá el ritmo 20s/km. Pulso en zona roja (${hr} BPM).`,
          timestamp: now
        });
      } else if (sample.zone === 5 && hr && hr > 175) {
        suggestions.push({
          id: `ai-z5-${athlete.id}-${Math.floor(now / 45000)}`,
          athleteId: athlete.id,
          athleteName,
          groupId: group?.id || 'general',
          type: 'overexertion',
          priority: 'medium',
          currentValue: `${hr} BPM`,
          triggerReason: `Lleva tiempo continuado en Zona 5. Conviene regular antes del final de la sesión.`,
          suggestedAction: 'Indicarle ritmo de crucero.',
          suggestedMessage: `⏱️ ${athlete.name}, respirá profundo y estabilizá el ritmo.`,
          timestamp: now
        });
      }

      // 2. Alerta Táctica: Atleta Descolgado del Pelotón
      if (pace && pace > targetPaceMax + 40 && (sample.speed || 0) > 2) {
        const paceFormatted = `${Math.floor(pace / 60)}:${(pace % 60).toString().padStart(2, '0')}`;
        suggestions.push({
          id: `ai-pace-slow-${athlete.id}-${Math.floor(now / 45000)}`,
          athleteId: athlete.id,
          athleteName,
          groupId: group?.id || 'general',
          type: 'gap_alert',
          priority: 'medium',
          currentValue: `${paceFormatted}/km`,
          triggerReason: `Ritmo 40s/km más lento que la pauta del pelotón. Distanciamiento en progreso.`,
          suggestedAction: 'Mensaje de aliento para reagrupar.',
          suggestedMessage: `💪 ¡Vamos ${athlete.name}! Enganchate al pelotón, mantené la zancada.`,
          timestamp: now
        });
      }

      // 3. Alerta de Ritmo Excesivo (Atleta escapado antes de tiempo)
      if (pace && pace < targetPaceMin - 35 && (sample.speed || 0) > 4) {
        const paceFormatted = `${Math.floor(pace / 60)}:${(pace % 60).toString().padStart(2, '0')}`;
        suggestions.push({
          id: `ai-pace-fast-${athlete.id}-${Math.floor(now / 60000)}`,
          athleteId: athlete.id,
          athleteName,
          groupId: group?.id || 'general',
          type: 'pace_drop',
          priority: 'low',
          currentValue: `${paceFormatted}/km`,
          triggerReason: `Ritmo considerablemente más rápido que el objetivo pautado para hoy.`,
          suggestedAction: 'Recordarle guardar energía para los kilómetros finales.',
          suggestedMessage: `🎯 ${athlete.name}, buen ritmo pero no te quemes. Guardá para el cierre.`,
          timestamp: now
        });
      }

      // 4. Fatiga Biomecánica: Caída abrupta de Cadencia
      if (cadence && cadence > 0 && cadence < 152 && (sample.speed || 0) > 8) {
        suggestions.push({
          id: `ai-cadence-${athlete.id}-${Math.floor(now / 60000)}`,
          athleteId: athlete.id,
          athleteName,
          groupId: group?.id || 'general',
          type: 'cadence_fatigue',
          priority: 'medium',
          currentValue: `${cadence} SPM`,
          triggerReason: `Cadencia baja (<152 pasos/min). Indica pesadez muscular o zancada demasiado larga.`,
          suggestedAction: 'Sugerir pasos más cortos y frecuentes.',
          suggestedMessage: `👣 ${athlete.name}, zancada más corta y rápida. Cuidá las articulaciones.`,
          timestamp: now
        });
      }
    }

    // 5. Sugerencia Colectiva de Hidratación periódica cada 20-25 minutos
    if (sessionSeconds > 0 && sessionSeconds % 1200 < 60) {
      suggestions.unshift({
        id: `ai-hydration-group-${Math.floor(sessionSeconds / 1200)}`,
        athleteId: 'group-broadcast',
        athleteName: 'Todo el Pelotón',
        groupId: group?.id || 'general',
        type: 'hydration',
        priority: 'high',
        currentValue: `${Math.round(sessionSeconds / 60)} min de sesión`,
        triggerReason: `Han transcurrido 20 minutos continuos de entrenamiento activo.`,
        suggestedAction: 'Recordar hidratación a todo el grupo.',
        suggestedMessage: `💧 Pelotón: 20 min cumplidos. Momento de un sorbo de agua o sales.`,
        timestamp: now
      });
    }

    // Ordenar por prioridad (high -> medium -> low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }
}
