import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MetricSample, TrainingSession, Athlete } from '../types';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://oxfqrynciausdebcfqfk.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'sb_publishable_h0wJQnYPxb47JK_TusgXbQ_44KDFcoD';

// Si las variables de entorno están presentes, inicializamos Supabase
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Servicio de Telemetría e Historial con Supabase
 */
export const supabaseService = {
  /**
   * Suscribirse a la telemetría en vivo de un grupo vía Realtime Broadcast
   */
  subscribeToGroupTelemetry(
    groupId: string,
    onSample: (sample: MetricSample) => void
  ) {
    if (!supabase) return null;

    const channel = supabase.channel(`group-telemetry:${groupId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'telemetry-sample' }, (payload) => {
        if (payload.payload) {
          onSample(payload.payload as MetricSample);
        }
      })
      .subscribe();

    return channel;
  },

  /**
   * Emitir una muestra de telemetría de un corredor por Realtime y persistirla en Postgres
   */
  async broadcastSample(groupId: string, sample: MetricSample) {
    if (!supabase) return;

    // 1. Enviar por canal de transmisión instantáneo (sub-segundo)
    const channel = supabase.channel(`group-telemetry:${groupId}`);
    await channel.send({
      type: 'broadcast',
      event: 'telemetry-sample',
      payload: sample,
    });

    // 2. Guardar en base de datos de manera asíncrona para historial y trackback
    if (sample.latitude && sample.longitude) {
      supabase
        .from('telemetry_samples')
        .insert({
          athlete_id: sample.athleteId,
          group_id: groupId,
          latitude: sample.latitude,
          longitude: sample.longitude,
          altitude: sample.altitude || null,
          heart_rate: sample.heartRate || null,
          pace: sample.pace || null,
          speed: sample.speed || null,
          distance: sample.distance || null,
          cadence: sample.cadence || null,
          calories: sample.calories || null,
          battery: sample.battery || null,
          source: sample.source || 'phone',
        })
        .then(
          () => {},
          (err: any) => console.warn('Error guardando muestra en BD', err)
        );
    }
  },

  /**
   * Obtener el rastro GPS completo de un atleta para "Volver sobre sus pasos"
   */
  async getAthleteTrack(athleteId: string, limit: number = 200): Promise<[number, number][]> {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('telemetry_samples')
        .select('latitude, longitude')
        .eq('athlete_id', athleteId)
        .order('recorded_at', { ascending: true })
        .limit(limit);

      if (error || !data) return [];
      return data.map((d: any) => [d.latitude, d.longitude]);
    } catch (e) {
      console.warn('Error fetching track', e);
      return [];
    }
  },

  /**
   * Obtener sesiones pasadas (historial de entrenamiento)
   */
  async getSessionsHistory(groupId?: string) {
    if (!supabase) return [];

    try {
      let query = supabase
        .from('sessions')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(20);

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Error fetching sessions history', e);
      return [];
    }
  },
};
