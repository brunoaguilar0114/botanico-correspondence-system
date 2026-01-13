-- 2. Verificar que existe la función log_audit_event
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'log_audit_event';
