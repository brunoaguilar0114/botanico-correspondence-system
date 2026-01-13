# 🚀 Setup Completo: Sistema de Notificaciones por Email

Este documento te guiará paso a paso para activar completamente el sistema de notificaciones.

---

## PASO 1: Crear Cuenta en Resend (5 minutos)

### 1.1 Registrarse en Resend

1. Ve a: **https://resend.com/signup**
2. Regístrate con tu email (puedes usar `brunoaguilar95@gmail.com`)
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

## PASO 3: Desplegar Edge Function (3 minutos)

Tienes dos opciones:

### OPCIÓN A: Desde Supabase Dashboard (Más Fácil)

1. Ve a: **https://app.supabase.com/project/afnwfaqudyonmpjuqnej/functions**
2. Click en **"Deploy a new function"**
3. Selecciona **"Upload function code"** o **"From GitHub"**

#### Si eliges "Upload function code":
- Comprime la carpeta `supabase/functions/notify-correspondence` en un ZIP
- Arrastra el ZIP al área de carga
- Click en **"Deploy"**

#### Si eliges "From GitHub":
- Conecta tu repositorio de GitHub
- Selecciona la ruta: `supabase/functions/notify-correspondence`
- Click en **"Deploy"**

### OPCIÓN B: Desde Terminal (Avanzado)

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Login en Supabase
supabase login

# 3. Ir al proyecto
cd "/Users/brunoaguilar/Downloads/botanico-correspondence-system (1)"

# 4. Desplegar la función
supabase functions deploy notify-correspondence --project-ref afnwfaqudyonmpjuqnej
```

### 3.3 Verificar el Despliegue

1. Ve a: **https://app.supabase.com/project/afnwfaqudyonmpjuqnej/functions**
2. Deberías ver **`notify-correspondence`** en la lista
3. Estado debe ser **"Deployed"** (verde)

---

## PASO 4: Configurar Dominio de Email (Elije una opción)

### OPCIÓN A: Usar Dominio de Prueba (Rápido, para testing)

**Ventaja:** Funciona inmediatamente, sin configuración DNS
**Limitación:** Solo puedes enviar emails a tu propio email registrado en Resend

**Acción requerida:** Modificar el código de la Edge Function

Archivo: `supabase/functions/notify-correspondence/index.ts`

**Línea 128, cambiar de:**
```typescript
from: 'Botánico Coworking <notificaciones@botanico.space>',
```

**A:**
```typescript
from: 'onboarding@resend.dev',
```

Luego, **redesplegar la función** (repetir Paso 3).

### OPCIÓN B: Verificar Dominio Personalizado (Producción)

**Ventaja:** Puedes enviar a cualquier email
**Requisito:** Tienes acceso al panel DNS de `botanico.space`

1. Ve a: **https://resend.com/domains**
2. Click en **"Add Domain"**
3. Ingresa: `botanico.space`
4. Resend te mostrará registros DNS para agregar:
   - **TXT** para verificación
   - **MX** para recepción
   - **CNAME** para DKIM

5. Agrega esos registros en tu proveedor DNS (GoDaddy, Cloudflare, etc.)
6. Espera verificación (puede tardar 24-48 horas)
7. Una vez verificado, el dominio quedará activo

**Cuando esté verificado, NO necesitas cambiar el código** (ya usa `notificaciones@botanico.space`)

---

## PASO 5: Probar el Sistema (5 minutos)

### 5.1 Crear una Correspondencia de Prueba

1. Abre tu aplicación: http://localhost:5173 (o tu URL de producción)
2. Inicia sesión como recepcionista o admin
3. Ve a la sección de correspondencia
4. Click en **"Nueva Correspondencia"**

### 5.2 Llenar el Formulario

- **Destinatario:** Selecciona un cliente existente (ej: Brunoka)
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

**En tu email (notification_email del cliente):**
- Revisa la bandeja de entrada
- Si no está, revisa **Spam/Correo no deseado**
- Busca: "Nueva Correspondencia" o "Botánico Coworking"

**Si usaste `onboarding@resend.dev`:**
- Solo llegará al email que registraste en Resend
- Si el cliente tiene otro email, NO llegará (limitación de sandbox)

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
| "Domain not verified" | Dominio no verificado en Resend | Usa `onboarding@resend.dev` (Paso 4A) |
| "Failed to send a request" | Función no desplegada | Verifica Paso 3 |
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
- [ ] Edge Function `notify-correspondence` desplegada
- [ ] Dominio configurado (sandbox o personalizado)
- [ ] Prueba de envío realizada
- [ ] Email recibido en bandeja de entrada

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
║   ┌──────────────────────────┐    ║
║   │ Remitente: [Remitente]   │    ║
║   │ Tipo: [Carta/Paquete]    │    ║
║   │ Fecha/Hora: [13/01 20:00]│    ║
║   └──────────────────────────┘    ║
║                                    ║
║      [Abrir Dashboard] 🔵         ║
║                                    ║
╚════════════════════════════════════╝
```

- Diseño neumórfico moderno
- Responsive (se ve bien en móvil)
- Botón con link directo al dashboard
- Colores de marca Botánico

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de Supabase Edge Functions
2. Verifica la consola del navegador
3. Revisa el Historial Log en la app (deberías ver eventos de NOTIFY)
4. Verifica que el perfil del cliente tenga `notification_email` configurado

## 🚀 Próximos Pasos (Opcional)

Una vez que el sistema funcione:

1. **Verificar dominio personalizado** para producción
2. **Configurar reenvíos automáticos** para emails fallidos
3. **Agregar plantillas personalizadas** por tipo de correspondencia
4. **Implementar resumen diario** de correspondencia pendiente
5. **Agregar notificaciones SMS** con Twilio
