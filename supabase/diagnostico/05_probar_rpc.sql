-- 5. Probar la función RPC manualmente (esto DEBE crear un log)
SELECT log_audit_event(
  'TEST',
  'AUTH',
  NULL,
  'Prueba manual de diagnóstico'
) as resultado_prueba;
