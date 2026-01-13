-- Verificar que se crearon logs de correspondencia
SELECT
  event_type,
  resource_type,
  details,
  user_name,
  created_at
FROM audit_logs
WHERE resource_type = 'CORRESPONDENCE'
ORDER BY created_at DESC
LIMIT 5;
