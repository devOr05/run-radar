-- =========================================================
-- RUNRADAR (RR) — ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRES)
-- =========================================================

-- 1. TABLA DE GRUPOS DE ENTRENAMIENTO
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  schedule TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  target_distance FLOAT DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE ATLETAS / CORREDORES
CREATE TABLE IF NOT EXISTS athletes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  group_ids JSONB DEFAULT '[]'::jsonb,
  max_heart_rate INT DEFAULT 185,
  resting_heart_rate INT DEFAULT 60,
  permissions JSONB DEFAULT '{"heartRate":true,"location":true,"workouts":true,"steps":true,"cadence":true,"elevation":true,"calories":true,"wearables":true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE SESIONES DE ENTRENAMIENTO
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  target_distance_km FLOAT DEFAULT 5.0,
  target_duration_minutes INT DEFAULT 45,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  total_distance_meters FLOAT DEFAULT 0,
  avg_pace INT,
  avg_heart_rate INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE TELEMETRÍA Y TRAYECTORIAS GPS (Para tiempo real y "Volver sobre sus pasos")
CREATE TABLE IF NOT EXISTS telemetry_samples (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  athlete_id TEXT REFERENCES athletes(id) ON DELETE CASCADE,
  group_id TEXT,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  altitude FLOAT,
  heart_rate INT,
  pace INT, -- segundos por km
  speed FLOAT,
  distance FLOAT, -- metros acumulados
  cadence INT,
  calories INT,
  battery INT,
  source TEXT DEFAULT 'phone',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas ultrarrápidas de trayectorias
CREATE INDEX IF NOT EXISTS idx_telemetry_athlete_session 
  ON telemetry_samples(athlete_id, session_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_group_session 
  ON telemetry_samples(group_id, recorded_at DESC);

-- 5. TABLA DE ALERTAS FISIOLÓGICAS Y DE SEGURIDAD
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
  athlete_id TEXT REFERENCES athletes(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'high_hr', 'z5_limit', 'low_battery', 'lost_signal'
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  value NUMERIC,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- HABILITAR REALTIME (Suscripciones en vivo por WebSocket)
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE telemetry_samples;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- =========================================================
-- POLÍTICAS DE ACCESO (RLS PÚBLICO O AUTENTICADO)
-- =========================================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública para la app" ON groups FOR SELECT USING (true);
CREATE POLICY "Escritura pública para la app" ON groups FOR ALL USING (true);

CREATE POLICY "Lectura pública de atletas" ON athletes FOR SELECT USING (true);
CREATE POLICY "Escritura pública de atletas" ON athletes FOR ALL USING (true);

CREATE POLICY "Lectura pública de sesiones" ON sessions FOR SELECT USING (true);
CREATE POLICY "Escritura pública de sesiones" ON sessions FOR ALL USING (true);

CREATE POLICY "Lectura pública de telemetría" ON telemetry_samples FOR SELECT USING (true);
CREATE POLICY "Inserción pública de telemetría" ON telemetry_samples FOR INSERT WITH CHECK (true);

CREATE POLICY "Lectura pública de alertas" ON alerts FOR SELECT USING (true);
CREATE POLICY "Escritura pública de alertas" ON alerts FOR ALL USING (true);

-- =========================================================
-- DATOS INICIALES DEMO (Grupos por defecto)
-- =========================================================
INSERT INTO groups (id, name, description, schedule, invite_code, target_distance)
VALUES 
  ('group-martes', 'Running Martes & Jueves', 'Grupo intermedio de ritmo continuo y técnica.', 'Mar y Jue 19:00', 'RUN-4821', 8.0),
  ('group-jueves', 'Fondo del Fin de Semana', 'Fondo largo progresivo y control de pulso.', 'Sáb 08:00', 'RUN-9023', 15.0),
  ('group-10k', '10K Competición Pro', 'Entrenamiento específico de series y umbral de lactato.', 'Lun, Mié y Vie 07:00', 'RUN-1099', 10.0)
ON CONFLICT (id) DO NOTHING;
