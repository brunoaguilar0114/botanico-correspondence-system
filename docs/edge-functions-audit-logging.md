# Requerimientos de Audit Logging para Edge Functions

Este documento especifica los requerimientos de logging de auditoría para las Edge Functions de gestión de usuarios.

## Edge Functions Requeridas

Las siguientes Edge Functions deben implementar logging de auditoría:

1. **`create-user`** - Crear nuevos usuarios
2. **`update-user`** - Actualizar usuarios existentes
3. **`delete-user`** - Eliminar usuarios

## Implementación del Logging

Todas las Edge Functions deben llamar a la función RPC `log_audit_event()` después de realizar operaciones exitosas en la base de datos.

### Función RPC Disponible

```sql
log_audit_event(
  p_event_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'Exitoso'
) RETURNS UUID
```

Esta función:

- Obtiene automáticamente `user_id` desde el JWT del usuario autenticado
- Obtiene automáticamente `user_name` desde la tabla `profiles`
- Inserta el log en `audit_logs` con `is_legacy = FALSE`
- Retorna el UUID del log creado

### Ejemplo de Uso desde Edge Function

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Ejemplo: create-user
Deno.serve(async (req) => {
  const { email, password, role, fullName, phone } = await req.json();

  // ... crear usuario en auth.users y profiles ...

  // Después de crear exitosamente, loguear el evento
  const { data: logId, error: logError } = await supabase.rpc(
    "log_audit_event",
    {
      p_event_type: "CREATE",
      p_resource_type: "USER",
      p_resource_id: newUserId, // UUID del usuario creado
      p_details: `Usuario creado: ${fullName} (${email}) con rol ${role}`,
      p_status: "Exitoso",
    }
  );

  if (logError) {
    console.error("Error logging audit event:", logError);
    // No fallar la operación si el logging falla, pero registrar el error
  }

  return new Response(JSON.stringify({ success: true, userId: newUserId }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## Especificaciones por Edge Function

### 1. create-user

**Evento a loguear:**

- `event_type`: `'CREATE'`
- `resource_type`: `'USER'`
- `resource_id`: UUID del usuario creado
- `details`: `"Usuario creado: {fullName} ({email}) con rol {role}"`
- `status`: `'Exitoso'` (o `'Fallido'` si hay error)

**Cuándo loguear:**

- Después de crear exitosamente el usuario en `auth.users` y el perfil en `profiles`
- Si la creación falla, loguear con `status: 'Fallido'` y detalles del error

### 2. update-user

**Evento a loguear:**

- `event_type`: `'UPDATE'`
- `resource_type`: `'USER'`
- `resource_id`: UUID del usuario actualizado
- `details`: `"Usuario actualizado: {campos_cambiados} para {fullName} ({email})"`
- `status`: `'Exitoso'` (o `'Fallido'` si hay error)

**Detalles a incluir:**

- Listar los campos que cambiaron (nombre, email, teléfono, rol, estado)
- Ejemplo: `"Usuario actualizado: nombre, rol (cliente → admin) para Juan Pérez (juan@example.com)"`

**Cuándo loguear:**

- Después de actualizar exitosamente el perfil en `profiles`
- Si la actualización falla, loguear con `status: 'Fallido'`

**Nota:** Los cambios en `profiles` también son capturados automáticamente por el trigger `profile_audit_update`, pero el log desde la Edge Function proporciona contexto adicional sobre quién realizó el cambio (el super_admin que ejecutó la función).

### 3. delete-user

**Evento a loguear:**

- `event_type`: `'DELETE'`
- `resource_type`: `'USER'`
- `resource_id`: UUID del usuario eliminado
- `details`: `"Usuario eliminado: {fullName} ({email}) con rol {role}"`
- `status`: `'Exitoso'` (o `'Fallido'` si hay error)

**Cuándo loguear:**

- Antes o después de eliminar el usuario (recomendado: antes, para capturar los datos del usuario)
- Si la eliminación falla, loguear con `status: 'Fallido'`

## Manejo de Errores

- Si `log_audit_event()` falla, **NO** debe fallar la operación principal
- Registrar el error en los logs de la Edge Function: `console.error('Error logging audit event:', logError)`
- La operación de usuario (crear/actualizar/eliminar) debe completarse independientemente del resultado del logging

## Verificación

Para verificar que el logging funciona correctamente:

1. Ejecutar la Edge Function
2. Consultar la tabla `audit_logs`:
   ```sql
   SELECT * FROM audit_logs
   WHERE resource_type = 'USER'
   AND event_type IN ('CREATE', 'UPDATE', 'DELETE')
   ORDER BY created_at DESC
   LIMIT 10;
   ```
3. Verificar que:
   - `user_name` no es NULL (debe mostrar el nombre del super_admin que ejecutó la función)
   - `user_id` corresponde al super_admin autenticado
   - `details` contiene información relevante
   - `is_legacy` es `FALSE`

## Notas Importantes

- Las Edge Functions deben usar `SUPABASE_SERVICE_ROLE_KEY` para tener permisos completos
- El `user_id` y `user_name` en el log corresponderán al usuario que invocó la Edge Function (el super_admin), no al usuario que fue creado/actualizado/eliminado
- Los detalles del log deben incluir información sobre el usuario afectado para facilitar la auditoría
