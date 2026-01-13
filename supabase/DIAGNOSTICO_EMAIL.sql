-- ============================================
-- DIAGNÓSTICO COMPLETO: Sistema de Notificaciones por Email
-- ============================================

-- 1. Verificar estructura de la tabla correspondence
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'correspondence'
  AND column_name IN ('email_status', 'recipient_email', 'recipient_id', 'recipient', 'sender', 'type', 'date', 'time')
ORDER BY ordinal_position;

-- 2. Verificar que existe el tipo EmailStatus
SELECT
  n.nspname as enum_schema,
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname LIKE '%email%'
ORDER BY t.typname, e.enumsortorder;

-- 3. Ver las últimas correspondencias y su estado de email
SELECT
  id,
  recipient,
  recipient_email,
  sender,
  type,
  email_status,
  created_at
FROM correspondence
ORDER BY created_at DESC
LIMIT 10;

-- 4. Contar correspondencias por estado de email
SELECT
  email_status,
  COUNT(*) as cantidad
FROM correspondence
GROUP BY email_status;

-- 5. Verificar que existen perfiles con emails configurados
SELECT
  id,
  full_name,
  email,
  notification_email,
  email_notifications,
  role
FROM profiles
WHERE email IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 6. Verificar si hay correspondencias con recipient_id válidos
SELECT
  c.id,
  c.recipient,
  c.recipient_email,
  c.recipient_id,
  p.full_name as profile_name,
  p.email as profile_email,
  p.notification_email as profile_notification_email
FROM correspondence c
LEFT JOIN profiles p ON c.recipient_id = p.id
ORDER BY c.created_at DESC
LIMIT 10;
