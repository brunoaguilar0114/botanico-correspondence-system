# Configuración del Sistema de Auditoría

Este documento explica cómo configurar y verificar que el sistema de auditoría esté funcionando correctamente.

## Problema Común

Si el Historial Log solo muestra acciones de perfil o no muestra ninguna acción, es probable que **las migraciones no se hayan ejecutado** en la base de datos de Supabase.

## Pasos para Solucionar

### 1. Aplicar las Migraciones en Supabase

Las migraciones deben ejecutarse en el siguiente orden en el SQL Editor de Supabase:

1. **001_create_audit_rpc_function.sql** - Crea la función RPC para logging
2. **002_create_correspondence_triggers.sql** - Crea triggers para correspondencia
3. **003_create_profile_triggers.sql** - Crea triggers para perfiles
4. **004_fix_audit_rls_policies.sql** - Corrige las políticas RLS
5. **005_fix_triggers_permissions.sql** - **IMPORTANTE**: Mejora permisos y manejo de errores
6. **006_test_audit_triggers.sql** - Script de diagnóstico (opcional)

### 2. Verificar que los Triggers Estén Instalados

Ejecuta este query en el SQL Editor de Supabase:

```sql
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%audit%'
ORDER BY event_object_table, trigger_name;
```

Deberías ver:
- `correspondence_audit_insert`
- `correspondence_audit_update`
- `correspondence_audit_delete`
- `profile_audit_update`

### 3. Verificar que la Función RPC Exista

```sql
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'log_audit_event';
```

Deberías ver una función con `security_type = 'DEFINER'`.

### 4. Probar la Función RPC Manualmente

Ejecuta este query (debes estar autenticado como super_admin):

```sql
SELECT log_audit_event('TEST', 'AUTH', NULL, 'Test manual de función RPC');
```

Luego verifica que se creó el log:

```sql
SELECT * FROM audit_logs 
WHERE event_type = 'TEST' 
ORDER BY created_at DESC 
LIMIT 1;
```

### 5. Verificar Políticas RLS

```sql
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'audit_logs';
```

Deberías ver:
- Una política de SELECT solo para super_admin
- Una política de INSERT para todos los autenticados

### 6. Probar los Triggers

#### Probar Trigger de Correspondencia (INSERT):

1. Crea una nueva correspondencia desde la UI
2. Verifica el log:

```sql
SELECT * FROM audit_logs 
WHERE resource_type = 'CORRESPONDENCE' 
AND event_type = 'CREATE'
ORDER BY created_at DESC 
LIMIT 5;
```

#### Probar Trigger de Perfil (UPDATE):

1. Actualiza tu perfil desde Settings
2. Verifica el log:

```sql
SELECT * FROM audit_logs 
WHERE resource_type = 'USER' 
AND event_type = 'UPDATE'
ORDER BY created_at DESC 
LIMIT 5;
```

### 7. Verificar Logs Recientes

```sql
SELECT 
  event_type,
  resource_type,
  details,
  user_name,
  created_at
FROM audit_logs
WHERE is_legacy = false
ORDER BY created_at DESC
LIMIT 20;
```

## Solución de Problemas

### Problema: No se crean logs al crear correspondencia

**Causas posibles:**
1. Los triggers no están instalados
2. La función RPC no tiene permisos
3. Error silencioso en los triggers

**Solución:**
1. Ejecuta la migración `005_fix_triggers_permissions.sql`
2. Verifica los logs de PostgreSQL en Supabase Dashboard → Logs
3. Revisa la consola del navegador para errores

### Problema: No se crean logs al actualizar perfil

**Causas posibles:**
1. El trigger de profiles no está instalado
2. El campo que cambiaste no está siendo detectado por el trigger

**Solución:**
1. Verifica que el trigger `profile_audit_update` exista
2. Asegúrate de cambiar campos importantes (nombre, teléfono, email, etc.)

### Problema: Los logs se crean pero no aparecen en la UI

**Causas posibles:**
1. El usuario no es super_admin
2. Las políticas RLS están bloqueando la lectura
3. El filtro de fecha está ocultando los logs

**Solución:**
1. Verifica que tu usuario tenga rol `super_admin` en la tabla `profiles`
2. Verifica las políticas RLS con el query de la sección 5
3. Cambia el filtro a "Todos" en la UI

### Problema: Los logs muestran "Sistema" en lugar del nombre del usuario

**Causa:**
La función RPC no puede obtener el `user_name` desde `profiles`.

**Solución:**
1. Verifica que el usuario tenga un perfil en la tabla `profiles`
2. Verifica que el campo `full_name` esté lleno en `profiles`
3. La función RPC debería obtenerlo automáticamente

## Verificación Final

Después de aplicar todas las migraciones, deberías poder:

1. ✅ Crear correspondencia → Ver log de CREATE en Historial Log
2. ✅ Actualizar correspondencia → Ver log de UPDATE en Historial Log
3. ✅ Cambiar estado de correspondencia → Ver log de STATUS_CHANGE en Historial Log
4. ✅ Eliminar correspondencia → Ver log de DELETE en Historial Log
5. ✅ Actualizar perfil → Ver log de UPDATE (USER) en Historial Log
6. ✅ Hacer login → Ver log de LOGIN en Historial Log
7. ✅ Solo super_admin puede ver el Historial Log

## Notas Importantes

- **Las migraciones deben ejecutarse en orden**
- **La migración 005 es crítica** - mejora los permisos y el manejo de errores
- **Los triggers funcionan automáticamente** - no necesitas código adicional en el cliente
- **Los errores de triggers se registran como WARNING** en los logs de PostgreSQL pero no fallan la operación principal

