-- Test script to verify triggers are working
-- Run this after applying migrations to check if audit logging is functioning

-- Test 1: Check if triggers exist
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%audit%'
ORDER BY event_object_table, trigger_name;

-- Test 2: Check if RPC function exists and has correct permissions
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'log_audit_event';

-- Test 3: Test the RPC function directly (should work if you're authenticated)
-- Uncomment and run this manually to test:
-- SELECT log_audit_event('TEST', 'AUTH', NULL, 'Test de función RPC desde migración');

-- Test 4: Check recent audit logs
SELECT 
  event_type,
  resource_type,
  details,
  user_name,
  created_at
FROM audit_logs
WHERE is_legacy = false
ORDER BY created_at DESC
LIMIT 10;

-- Test 5: Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'audit_logs';

