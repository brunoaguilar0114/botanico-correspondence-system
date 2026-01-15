# ⚠️ ERROR: Falta configurar RESEND_API_KEY

El error que estás viendo indica que la Edge Function no puede conectarse con Resend.

## CAUSA PRINCIPAL:
El secret `RESEND_API_KEY` **NO está configurado** en Supabase.

## SOLUCIÓN (5 minutos):

### PASO 1: Obtener API Key de Resend

#### 1.1 ¿Ya tienes cuenta en Resend?

**SI ya tienes cuenta:**
1. Ve a: https://resend.com/api-keys
2. Copia una API Key existente O crea una nueva

**NO tengo cuenta todavía:**
1. Ve a: https://resend.com/signup
2. Regístrate con tu email
3. Verifica tu email
4. Ve a: https://resend.com/api-keys
5. Click en "Create API Key"
6. Nombre: `Botanico Production`
7. **COPIA LA KEY** (empieza con `re_...`) ⚠️ Solo se muestra una vez

### PASO 2: Configurar el Secret en Supabase

1. Ve a: **https://app.supabase.com/project/afnwfaqudyonmpjuqnej/settings/secrets**

2. Click en **"Add new secret"**

3. Ingresa:
   - **Name:** `RESEND_API_KEY`
   - **Value:** Pega tu API Key de Resend (ejemplo: `re_abc123def456...`)

4. Click en **"Save"**

5. **IMPORTANTE:** Después de guardar, **redesplegar la función** para que tome el nuevo secret:
   - Ve a: https://app.supabase.com/project/afnwfaqudyonmpjuqnej/functions
   - Click en `notify-correspondence`
   - Click en el botón de opciones (⋮)
   - Click en "Redeploy"

### PASO 3: Probar de nuevo

1. Recarga tu aplicación (F5)
2. Crea una nueva correspondencia
3. Marca "Notificar por email"
4. El error debería desaparecer

## VERIFICACIÓN RÁPIDA:

Para confirmar que el secret está configurado:
1. Ve a: https://app.supabase.com/project/afnwfaqudyonmpjuqnej/settings/secrets
2. Busca `RESEND_API_KEY` en la lista
3. Si NO aparece → Sigue el Paso 2
4. Si SÍ aparece → Haz el redespliegue (Paso 2.5)

## OTROS ERRORES POSIBLES:

Si después de configurar el secret sigue fallando:

### Error: "Domain not verified"
- Causa: Estás usando un dominio no verificado
- Solución: La función ya usa `onboarding@resend.dev` (sandbox), esto no debería pasar

### Error: "Invalid API Key"
- Causa: La API Key está mal copiada o es inválida
- Solución: Copia de nuevo la API Key de Resend y actualiza el secret

### Error: "Unauthorized"
- Causa: La API Key no tiene permisos de envío
- Solución: Crea una nueva API Key con permisos de "Sending access"
