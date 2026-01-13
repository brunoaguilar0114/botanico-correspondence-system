-- Add column with default false
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS is_legacy BOOLEAN DEFAULT FALSE;

DO $$
BEGIN
    -- Try to update based on user_name if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_name') THEN
        UPDATE audit_logs 
        SET is_legacy = TRUE 
        WHERE user_name IS NULL;
    ELSE
        -- Fallback: if user_name doesn't exist, maybe user_id is the key?
        -- Or maybe we just can't backfill correctly yet.
        -- Let's assume user_id is null for legacy logs too.
        UPDATE audit_logs 
        SET is_legacy = TRUE 
        WHERE user_id IS NULL;
    END IF;
END $$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_is_legacy ON audit_logs(is_legacy);
