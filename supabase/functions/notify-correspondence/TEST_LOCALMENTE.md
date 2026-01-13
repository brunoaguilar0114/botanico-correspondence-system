# Probar Edge Function Localmente (Opcional)

Si quieres probar la función antes de desplegarla, puedes ejecutarla localmente:

## 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

## 2. Iniciar servidor local

```bash
cd "/Users/brunoaguilar/Downloads/botanico-correspondence-system (1)"
supabase functions serve notify-correspondence --env-file supabase/.env.local
```

## 3. Crear archivo de variables de entorno

Crea el archivo: `supabase/.env.local`

```
RESEND_API_KEY=re_tu_api_key_aqui
```

## 4. Probar con curl

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/notify-correspondence' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"recipientName":"Test User","recipientEmail":"tu-email@gmail.com","senderName":"Probando","type":"Carta","date":"13/01/2026","time":"20:00","dashboardUrl":"http://localhost:5173"}'
```

Reemplaza:
- `YOUR_ANON_KEY` con tu `VITE_SUPABASE_ANON_KEY` del archivo `.env.local`
- `tu-email@gmail.com` con tu email real

## 5. Verificar resultado

Si funciona, deberías recibir un email en tu bandeja de entrada.

Si falla, revisa el error en la terminal donde ejecutaste `supabase functions serve`.
