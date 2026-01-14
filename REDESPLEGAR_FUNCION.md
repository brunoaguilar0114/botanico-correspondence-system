# 🚀 Cómo Redesplegar la Edge Function

## OPCIÓN 1: Desde Terminal (Recomendado)

### Paso 1: Login en Supabase CLI

Abre una terminal y ejecuta:

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte. Completa el login.

### Paso 2: Desplegar la función

```bash
cd "/Users/brunoaguilar/Downloads/botanico-correspondence-system (1)"
supabase functions deploy notify-correspondence --project-ref afnwfaqudyonmpjuqnej
```

**Resultado esperado:**
```
Deploying function notify-correspondence (project ref: afnwfaqudyonmpjuqnej)
✓ Function deployed successfully
```

---

## OPCIÓN 2: Desde Supabase Dashboard

Si no puedes usar la CLI, sigue estos pasos:

### 1. Eliminar la función existente

1. Ve a: https://app.supabase.com/project/afnwfaqudyonmpjuqnej/functions
2. Click en `notify-correspondence`
3. Busca el botón "Delete function" o similar
4. Confirma la eliminación

### 2. Crear nueva función

1. En la misma página, click en "Deploy a new function"
2. Selecciona "New function"
3. Function name: `notify-correspondence`
4. Copia y pega el código del archivo `index.ts` (el que está en tu proyecto local)
5. Click en "Deploy"

---

## OPCIÓN 3: Usar GitHub Actions (Automático)

Si tu proyecto está en GitHub, puedes configurar despliegue automático.

### Setup GitHub Action:

Crea el archivo `.github/workflows/deploy-functions.yml`:

```yaml
name: Deploy Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Deploy functions
        run: |
          supabase functions deploy notify-correspondence --project-ref afnwfaqudyonmpjuqnej
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

Luego agrega el secret `SUPABASE_ACCESS_TOKEN` en GitHub:
1. Ve a tu repo → Settings → Secrets and variables → Actions
2. Agrega `SUPABASE_ACCESS_TOKEN` con tu token de Supabase

---

## VERIFICAR EL DESPLIEGUE

Después de redesplegar, verifica:

1. **Estado en Dashboard:**
   - Ve a: https://app.supabase.com/project/afnwfaqudyonmpjuqnej/functions
   - `notify-correspondence` debe mostrar estado "Deployed" (verde)
   - La columna "Updated" debe mostrar la fecha/hora reciente

2. **Probar con curl:**
   ```bash
   curl -i --location --request POST 'https://afnwfaqudyonmpjuqnej.supabase.co/functions/v1/notify-correspondence' \
     --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmbndmYXF1ZHlvbm1wanVxbmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTY2OTUsImV4cCI6MjA3OTY3MjY5NX0.DSucRJshbExhgqC_8kPWhhcsr5Q-NbWJEO_p8CNYp_k' \
     --header 'Content-Type: application/json' \
     --data '{"recipientName":"Test","recipientEmail":"brunoaguilar95@gmail.com","senderName":"Amazon","type":"Paquete","date":"13/01/2026","time":"22:00","dashboardUrl":"http://localhost"}'
   ```

   **Resultado esperado:**
   - Status 200
   - JSON con `{"id":"..."}`

3. **Ver logs:**
   - Ve a: https://app.supabase.com/project/afnwfaqudyonmpjuqnej/logs/edge-functions
   - Filtra por `notify-correspondence`
   - No debes ver el error "RESEND_API_KEY is not set"

---

## TROUBLESHOOTING

### Error: "Access token not provided"
**Solución:** Ejecuta `supabase login` primero

### Error: "Function already exists"
**Solución:** Usa el flag `--no-verify-jwt` o elimina la función antes de redesplegar

### Error: "Project not linked"
**Solución:** Ejecuta `supabase link --project-ref afnwfaqudyonmpjuqnej`

---

## DESPUÉS DEL REDESPLIEGUE

1. ✅ Recarga tu aplicación (F5)
2. ✅ Intenta enviar una notificación
3. ✅ Verifica tu bandeja de entrada
4. ✅ Si sigue fallando, revisa los logs de Edge Functions
