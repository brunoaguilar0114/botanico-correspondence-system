# Instrucciones para Desplegar Edge Function

## Opción 1: Desplegar desde Supabase Dashboard (Recomendado)

1. Ve a: https://app.supabase.com/project/afnwfaqudyonmpjuqnej/functions
2. Click en "Deploy a new function"
3. Selecciona "Upload function code"
4. Arrastra la carpeta completa: `supabase/functions/notify-correspondence`
5. Click en "Deploy"

## Opción 2: Desplegar desde CLI (Avanzado)

### Prerrequisitos:
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login
```

### Comando de despliegue:
```bash
cd "/Users/brunoaguilar/Downloads/botanico-correspondence-system (1)"
supabase functions deploy notify-correspondence --project-ref afnwfaqudyonmpjuqnej
```

## Verificar el despliegue:

Después de desplegar, verifica en:
https://app.supabase.com/project/afnwfaqudyonmpjuqnej/functions

Deberías ver:
- ✅ `notify-correspondence` con estado "Deployed"
- ✅ Versión y fecha de despliegue

## Configurar Secrets:

1. Ve a: https://app.supabase.com/project/afnwfaqudyonmpjuqnej/settings/secrets
2. Click en "Add new secret"
3. Nombre: `RESEND_API_KEY`
4. Valor: Tu API Key de Resend (empieza con `re_`)
5. Click en "Save"

## Obtener API Key de Resend:

Si no tienes cuenta en Resend:
1. Crea una cuenta gratuita en: https://resend.com/signup
2. Ve a: https://resend.com/api-keys
3. Click en "Create API Key"
4. Copia el valor (ejemplo: `re_abc123def456...`)
5. Pégalo en Supabase Secrets

## Probar la función:

Después de desplegar y configurar el secret:
1. Crea una correspondencia en la app
2. Marca "Notificar por email"
3. Usa un email real tuyo
4. Verifica que llegue el email

## Troubleshooting:

Si no funciona, revisa los logs:
https://app.supabase.com/project/afnwfaqudyonmpjuqnej/logs/edge-functions
