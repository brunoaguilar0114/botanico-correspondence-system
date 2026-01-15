# 🚀 Setup Completo: Sistema de Notificaciones por Email

Este documento te guiará paso a paso para activar completamente el sistema de notificaciones.

**Dominio de producción:** `botanico.slupu.dev`

---

## PASO 1: Crear Cuenta en Resend (5 minutos)

### 1.1 Registrarse en Resend

1. Ve a: **https://resend.com/signup**
2. Regístrate con tu email
3. Verifica tu email
4. Completa el onboarding

### 1.2 Obtener API Key

1. Ve a: **https://resend.com/api-keys**
2. Click en **"Create API Key"**
3. Nombre: `Botanico Production`
4. Permisos: Selecciona **"Sending access"**
5. Click en **"Create"**
6. **COPIA LA API KEY** (empieza con `re_...`) - ⚠️ Solo se muestra una vez

Ejemplo: `re_123abc456def789ghi012jkl345mno678`

---

## PASO 2: Configurar API Key en Supabase (2 minutos)

### 2.1 Ir a Secrets

1. Ve a: **https://app.supabase.com/project/afnwfaqudyonmpjuqnej/settings/secrets**
2. Click en **"Add new secret"**

### 2.2 Crear el Secret

- **Name:** `RESEND_API_KEY`
- **Value:** Pega tu API Key de Resend (el valor que copiaste en el paso 1.2)
- Click en **"Save"**

✅ Verifica que aparezca en la lista de secrets

---

## PASO 3: Verificar Dominio en Resend (10-15 minutos)

Este paso es **obligatorio** para enviar emails a cualquier destinatario.

### 3.1 Agregar Subdominio

1. Ve a: **https://resend.com/domains**
2. Click en **"Add Domain"**
3. Ingresa: `botanico.slupu.dev`
4. Click en **"Add"**

### 3.2 Configurar Registros DNS

Resend te mostrará los registros DNS que debes agregar. Ve a tu panel DNS (Cloudflare, GoDaddy, Namecheap, etc.) y agrega:

| Tipo | Nombre/Host | Valor | TTL |
|------|-------------|-------|-----|
| **TXT** | `botanico` | (valor proporcionado por Resend) | Auto |
| **CNAME** | `resend._domainkey.botanico` | (valor proporcionado por Resend) | Auto |

> **Nota:** Los valores exactos los proporciona Resend al agregar el dominio. Copia exactamente lo que te muestre. El "Host" puede variar según tu proveedor DNS.

### 3.3 Verificar el Subdominio

1. Después de agregar los registros DNS, vuelve a Resend
2. Click en **"Verify"** junto a tu dominio
3. Si los registros están correctos, verás ✅ **Verified**
4. Si no, espera unos minutos (la propagación DNS puede tardar hasta 48 horas, pero usualmente es instantánea)

### 3.4 (Opcional) Verificar SPF para mejor entregabilidad

Agrega este registro TXT adicional para evitar que tus emails lleguen a spam:

| Tipo | Nombre/Host | Valor |
|------|-------------|-------|
| **TXT** | `botanico` | `v=spf1 include:resend.com ~all` |

---

## PASO 4: Desplegar Edge Function (3 minutos)

### OPCIÓN A: Desde Supabase Dashboard (Más Fácil)

1. Ve a: **https://app.supabase.com/project/afnwfaqudyonmpjuqnej/functions**
2. Si ya existe `notify-correspondence`:
   - Click en los tres puntos (⋮)
   - Click en **"Redeploy"**
3. Si no existe:
   - Click en **"Deploy a new function"**
   - Sube el código desde `supabase/functions/notify-correspondence`

### OPCIÓN B: Desde Terminal (Avanzado)

```bash
# 1. Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# 2. Login en Supabase
supabase login

# 3. Ir al proyecto
cd /ruta/a/tu/proyecto

# 4. Desplegar la función
supabase functions deploy notify-correspondence --project-ref afnwfaqudyonmpjuqnej
```

### 4.3 Verificar el Despliegue

1. Ve a: **https://app.supabase.com/project/afnwfaqudyonmpjuqnej/functions**
2. Deberías ver **`notify-correspondence`** en la lista
3. Estado debe ser **"Deployed"** (verde)

---

## PASO 5: Probar el Sistema (5 minutos)

### 5.1 Crear una Correspondencia de Prueba

1. Abre tu aplicación: **https://botanico.slupu.dev**
2. Inicia sesión como recepcionista o admin
3. Ve a la sección de correspondencia
4. Click en **"Nueva Correspondencia"**

### 5.2 Llenar el Formulario

- **Destinatario:** Selecciona un cliente existente
- **Email:** Verifica que sea correcto
- **Remitente:** Escribe cualquier nombre (ej: "Amazon")
- **Tipo:** Selecciona cualquiera (Carta, Paquete, etc.)
- ✅ **Marca el checkbox "Notificar por email"**
- Click en **"Crear"**

### 5.3 Verificar el Resultado

**En la aplicación:**
- Deberías ver un toast: **"Enviando notificación..."**
- Luego: **"Notificación enviada"** ✅ (si tiene éxito)
- O un error específico ❌ (si falla)

**En el email del destinatario:**
- Revisa la bandeja de entrada
- Si no está, revisa **Spam/Correo no deseado**
- Busca: "Nueva Correspondencia" o "Botánico Coworking"

---

## PASO 6: Verificar Logs (Si hay problemas)

### 6.1 Ver Logs de Edge Functions

1. Ve a: **https://app.supabase.com/project/afnwfaqudyonmpjuqnej/logs/edge-functions**
2. Filtra por: `notify-correspondence`
3. Revisa si hay errores

### 6.2 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Missing API Key" | Secret no configurado | Verifica Paso 2 |
| "Domain not verified" | Dominio no verificado en Resend | Completa Paso 3 |
| "Failed to send a request" | Función no desplegada | Verifica Paso 4 |
| "Invalid email address" | Email vacío o mal formado | Verifica que el perfil tenga `notification_email` |

### 6.3 Consola del Navegador

Abre la consola (F12) y busca:
- Errores relacionados con `notify-correspondence`
- El payload enviado a la función
- La respuesta recibida

---

## ✅ CHECKLIST FINAL

- [ ] Cuenta en Resend creada
- [ ] API Key obtenida y copiada
- [ ] Secret `RESEND_API_KEY` configurado en Supabase
- [ ] Subdominio `botanico.slupu.dev` verificado en Resend
- [ ] Edge Function `notify-correspondence` desplegada
- [ ] Prueba de envío realizada
- [ ] Email recibido en bandeja de entrada

---

## 📧 Configuración de Email

El sistema enviará emails desde:
- **Dirección:** `notificaciones@botanico.slupu.dev`
- **Nombre:** Botánico Coworking
- **Reply-to:** `info@botanico.slupu.dev`

---

## 🎨 Vista Previa del Email

El email que recibirán los clientes tiene este diseño:

```
╔════════════════════════════════════╗
║   BOTÁNICO COWORKING               ║
║   Nueva Correspondencia            ║
╠════════════════════════════════════╣
║                                    ║
║   ¡Hola, [Nombre Cliente]!         ║
║                                    ║
║   Te informamos que has recibido   ║
║   un nuevo ingreso de              ║
║   correspondencia en Botánico.     ║
║                                    ║
║   ┌──────────────────────────────┐ ║
║   │ Remitente: [Remitente]       │ ║
║   │ Tipo: [Carta/Paquete]        │ ║
║   │ Fecha/Hora: [13/01 20:00]    │ ║
║   └──────────────────────────────┘ ║
║                                    ║
║      [Ver mi correspondencia] 🔵   ║
║                                    ║
╚════════════════════════════════════╝
```

- Diseño moderno con gradientes
- Responsive (se ve bien en móvil)
- Botón con link directo al dashboard
- Dirección de retiro incluida

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de Supabase Edge Functions
2. Verifica la consola del navegador
3. Revisa el Historial Log en la app (deberías ver eventos de NOTIFY)
4. Verifica que el perfil del cliente tenga `notification_email` configurado

---

## 🔧 Configuración Técnica

**Archivos relevantes:**
- `supabase/functions/notify-correspondence/index.ts` - Edge Function que envía emails
- `services/supabase.ts` - Servicio que invoca la Edge Function

**Variables de entorno en Supabase:**
- `RESEND_API_KEY` - API Key de Resend (en Secrets)
