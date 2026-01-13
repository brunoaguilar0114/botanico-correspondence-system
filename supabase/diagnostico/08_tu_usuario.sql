-- 8. Verificar tu usuario y rol actual
SELECT
  auth.uid() as mi_user_id,
  p.full_name,
  p.email,
  p.role,
  CASE
    WHEN p.role = 'super_admin' THEN 'SI - Puedes ver logs'
    ELSE 'NO - Solo super_admin puede ver logs'
  END as puede_ver_logs
FROM profiles p
WHERE p.id = auth.uid();
