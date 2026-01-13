-- Create RPC function for audit logging that automatically gets user_name from profiles
-- This ensures server-side enforcement and prevents missing user_name values

CREATE OR REPLACE FUNCTION log_audit_event(
  p_event_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'Exitoso'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_log_id UUID;
BEGIN
  -- Get current user from JWT
  v_user_id := auth.uid();
  
  -- Get user_name from profiles if user exists
  IF v_user_id IS NOT NULL THEN
    SELECT full_name INTO v_user_name
    FROM profiles
    WHERE id = v_user_id;
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    event_type,
    resource_type,
    resource_id,
    details,
    user_id,
    user_name,
    status,
    is_legacy
  ) VALUES (
    p_event_type,
    p_resource_type,
    p_resource_id,
    p_details,
    v_user_id,
    COALESCE(v_user_name, 'Sistema'),
    p_status,
    FALSE
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event TO service_role;

