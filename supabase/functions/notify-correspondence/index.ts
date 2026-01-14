
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface NotificationPayload {
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  type: string;
  date: string;
  time: string;
  dashboardUrl: string;
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

// Enhanced CORS headers for maximum compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
};

Deno.serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Validate API Key configuration early
    if (!RESEND_API_KEY) {
      console.error('CRITICAL: RESEND_API_KEY is not set in project secrets.');
      return new Response(
        JSON.stringify({ error: 'Configuración de servidor incompleta (Missing API Key).' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse and validate payload
    const payload: NotificationPayload = await req.json();
    const { recipientName, recipientEmail, senderName, type, date, time, dashboardUrl } = payload;

    console.log(`Processing notification for: ${recipientEmail} (${recipientName})`);

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: 'El email del destinatario es obligatorio.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Premium HTML Template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); padding: 60px 40px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
          .header p { opacity: 0.9; font-weight: 700; font-size: 14px; margin-top: 10px; letter-spacing: 2px; }
          .content { padding: 40px; color: #1a1f36; }
          .greeting { font-size: 24px; font-weight: 900; margin-bottom: 24px; color: #000; }
          .details-card { background-color: #f8fafc; border: 1px solid #eef2f6; border-radius: 24px; padding: 32px; margin-bottom: 32px; }
          .detail-row { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #edf2f7; }
          .detail-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
          .label { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px; }
          .value { font-size: 16px; font-weight: 700; color: #334155; display: block; }
          .location-card { background: linear-gradient(135deg, #f8fafc 0%, #eef2f6 100%); border-radius: 16px; padding: 20px; margin-top: 32px; border-left: 4px solid #0072FF; }
          .location-title { font-size: 11px; font-weight: 900; color: #0072FF; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .location-address { font-size: 14px; color: #1e293b; line-height: 1.6; margin: 0; font-weight: 600; }
          .footer-text { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 32px; }
          .btn { display: inline-block; background-color: #0072FF; color: #ffffff !important; padding: 18px 36px; border-radius: 100px; text-decoration: none; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 20px rgba(0,114,255,0.2); transition: all 0.3s ease; }
          .footer { padding: 40px; text-align: center; border-top: 1px solid #edf2f7; font-size: 12px; color: #94a3b8; background-color: #fafbfc; }
          @media only screen and (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .header { padding: 40px 24px; }
            .content { padding: 32px 24px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <p>BOTÁNICO COWORKING</p>
            <h1>Nueva Correspondencia</h1>
          </div>
          <div class="content">
            <div class="greeting">¡Hola, ${recipientName}!</div>
            <p class="footer-text">Te informamos que has recibido un nuevo ingreso de correspondencia en Botánico. Ya puedes pasar a retirarlo o visualizar los detalles en tu panel.</p>
            
            <div class="details-card">
              <div class="detail-row">
                <span class="label">Remitente</span>
                <span class="value">${senderName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Tipo de Envío</span>
                <span class="value">${type}</span>
              </div>
              <div class="detail-row">
                <span class="label">Fecha y Hora de Recepción</span>
                <span class="value">${date} • ${time}</span>
              </div>
            </div>

            <div class="location-card">
              <div class="location-title">📍 Dirección de Retiro</div>
              <p class="location-address">
                <strong style="color: #0f172a;">Botánico Coworking</strong><br>
                C/ del Túria, 53<br>
                Extramurs, 46008 València<br>
                Valencia, España
              </p>
            </div>

            <div style="text-align: center; margin-bottom: 24px; margin-top: 32px;">
              <a href="${dashboardUrl}" class="btn">Ver mi correspondencia</a>
            </div>

            <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-top: 32px;">
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                💡 <strong>Accede de forma segura:</strong><br>
                También puedes ingresar directamente a <span style="color: #0072FF; font-weight: 600;">botanico-correspondence-system-uiaj.vercel.app</span> e iniciar sesión con tu cuenta.
              </p>
            </div>
          </div>
          <div class="footer">
            &copy; 2026 Botánico Coworking. Todos los derechos reservados.<br>
            Este es un email automático, por favor no respondas a este mensaje.<br>
            <span style="color: #94a3b8; font-size: 10px; margin-top: 8px; display: block;">
              Si no solicitaste este email, puedes ignorarlo de manera segura.
            </span>
          </div>
        </div>
      </body>
      </html>
    `;

    // 5. Send using Resend
    // IMPORTANT: If domain is not verified, use onboarding@resend.dev as 'from'
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Botánico Coworking <onboarding@resend.dev>', // Dominio sandbox de Resend para pruebas
        to: [recipientEmail],
        subject: `📬 Correspondencia de ${senderName} - Botánico Coworking`,
        html: htmlContent,
        reply_to: 'info@botanico.space',
        tags: [
          { name: 'category', value: 'notification' },
          { name: 'type', value: 'correspondence' }
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend rejection:', data);
      return new Response(
        JSON.stringify({ error: `Servicio de Email: ${data.message || res.statusText}` }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge Function Internal Error:', error);
    return new Response(
      JSON.stringify({ error: `Error interno: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
