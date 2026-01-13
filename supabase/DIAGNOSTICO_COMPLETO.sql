-- ============================================
-- DIAGNÓSTICO COMPLETO DEL SISTEMA DE AUDITORÍA
-- ============================================
-- Ejecuta este script completo en Supabase SQL Editor
-- Copia TODO el output y compártelo conmigo

-- 1. Verificar que la tabla audit_logs existe y tiene la estructura correcta
SELECT '=== ESTRUCTURA DE TABLA audit_logs ===' as info;
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;

-- 2. Verificar que la función RPC existe
SELECT '=== FUNCIÓN log_audit_event ===' as info;
SELECT
  routine_name,
  routine_type,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'log_audit_event';

-- 3. Verificar permisos de la función RPC
SELECT '=== PERMISOS DE FUNCIÓN ===' as info;
SELECT
  r.routine_name,
  p.grantee,
  p.privilege_type
FROM information_schema.routine_privileges p
JOIN information_schema.routines r ON r.specific_name = p.specific_name
WHERE r.routine_name = 'log_audit_event';

-- 4. Verificar que los triggers existen
SELECT '=== TRIGGERS INSTALADOS ===' as info;
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%audit%'
ORDER BY event_object_table, trigger_name;

-- 5. Verificar funciones de los triggers
SELECT '=== FUNCIONES DE TRIGGERS ===' as info;
SELECT
  routine_name,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%audit%'
  AND routine_type = 'FUNCTION';

-- 6. Verificar políticas RLS en audit_logs
SELECT '=== POLÍTICAS RLS EN audit_logs ===' as info;
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'audit_logs';

-- 7. Verificar últimos logs en audit_logs (todos, incluso legacy)
SELECT '=== ÚLTIMOS 10 LOGS ===' as info;
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
LIMIT 10;

-- 8. Contar logs por tipo
SELECT '=== CONTEO DE LOGS POR TIPO ===' as info;
SELECT
  event_type,
  resource_type,
  COUNT(*) as cantidad,
  MAX(created_at) as ultimo_registro
FROM audit_logs
GROUP BY event_type, resource_type
ORDER BY ultimo_registro DESC;

-- 9. Verificar si hay correspondencias en la tabla
SELECT '=== ÚLTIMAS 5 CORRESPONDENCIAS ===' as info;
SELECT
  id,
  recipient,
  status,
  created_at
FROM correspondence
ORDER BY created_at DESC
LIMIT 5;

-- 10. Probar la función RPC manualmente (esto debería crear un log)
SELECT '=== PRUEBA DE FUNCIÓN RPC ===' as info;
SELECT log_audit_event(
  'TEST',
  'AUTH',
  NULL,
  'Prueba manual de diagnóstico - ' || NOW()::TEXT
) as test_result;

-- 11. Verificar que se creó el log de prueba
SELECT '=== VERIFICAR LOG DE PRUEBA ===' as info;
SELECT *
FROM audit_logs
WHERE event_type = 'TEST'
ORDER BY created_at DESC
LIMIT 1;
