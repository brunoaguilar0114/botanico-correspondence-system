-- 7. Verificar políticas RLS en audit_logs
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'audit_logs';
