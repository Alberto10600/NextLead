-- P2 features migration
-- Run this in Supabase SQL editor: Dashboard → SQL Editor → New query

-- Tono, seguimientos y throttling por campaña
ALTER TABLE campanas
  ADD COLUMN IF NOT EXISTS tono text DEFAULT 'cercano',
  ADD COLUMN IF NOT EXISTS dias_seguimiento int[] DEFAULT '{3,7,14}',
  ADD COLUMN IF NOT EXISTS limite_diario int DEFAULT 0;
  -- limite_diario = 0 significa sin límite

-- Plantillas de email (pitches guardados por sector/caso de uso)
CREATE TABLE IF NOT EXISTS plantillas (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre      text NOT NULL,
  sector      text DEFAULT '',
  descripcion text NOT NULL,
  tono        text DEFAULT 'cercano',
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE plantillas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plantillas_owner" ON plantillas
  FOR ALL USING (auth.uid() = user_id);
