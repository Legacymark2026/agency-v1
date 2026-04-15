import { NextResponse } from 'next/server';

export async function GET() {
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Propuesta LegacyMark - Plan Acelerado</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;600;700&family=Poppins:wght@700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        /* 1. CONFIGURACIÓN BASE - ESTILO CONSULTORÍA PREMIUM */
        * { box-sizing: border-box; }
        body { background-color: #0f172a; margin: 0; padding: 20px 0; display: grid; place-items: center; gap: 20px; }

        .slide-container {
            width: 1280px;
            height: 720px;
            background-color: #000000;
            color: #f8fafc;
            font-family: 'Urbanist', sans-serif;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            padding: 60px;
            /* Diseño de fondo: Verde Esmeralda Suave */
            background-image: 
                radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.07) 0%, transparent 40%),
                radial-gradient(circle at 90% 90%, rgba(16, 185, 129, 0.07) 0%, transparent 40%);
        }

        /* 2. TIPOGRAFÍA Y ESTILOS COMUNES */
        h1, h2, h3 { font-family: 'Poppins', sans-serif; margin: 0; color: #ffffff; }
        .slide-title { font-size: 48px; margin-bottom: 30px; text-align: left; border-left: 8px solid #10b981; padding-left: 20px; line-height: 1.1; }
        .slide-title span { color: #10b981; }
        p { font-size: 20px; line-height: 1.4; color: #cbd5e1; }

        .content-area { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; width: 100%; }

        /* 3. LAYOUTS ESPECÍFICOS */
        .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; width: 100%; align-items: center; }
        
        .image-wrapper { width: 100%; height: 400px; border-radius: 20px; overflow: hidden; border: 1px solid #1e293b; }
        .image-wrapper img { width: 100%; height: 100%; object-fit: cover; }

        /* Estilo para tablas */
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 18px; }
        th { background-color: #064e3b; color: #10b981; text-align: left; padding: 15px; border-bottom: 2px solid #10b981; }
        td { padding: 15px; border-bottom: 1px solid #1e293b; }
        tr:nth-child(even) { background-color: #020617; }

        /* Iconos y Tiles */
        .tiled-content { display: flex; gap: 20px; width: 100%; }
        .tile { flex: 1; background: #0f172a; padding: 30px; border-radius: 20px; border: 1px solid #1e293b; transition: all 0.3s; }
        .tile:hover { border-color: #10b981; transform: translateY(-5px); }
        .tile i { font-size: 40px; color: #10b981; margin-bottom: 20px; }

        /* Gráficos */
        .chart-container { display: flex; justify-content: space-around; align-items: center; width: 100%; }
        .doughnut-chart { width: 300px; height: 300px; border-radius: 50%; border: 30px solid #064e3b; position: relative; }
        
        /* Highlight Numbers */
        .number-box { text-align: center; }
        .number { font-size: 120px; font-weight: 700; color: #10b981; line-height: 1; }
        .number-label { font-size: 24px; color: #ffffff; margin-top: 10px; }

        /* Bleed Image Right Layout */
        .slide-container.bleed-image-layout { padding: 0; display: grid; grid-template-columns: 1fr 1fr; align-items: start; }
        .bleed-text-side { padding: 60px; display: flex; flex-direction: column; justify-content: center; height: 100%; }
        .bleed-image-side { width: 100%; height: 720px; object-fit: cover; }

        /* Styled Bullet Points */
        .bullet-list { list-style: none; padding: 0; }
        .bullet-list li { margin-bottom: 20px; font-size: 22px; display: flex; align-items: flex-start; }
        .bullet-list i { color: #10b981; margin-right: 15px; margin-top: 5px; font-size: 24px; }
    </style>
</head>
<body>

<!-- SLIDE 1: Título -->
<div class="slide-container" style="justify-content: center; align-items: center; text-align: center;">
    <div style="margin-bottom: 40px;">
        <img src="https://legacymarksas.com/logo.png" alt="LegacyMark" style="height: 120px; object-fit: contain; margin-bottom: 20px; filter: brightness(0) invert(1);">
        <h1 style="font-size: 80px; margin-bottom: 10px;">DE CERO A <span>RADAR</span></h1>
        <p style="font-size: 32px; font-weight: 600; color: #10b981;">Haciendo Sonar su Software SGI en Colombia</p>
    </div>
    <div style="background: #0f172a; padding: 30px; border-radius: 15px; border: 1px solid #1e293b;">
        <p style="margin: 0; font-size: 18px; color: #94a3b8;">Preparado para: <strong>Consultoría de Colombia SAS</strong></p>
        <p style="margin: 5px 0 0; font-size: 18px; color: #94a3b8;">Por: <strong>LegacyMark BIC S.A.S</strong></p>
    </div>
</div>

<!-- SLIDE 2: Estrategia -->
<div class="slide-container" style="justify-content: center; align-items: center; text-align: center;">
    <h2 style="font-size: 60px; margin-bottom: 20px;">Estrategia de los <span>90 Días</span></h2>
    <div style="width: 100px; height: 5px; background: #10b981; margin-bottom: 40px;"></div>
    <p style="max-width: 800px; font-size: 24px;">Transformaremos su invisibilidad actual en una autoridad digital indiscutible para empresas medianas en solo 3 meses.</p>
</div>

<!-- SLIDE 3: Diagnóstico -->
<div class="slide-container">
    <h2 class="slide-title">Diagnóstico: <span>El Punto de Partida</span></h2>
    <div class="content-area">
        <div class="tiled-content">
            <div class="tile">
                <i class="fa-solid fa-file-circle-xmark"></i>
                <h3>Volante Digital</h3>
                <p>Su página actual no proyecta la robustez institucional que una empresa mediana exige para confiar su gestión.</p>
            </div>
            <div class="tile">
                <i class="fa-solid fa-gauge-high"></i>
                <h3>Baja Velocidad</h3>
                <p>Tecnología obsoleta de 8 años que penaliza su posicionamiento y provoca el abandono de prospectos.</p>
            </div>
            <div class="tile">
                <i class="fa-solid fa-eye-slash"></i>
                <h3>Sin Trazabilidad</h3>
                <p>Incapacidad de saber quién visita o qué le interesa. Una fuerza de ventas operando "a ciegas".</p>
            </div>
        </div>
    </div>
</div>

<!-- SLIDE 4: Contenido -->
<div class="slide-container">
    <h2 class="slide-title">Máquina de <span>Contenido Mensual</span></h2>
    <div class="content-area">
        <div class="chart-container">
            <div style="text-align: left; max-width: 400px;">
                <h3 style="color: #10b981; font-size: 36px; margin-bottom: 20px;">14 Piezas / Mes</h3>
                <p>Estrategia 100% personalizada para educar al mercado sobre normatividad (ISO, Decreto 1072) y beneficios SGI.</p>
            </div>
            <div class="doughnut-chart" style="background: conic-gradient(#10b981 0% 70%, #ffffff 70% 90%, #64748b 90% 100%);">
                <div style="position: absolute; top: 35%; left: 35%; text-align: center;">
                    <span style="font-size: 48px; font-weight: 700; color: #fff;">14</span><br>
                    <span style="font-size: 14px; color: #10b981;">TOTAL</span>
                </div>
            </div>
            <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 15px;"><i class="fa-solid fa-square" style="color: #10b981; margin-right: 10px;"></i> 10 Posts Estratégicos (70%)</li>
                <li style="margin-bottom: 15px;"><i class="fa-solid fa-square" style="color: #ffffff; margin-right: 10px;"></i> 3 Videos Short/Reel (20%)</li>
                <li style="margin-bottom: 15px;"><i class="fa-solid fa-square" style="color: #64748b; margin-right: 10px;"></i> 1 Carrusel Educativo (10%)</li>
            </ul>
        </div>
    </div>
</div>

<!-- SLIDE 5: Plan de Acción -->
<div class="slide-container">
    <h2 class="slide-title">Hoja de Ruta: <span>Plan de Acción</span></h2>
    <div class="content-area">
        <table>
            <thead>
                <tr>
                    <th>Mes</th>
                    <th>Objetivo Principal</th>
                    <th>Resultado Clave</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Mes 1: Cimientos</strong></td>
                    <td>Construir Base + Activar Contenido</td>
                    <td>Sitio Web Corporativo publicado + Contenido inicial en redes.</td>
                </tr>
                <tr>
                    <td><strong>Mes 2: Radar</strong></td>
                    <td>Amplificar y Atraer Tráfico</td>
                    <td>Campañas Google/LinkedIn activas + Tráfico cualificado.</td>
                </tr>
                <tr>
                    <td><strong>Mes 3: Leads</strong></td>
                    <td>Escalar y Optimizar Conversión</td>
                    <td>Solicitudes de Demo + Data sólida para crecimiento.</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<!-- SLIDE 6: Mes 1 -->
<div class="slide-container">
    <h2 class="slide-title">Mes 1: <span>Construcción de la Base</span></h2>
    <div class="content-area">
        <div class="two-column">
            <div>
                <ul class="bullet-list">
                    <li><i class="fa-solid fa-check-double"></i> <strong>Sitio Web Corporativo:</strong> Arquitectura completa (Nosotros, Casos de Éxito, Blog, Contacto).</li>
                    <li><i class="fa-solid fa-check-double"></i> <strong>Optimización:</strong> Diseño responsivo y alta velocidad de carga.</li>
                    <li><i class="fa-solid fa-check-double"></i> <strong>Configuración:</strong> GTM, Píxeles de seguimiento y SEO técnico.</li>
                </ul>
            </div>
            <div class="image-wrapper">
                <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1280" alt="[Desarrollo web moderno]">
            </div>
        </div>
    </div>
</div>

<!-- SLIDE 7: Mes 2 -->
<div class="slide-container bleed-image-layout">
    <div class="bleed-text-side">
        <h2 class="slide-title" style="border-left: none; padding-left: 0;">Mes 2: <span>Activación del Radar</span></h2>
        <ul class="bullet-list">
            <li><i class="fa-solid fa-bullhorn"></i> <strong>Campañas de Pauta:</strong> Google Ads y LinkedIn Ads (Segmentación B2B).</li>
            <li><i class="fa-solid fa-arrows-spin"></i> <strong>Retargeting:</strong> Re-impactamos a quienes visitaron el sitio sin contactar.</li>
            <li><i class="fa-solid fa-chart-line"></i> <strong>Tráfico Cualificado:</strong> Primeros datos reales sobre el cliente ideal.</li>
        </ul>
    </div>
    <img class="bleed-image-side" src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=720" alt="[Reunión de negocios analizando resultados]">
</div>

<!-- SLIDE 8: Diferenciadores -->
<div class="slide-container">
    <h2 class="slide-title">¿Por qué <span>LegacyMark?</span></h2>
    <div class="content-area">
        <div class="tiled-content">
            <div class="tile">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <h3>Desde el Día 1</h3>
                <p>No esperamos a la web. Generamos presencia desde la primera semana.</p>
            </div>
            <div class="tile">
                <i class="fa-solid fa-brain"></i>
                <h3>Expertos en SGI</h3>
                <p>Entendemos las normas ISO y el Decreto 1072. Sin curvas de aprendizaje.</p>
            </div>
            <div class="tile">
                <i class="fa-solid fa-award"></i>
                <h3>BIC S.A.S</h3>
                <p>Agencia con propósito, alineada con la calidad y sostenibilidad de su software.</p>
            </div>
        </div>
    </div>
</div>

<!-- SLIDE 9: Inversión -->
<div class="slide-container">
    <h2 class="slide-title">Inversión <span>Estratégica (COP)</span></h2>
    <div class="content-area">
        <table style="font-size: 16px;">
            <thead>
                <tr>
                    <th>Concepto</th>
                    <th>Mes 1</th>
                    <th>Mes 2</th>
                    <th>Mes 3</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Sitio Web Corporativo</td>
                    <td>$2.500.000</td>
                    <td>—</td>
                    <td>—</td>
                    <td>$2.500.000</td>
                </tr>
                <tr>
                    <td>Tecnología & SEO</td>
                    <td>$400.000</td>
                    <td>—</td>
                    <td>—</td>
                    <td>$400.000</td>
                </tr>
                <tr>
                    <td>Contenido (14 pcs/mes)</td>
                    <td>$500.000</td>
                    <td>$500.000</td>
                    <td>$500.000</td>
                    <td>$1.500.000</td>
                </tr>
                <tr>
                    <td>Gestión Ads & Social</td>
                    <td>—</td>
                    <td>$339.000</td>
                    <td>$339.000</td>
                    <td>$678.000</td>
                </tr>
                <tr style="background: rgba(16, 185, 129, 0.15);">
                    <td><strong>TOTAL POR MES</strong></td>
                    <td><strong>$3.400.000</strong></td>
                    <td><strong>$839.000</strong></td>
                    <td><strong>$839.000</strong></td>
                    <td><strong>$5.078.000*</strong></td>
                </tr>
            </tbody>
        </table>
        <p style="font-size: 14px; font-style: italic; margin-top: 10px;">*Valores sin IVA. Presupuesto de pauta sugerido aparte ($500k - $1M / mes).</p>
    </div>
</div>

<!-- SLIDE 10: Cierre -->
<div class="slide-container" style="justify-content: center; align-items: center; text-align: center;">
    <img src="https://legacymarksas.com/logo.png" alt="LegacyMark" style="height: 100px; object-fit: contain; margin-bottom: 30px; filter: brightness(0) invert(1);">
    <h2 style="font-size: 60px; margin-bottom: 20px;">¿Empezamos a <span>sonar?</span></h2>
    <p style="font-size: 24px; margin-bottom: 50px;">Estamos listos para ejecutar este plan acelerado y posicionar su SGI.</p>
    <div style="background: #0f172a; padding: 30px; border-radius: 10px; border: 1px solid #10b981; max-width: 600px;">
        <p style="font-size: 18px; color: #ffffff;">Al final del Mes 3: <strong>42 piezas publicadas, Web lista y Leads calificados fluyendo.</strong></p>
    </div>
    <div style="margin-top: 60px;">
        <p style="color: #64748b;">LegacyMark BIC S.A.S | Colombia | 2026</p>
    </div>
</div>

</body>
</html>`;

    return new NextResponse(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
        },
    });
}
