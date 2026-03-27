-- Index to speed up monthly contact count queries
CREATE INDEX IF NOT EXISTS idx_contactos_user_created
  ON contactos (user_id, created_at);
