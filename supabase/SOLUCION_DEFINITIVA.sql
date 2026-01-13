-- ============================================
-- SOLUCIÓN DEFINITIVA: Alinear tabla audit_logs
-- ============================================
-- Este script corrige el conflicto entre campos antiguos y nuevos

-- PASO 1: Hacer que los campos antiguos sean opcionales (no obligatorios)
ALTER TABLE audit_logs
  ALTER COLUMN action DROP NOT NULL,
  ALTER COLUMN entity_type DROP NOT NULL;

-- PASO 2: Hacer que los campos nuevos sean obligatorios
ALTER TABLE audit_logs
  ALTER COLUMN event_type SET NOT NULL,
  ALTER COLUMN resource_type SET NOT NULL;

-- PASO 3: Establecer valores por defecto para campos nuevos
ALTER TABLE audit_logs
  ALTER COLUMN event_type SET DEFAULT 'UNKNOWN',
  ALTER COLUMN resource_type SET DEFAULT 'UNKNOWN';

-- PASO 4: Recrear la función RPC con la estructura correcta
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
SET search_path = public
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

  -- Insert audit log con TODOS los campos necesarios
  INSERT INTO audit_logs (
    event_type,
    resource_type,
    resource_id,
    details,
    user_id,
    user_name,
    status,
    is_legacy,
    action,        -- Campo antiguo, lo llenamos también
    entity_type    -- Campo antiguo, lo llenamos también
  ) VALUES (
    p_event_type,
    p_resource_type,
    p_resource_id::TEXT,  -- Convertir UUID a TEXT
    p_details,
    v_user_id,
    COALESCE(v_user_name, 'Sistema'),
    p_status,
    FALSE,
    p_event_type,        -- Mapear a campo antiguo
    p_resource_type      -- Mapear a campo antiguo
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero no fallar el trigger
    RAISE WARNING 'Error en log_audit_event: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NULL;
END;
$$;

-- PASO 5: Asegurar permisos
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event TO service_role;
GRANT EXECUTE ON FUNCTION log_audit_event TO anon;

-- PASO 6: Verificar que funcionó
SELECT log_audit_event(
  'TEST',
  'AUTH',
  NULL,
  'Prueba después de corrección'
) as resultado;

-- PASO 7: Verificar que se creó el log
SELECT
  id,
  event_type,
  resource_type,
  details,
  user_name,
  created_at
FROM audit_logs
WHERE event_type = 'TEST'
  AND details LIKE '%después de corrección%'
ORDER BY created_at DESC
LIMIT 1;
