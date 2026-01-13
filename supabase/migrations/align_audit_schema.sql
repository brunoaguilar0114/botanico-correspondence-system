-- 1. Add missing columns expected by the application
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS resource_type TEXT,
ADD COLUMN IF NOT EXISTS resource_id TEXT,
ADD COLUMN IF NOT EXISTS details TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Exitoso';

-- 2. Backfill data from legacy columns (action, entity_type) to new columns
-- Only if the new columns are empty/null
UPDATE audit_logs 
SET 
  event_type = action,
  resource_type = entity_type,
  resource_id = entity_id::text,
  details = COALESCE(details, 'Evento registrado: ' || action || ' en ' || entity_type),
  status = COALESCE(status, 'Exitoso')
WHERE event_type IS NULL 
  AND action IS NOT NULL;
