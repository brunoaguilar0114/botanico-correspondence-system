-- Ejecuta esto para verificar tu usuario y rol actual
-- Esto te dirá si tienes permisos de super_admin para ver los logs

SELECT
  auth.uid() as mi_user_id,
  p.full_name,
  p.email,
  p.role,
  CASE
    WHEN p.role = 'super_admin' THEN '✅ Puedes ver logs'
    ELSE '❌ NO puedes ver logs (solo super_admin)'
  END as puede_ver_logs
FROM profiles p
WHERE p.id = auth.uid();
