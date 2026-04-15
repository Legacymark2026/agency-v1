
export const VIPWelcomeTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style>
        body { background-color: #000000; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background-color: #111111; border: 1px solid #333333; border-radius: 16px; padding: 40px; text-align: center; }
        .logo { color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin-bottom: 30px; display: inline-block; }
        .heading { color: #ffffff; font-size: 28px; font-weight: bold; margin-bottom: 16px; letter-spacing: -0.5px; }
        .text { color: #888888; font-size: 16px; line-height: 26px; margin-bottom: 24px; }
        .highlight { color: #4ade80; font-weight: 600; }
        .btn { display: inline-block; background-color: #ffffff; color: #000000; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 8px; margin-top: 10px; font-size: 14px; letter-spacing: 0.5px; }
        .footer { margin-top: 40px; text-align: center; color: #444444; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo">LEGACY MARK</div>
            <h1 class="heading">Acceso VIP Confirmado</h1>
            <p class="text">
                Hola ${name},
            </p>
            <p class="text">
                Hemos recibido tu solicitud a través del <span class="highlight">Canal Prioritario</span>.
                Tu perfil ha sido elevado a nuestra lista de atención inmediata.
            </p>
            <p class="text">
                Uno de nuestros estrategas senior está revisando tu caso en este momento. 
                Te contactaremos en menos de 24 horas para definir los siguientes pasos.
            </p>
            <a href="https://legacymark.com" class="btn">VISITAR SITIO</a>
        </div>
        <div class="footer">
            &copy; 2026 LegacyMark Inc. All rights reserved.<br/>
            Este es un mensaje automático del sistema de prioridad.
        </div>
    </div>
</body>
</html>
`;

export const AdminAlertTemplate = (name: string, email: string, phone: string, company: string, note: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
        body { background-color: #f4f4f5; font-family: sans-serif; }
        .container { max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .tag { background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        h2 { margin-top: 0; color: #18181b; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        td { padding: 12px 0; border-bottom: 1px solid #e4e4e7; color: #3f3f46; }
        .label { font-weight: 600; width: 140px; color: #71717a; }
        .note { background: #f4f4f5; padding: 15px; border-radius: 6px; margin-top: 20px; color: #3f3f46; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <div><span class="tag">Nuevo Lead VIP</span></div>
        <h2>Solicitud de Tarjeta Física</h2>
        <table>
            <tr><td class="label">Nombre:</td><td>${name}</td></tr>
            <tr><td class="label">Email:</td><td>${email}</td></tr>
            <tr><td class="label">Teléfono:</td><td>${phone || 'N/A'}</td></tr>
            <tr><td class="label">Empresa:</td><td>${company || 'N/A'}</td></tr>
        </table>
        ${note ? `<div class="note">"${note}"</div>` : ''}
        <p style="margin-top: 30px; font-size: 14px; color: #71717a;">
            Fuente: physical_card | Campaña: VIP-CARD
        </p>
    </div>
</body>
</html>
`;
