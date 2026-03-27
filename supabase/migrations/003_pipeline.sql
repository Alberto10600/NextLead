-- Pipeline stage for responded contacts
ALTER TABLE contactos
  ADD COLUMN IF NOT EXISTS etapa_pipeline text
    CHECK (etapa_pipeline IN ('respondio','call_agendada','propuesta_enviada','negociando','cerrado_ganado','cerrado_perdido'));

-- Index for pipeline queries (only responded contacts)
CREATE INDEX IF NOT EXISTS idx_contactos_pipeline
  ON contactos (user_id, estado, etapa_pipeline)
  WHERE estado = 'respondido';
