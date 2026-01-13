-- 3. Verificar que existen los triggers
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%audit%'
ORDER BY event_object_table, trigger_name;
