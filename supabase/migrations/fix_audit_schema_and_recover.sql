-- 1. Ensure user_name column exists (was missing)
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- 2. Recover user names from profiles table for existing logs
-- This matches audit_logs.user_id with profiles.id
UPDATE audit_logs al
SET user_name = p.full_name
FROM profiles p
WHERE al.user_id = p.id 
  AND al.user_name IS NULL;

-- 3. Mark anything that STILL has no user_name as legacy (true broken/system logs)
UPDATE audit_logs 
SET is_legacy = TRUE 
WHERE user_name IS NULL;

-- 4. Ensure recovered logs are visible (not legacy)
UPDATE audit_logs 
SET is_legacy = FALSE 
WHERE user_name IS NOT NULL;
