# Configuración de Sistema de Notificaciones por Email

## Checklist de Verificación

### 1. ✅ Verificar que la Edge Function esté desplegada

Ve a: https://app.supabase.com/project/afnwfaqudyonmpjuqnej/functions

**Debes ver:**
- ✅ Función `notify-correspondence` desplegada
- ✅ Estado: `Deployed` (verde)
- ✅ Versión reciente

**Si NO está desplegada:**
```bash
cd supabase/functions
supabase functions deploy notify-correspondence
```

### 2. ✅ Configurar API Key de Resend en Supabase

Ve a: https://app.supabase.com/project/afnwfaqudyonmpjuqnej/settings/secrets

**Debes agregar:**
- **Nombre:** `RESEND_API_KEY`
- **Valor:** Tu API Key de Resend (comienza con `re_`)

**Cómo obtener tu API Key de Resend:**
1. Ve a https://resend.com/api-keys
2. Crea un nuevo API Key
3. Copia el valor (ejemplo: `re_123abc456def...`)
4. Pégalo en Supabase Secrets

### 3. ✅ Verificar el Dominio de Email

**Opción A: Usar dominio de prueba (más rápido)**
En la línea 128 de `notify-correspondence/index.ts`, cambia:
```typescript
from: 'onboarding@resend.dev',  // Dominio de prueba de Resend
```

**Opción B: Verificar tu dominio personalizado**
1. Ve a https://resend.com/domains
2. Agrega `botanico.space`
3. Configura los registros DNS (TXT, MX, CNAME)
4. Espera verificación (puede tardar 24-48 horas)
5. Usa: `from: 'Botánico Coworking <notificaciones@botanico.space>'`

### 4. ✅ Verificar la Base de Datos

**Ejecutar script de diagnóstico:**
```sql
-- Ver en supabase/DIAGNOSTICO_EMAIL.sql
```

**Lo que debes verificar:**
- [ ] Existe la columna `email_status` en `correspondence`
- [ ] Existen valores: PENDING, SENT, FAILED
- [ ] Las correspondencias tienen `recipient_email` válido
- [ ] Los perfiles tienen `email` o `notification_email` configurado

### 5. ✅ Probar el Envío de Email

**Desde la aplicación:**
1. Crea una nueva correspondencia
2. Marca el checkbox "Notificar por email"
3. Completa el formulario con un email REAL tuyo
4. Haz click en "Crear"

**Debes ver:**
- ✅ Toast: "Enviando notificación..."
- ✅ Toast: "Notificación enviada" (si tiene éxito)
- ❌ Toast con error específico (si falla)

**En la consola del navegador (F12):**
- Busca errores relacionados con `notify-correspondence`
- Verifica el payload enviado a la Edge Function

**En Supabase Logs:**
Ve a: https://app.supabase.com/project/afnwfaqudyonmpjuqnej/logs/edge-functions

**Debes ver:**
- Logs de la función `notify-correspondence`
- Si hay errores, aparecerán aquí con detalles

### 6. ✅ Verificar que llegó el Email

**En tu bandeja de entrada:**
- Revisa la carpeta principal
- Revisa spam/correo no deseado
- Busca: "Nueva Correspondencia" o "Botánico Coworking"

**Si usas `onboarding@resend.dev`:**
- Solo puedes enviar a tu propio email registrado en Resend
- No funciona con emails aleatorios (limitación de sandbox)

## Errores Comunes y Soluciones

### Error: "Missing API Key"
**Causa:** `RESEND_API_KEY` no está configurado en Supabase Secrets
**Solución:** Agregar el secret en Supabase Dashboard

### Error: "Failed to send a request"
**Causa:** La Edge Function no está desplegada o no existe
**Solución:** Desplegar la función con `supabase functions deploy`

### Error: "Domain not verified"
**Causa:** El dominio `botanico.space` no está verificado en Resend
**Solución:** Usar `onboarding@resend.dev` temporalmente o verificar el dominio

### Error: "Invalid email address"
**Causa:** El campo `recipient_email` está vacío o es inválido
**Solución:** Verificar que los perfiles tengan emails válidos

### El email no llega
**Posibles causas:**
1. Está en spam (revisa)
2. El email está mal escrito
3. Usas `onboarding@resend.dev` pero no es tu email registrado en Resend
4. El dominio no está verificado en Resend

## Flujo Completo (Resumen)

```
1. Usuario crea correspondencia con "Notificar por email" ✓
2. Frontend llama a correspondenceService.notifyCorrespondence()
3. Backend busca email del destinatario (prioridad: notification_email > profile.email > recipient_email)
4. Backend invoca Edge Function notify-correspondence
5. Edge Function llama a Resend API con template HTML
6. Resend envía el email
7. Backend actualiza email_status a 'SENT'
8. Frontend muestra "Notificación enviada"
9. Cliente recibe email con diseño premium
10. Cliente hace click en "Abrir Dashboard"
11. Cliente ve su perfil con correspondencia
```

## Próximos Pasos Sugeridos

1. **Testing completo:**
   - Probar con emails reales
   - Verificar que el link al dashboard funcione
   - Revisar el diseño del email en diferentes clientes (Gmail, Outlook, Apple Mail)

2. **Monitoreo:**
   - Revisar Supabase Edge Function Logs regularmente
   - Configurar alertas en Resend para bounces/spam
   - Implementar retry logic para emails fallidos

3. **Mejoras futuras:**
   - Notificaciones por SMS (Twilio)
   - Notificaciones push en navegador
   - Plantillas de email personalizables por tipo de correspondencia
   - Resumen diario de correspondencia pendiente
