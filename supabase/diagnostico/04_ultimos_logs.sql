-- 4. Ver últimos 20 logs (sin filtro de is_legacy)
SELECT
  id,
  event_type,
  resource_type,
  details,
  user_name,
  is_legacy,
  created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;
