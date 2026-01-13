-- Verificar tu rol y que puedas ver los logs
SELECT
  p.full_name,
  p.email,
  p.role,
  CASE
    WHEN p.role = 'super_admin' THEN 'SI - Tienes acceso total'
    WHEN p.role = 'admin' THEN 'PARCIAL - Solo algunos logs'
    ELSE 'NO - Necesitas ser super_admin'
  END as acceso_historial_log
FROM profiles p
WHERE p.id = auth.uid();
