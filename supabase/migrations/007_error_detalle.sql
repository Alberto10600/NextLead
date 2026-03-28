-- Add error_detalle to contactos to store the reason for failed sends
ALTER TABLE contactos ADD COLUMN IF NOT EXISTS error_detalle text;
