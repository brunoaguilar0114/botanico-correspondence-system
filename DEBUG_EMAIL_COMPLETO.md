# 🔍 DEBUG COMPLETO: Sistema de Emails

## PASO 1: Verificar Logs de la Edge Function

1. Ve a: **https://app.supabase.com/project/afnwfaqudyonmpjuqnej/logs/edge-functions**
2. Filtra por: `notify-correspondence`
3. Busca el error más reciente
4. **Copia el mensaje de error completo** y compártelo

**Errores comunes que verás:**
- `CRITICAL: RESEND_API_KEY is not set` → El secret no está configurado
- `Domain not verified` → Problema con el dominio
- `Invalid API Key` → La API Key es incorrecta
- `Unauthorized` → La API Key no tiene permisos

## PASO 2: Verificar que el Secret está configurado

1. Ve a: **https://app.supabase.com/project/afnwfaqudyonmpjuqnej/settings/secrets**
2. Busca `RESEND_API_KEY` en la lista
3. ¿Aparece en la lista?
   - **SÍ** → Continúa al Paso 3
   - **NO** → Vuelve a agregarlo (ver instrucciones abajo)

### Si necesitas agregar el Secret:
- Name: `RESEND_API_KEY`
- Value: Tu API Key de Resend (ejemplo: `re_abc123...`)
- Click "Save"

## PASO 3: Redesplegar la Edge Function

**ESTO ES CRÍTICO**: Los Secrets solo se cargan cuando despliegas la función.

### Opción A: Desde Dashboard (Recomendado)
1. Ve a: **https://app.supabase.com/project/afnwfaqudyonmpjuqnej/functions**
2. Busca `notify-correspondence`
3. Click en los tres puntos (⋮) al lado de la función
4. Click en **"Redeploy"**
5. Espera a que termine el despliegue (estado debe ser "Deployed")

### Opción B: Desde CLI
```bash
cd "/Users/brunoaguilar/Downloads/botanico-correspondence-system (1)"
supabase functions deploy notify-correspondence --project-ref afnwfaqudyonmpjuqnej
```

## PASO 4: Verificar la API Key de Resend

1. Ve a: **https://resend.com/api-keys**
2. Verifica que tu API Key:
   - ✅ Esté activa (no revocada)
   - ✅ Tenga permisos de "Sending access"
   - ✅ Sea la misma que copiaste en Supabase Secrets

Si tienes dudas, **crea una nueva API Key** y actualiza el Secret.

## PASO 5: Probar con Console del Navegador

1. Abre tu app
2. Abre la consola del navegador (F12)
3. Ve a la pestaña "Network"
4. Intenta enviar una notificación
5. Busca la petición a `notify-correspondence`
6. Click en la petición y ve a la pestaña "Response"
7. **Copia el error completo** que aparece

## PASO 6: Probar la Edge Function directamente

Ejecuta este comando en tu terminal para probar la función manualmente:

```bash
curl -i --location --request POST 'https://afnwfaqudyonmpjuqnej.supabase.co/functions/v1/notify-correspondence' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmbndmYXF1ZHlvbm1wanVxbmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTY2OTUsImV4cCI6MjA3OTY3MjY5NX0.DSucRJshbExhgqC_8kPWhhcsr5Q-NbWJEO_p8CNYp_k' \
  --header 'Content-Type: application/json' \
  --data '{
    "recipientName": "Test User",
    "recipientEmail": "brunoaguilar95@gmail.com",
    "senderName": "Amazon",
    "type": "Paquete",
    "date": "13/01/2026",
    "time": "22:00",
    "dashboardUrl": "https://botanico-correspondence-system.vercel.app"
  }'
```

**Resultado esperado:**
- ✅ Status 200 + `{"id":"..."}`  → Funciona correctamente
- ❌ Status 500 + Error → Hay un problema (copia el error completo)

## CHECKLIST DE VERIFICACIÓN

Marca cada item:

- [ ] La función `notify-correspondence` está desplegada en Supabase
- [ ] El secret `RESEND_API_KEY` existe en Supabase Secrets
- [ ] La API Key es válida y está activa en Resend
- [ ] Redesplegaste la función DESPUÉS de agregar el secret
- [ ] El email de prueba es el mismo con el que te registraste en Resend
- [ ] Revisaste los logs de Edge Functions en Supabase

## ERRORES COMUNES Y SOLUCIONES

### Error: "RESEND_API_KEY is not set"
**Causa:** El secret no está configurado O no se redesplegó la función
**Solución:**
1. Verifica que el secret exista en Settings > Secrets
2. Redesplega la función (Paso 3)

### Error: "Domain not verified"
**Causa:** Estás usando un dominio no verificado
**Solución:** Ya deberías estar usando `onboarding@resend.dev` en el código

### Error: "Invalid recipient"
**Causa:** Con `onboarding@resend.dev`, solo puedes enviar al email registrado en Resend
**Solución:** Verifica que el `notification_email` del cliente sea el mismo email con el que te registraste en Resend

### Error: "Failed to send a request"
**Causa:** La función no puede conectarse con Resend
**Solución:** Verifica que la API Key sea correcta y esté activa

## INFORMACIÓN ADICIONAL PARA DEBUG

Si el problema persiste, necesito que me proporciones:

1. ✅ Captura de pantalla de los Secrets en Supabase (censura el valor de la key)
2. ✅ El mensaje de error completo de los logs de Edge Functions
3. ✅ La respuesta del comando curl del Paso 6
4. ✅ El error de la consola del navegador (Network tab)

Con esta información podré darte la solución exacta.
