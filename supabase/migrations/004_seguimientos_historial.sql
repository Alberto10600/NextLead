-- Tabla de seguimientos automáticos por campaña
-- Run this in Supabase: Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS seguimientos (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contacto_id         uuid REFERENCES contactos(id) ON DELETE CASCADE NOT NULL,
  campana_id          uuid REFERENCES campanas(id)  ON DELETE CASCADE NOT NULL,
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  numero_seguimiento  int  NOT NULL DEFAULT 1,
  asunto              text,
  cuerpo              text,
  estado              text NOT NULL DEFAULT 'pendiente'
                        CHECK (estado IN ('pendiente', 'enviado', 'cancelado')),
  fecha_programada    timestamptz NOT NULL,
  fecha_enviado       timestamptz,
  created_at          timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE seguimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seguimientos_owner" ON seguimientos
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_seguimientos_user_estado
  ON seguimientos (user_id, estado, fecha_programada);

CREATE INDEX IF NOT EXISTS idx_seguimientos_contacto
  ON seguimientos (contacto_id);

-- Tabla de historial de contactos (evita contactar dos veces el mismo email)
CREATE TABLE IF NOT EXISTS historial_contactos (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email                 text NOT NULL,
  dominio               text NOT NULL DEFAULT '',
  fecha_ultimo_contacto timestamptz NOT NULL,
  total_contactos       int NOT NULL DEFAULT 1,
  created_at            timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, email)
);

ALTER TABLE historial_contactos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historial_owner" ON historial_contactos
  FOR ALL USING (auth.uid() = user_id);
