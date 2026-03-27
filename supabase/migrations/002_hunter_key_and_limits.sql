-- Add Hunter.io API key to user profiles
ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS hunter_api_key text;

-- Index to speed up monthly contact count queries
CREATE INDEX IF NOT EXISTS idx_contactos_user_created
  ON contactos (user_id, created_at);
