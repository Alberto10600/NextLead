-- Columna para guardar el análisis de empresa por contacto
-- Run in Supabase: SQL Editor → New query

ALTER TABLE contactos
  ADD COLUMN IF NOT EXISTS analisis_empresa jsonb;
