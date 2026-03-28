-- Team workspace migration
-- Run in Supabase: Dashboard → SQL Editor → New query

-- Equipos (one team per owner)
CREATE TABLE IF NOT EXISTS equipos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      text NOT NULL,
  owner_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- Team members (invited by email)
CREATE TABLE IF NOT EXISTS miembros_equipo (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  equipo_id     uuid REFERENCES equipos(id) ON DELETE CASCADE NOT NULL,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  rol           text NOT NULL DEFAULT 'miembro' CHECK (rol IN ('admin', 'miembro')),
  estado        text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'activo')),
  token         text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex') NOT NULL,
  invited_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now() NOT NULL,
  UNIQUE(equipo_id, email)
);

-- Add equipo_id to perfiles so users know which team they belong to
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS equipo_id uuid REFERENCES equipos(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE miembros_equipo ENABLE ROW LEVEL SECURITY;

-- Equipos: visible for owner and active members
CREATE POLICY "equipo_select" ON equipos
  FOR SELECT USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT equipo_id FROM miembros_equipo
      WHERE user_id = auth.uid() AND estado = 'activo'
    )
  );

CREATE POLICY "equipo_insert" ON equipos
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "equipo_update" ON equipos
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "equipo_delete" ON equipos
  FOR DELETE USING (owner_id = auth.uid());

-- Miembros: visible for owner and fellow members; management only for owner
CREATE POLICY "miembros_select" ON miembros_equipo
  FOR SELECT USING (
    user_id = auth.uid()
    OR equipo_id IN (SELECT id FROM equipos WHERE owner_id = auth.uid())
    OR equipo_id IN (
      SELECT equipo_id FROM miembros_equipo
      WHERE user_id = auth.uid() AND estado = 'activo'
    )
  );

CREATE POLICY "miembros_insert" ON miembros_equipo
  FOR INSERT WITH CHECK (
    equipo_id IN (SELECT id FROM equipos WHERE owner_id = auth.uid())
  );

CREATE POLICY "miembros_update" ON miembros_equipo
  FOR UPDATE USING (
    equipo_id IN (SELECT id FROM equipos WHERE owner_id = auth.uid())
    OR user_id = auth.uid()  -- member can accept their own invite
  );

CREATE POLICY "miembros_delete" ON miembros_equipo
  FOR DELETE USING (
    equipo_id IN (SELECT id FROM equipos WHERE owner_id = auth.uid())
  );

-- Helper function: returns user_ids of all active team members sharing a team with the caller
CREATE OR REPLACE FUNCTION get_equipo_user_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT me2.user_id
  FROM miembros_equipo me1
  JOIN miembros_equipo me2 ON me2.equipo_id = me1.equipo_id
  WHERE me1.user_id = auth.uid()
    AND me1.estado = 'activo'
    AND me2.estado = 'activo'
    AND me2.user_id IS NOT NULL
    AND me2.user_id != auth.uid()
  UNION
  -- Also include team owner's campaigns when I'm a member
  SELECT e.owner_id
  FROM equipos e
  JOIN miembros_equipo me ON me.equipo_id = e.id
  WHERE me.user_id = auth.uid() AND me.estado = 'activo'
    AND e.owner_id != auth.uid()
$$;

-- Update campaigns policy to allow team members to view shared campaigns
DROP POLICY IF EXISTS "usuarios ven sus campañas" ON campanas;

CREATE POLICY "campanas_select" ON campanas
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id IN (SELECT get_equipo_user_ids())
  );

CREATE POLICY "campanas_insert" ON campanas
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "campanas_update" ON campanas
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "campanas_delete" ON campanas
  FOR DELETE USING (user_id = auth.uid());

-- Update contacts policy similarly
DROP POLICY IF EXISTS "usuarios ven sus contactos" ON contactos;

CREATE POLICY "contactos_select" ON contactos
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id IN (SELECT get_equipo_user_ids())
  );

CREATE POLICY "contactos_insert" ON contactos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "contactos_update" ON contactos
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "contactos_delete" ON contactos
  FOR DELETE USING (user_id = auth.uid());
