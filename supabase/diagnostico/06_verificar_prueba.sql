-- 6. Verificar que se creó el log de prueba
SELECT *
FROM audit_logs
WHERE event_type = 'TEST'
  AND details LIKE '%Prueba manual%'
ORDER BY created_at DESC
LIMIT 1;
