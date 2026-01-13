-- Verificar el código de las funciones de los triggers
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%correspondence%'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
