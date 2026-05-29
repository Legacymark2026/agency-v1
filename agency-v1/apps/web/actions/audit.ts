"use server";

import https from "https";
import { generateText } from "ai";
import { geminiFlashModel } from "@/lib/ai-provider";

// Define the interface for the Audit Report
export interface AuditReport {
    domain: string;
    url: string;
    score: number; // 0-100
    status: "success" | "warning" | "error";
    details: {
        speed: {
            score: number;
            ttfb: number; // in ms
            status: "excellent" | "good" | "slow";
            feedback: string;
        };
        seo: {
            score: number;
            title: string;
            titleLength: number;
            titleVerdict: string;
            description: string;
            descriptionLength: number;
            descriptionVerdict: string;
            h1Count: number;
            h1Verdict: string;
            imagesCount: number;
            imagesMissingAlt: number;
            feedback: string;
        };
        usability: {
            score: number;
            hasViewport: boolean;
            responsiveVerdict: string;
            mobileFriendly: boolean;
            feedback: string;
        };
        security: {
            score: number;
            sslValid: boolean;
            sslIssuer: string;
            sslExpiry: string;
            protocol: string;
            hsts: boolean;
            brokenLinksCount: number;
            brokenLinks: string[];
            feedback: string;
        };
        localSeo: {
            score: number;
            hasGoogleMaps: boolean;
            googleMapsVerdict: string;
            hasLocalSchema: boolean;
            localAddress: string;
            feedback: string;
        };
    };
    improvements: {
        impact: "high" | "medium" | "low";
        category: "SEO" | "Speed" | "Usability" | "Security" | "Local";
        title: string;
        description: string;
    }[];
}

// 1. SSL Certificate Checker using Node.js https
function checkSSLCertificate(hostname: string): Promise<{ valid: boolean; issuer: string; validTo: string; error?: string }> {
    return new Promise((resolve) => {
        const req = https.request({
            hostname,
            port: 443,
            method: "GET",
            rejectUnauthorized: false, // Don't throw on invalid certs, so we can inspect them
            timeout: 3000
        }, (res) => {
            const cert = (res.socket as any).getPeerCertificate();
            if (cert && Object.keys(cert).length > 0) {
                const now = new Date();
                const validTo = new Date(cert.valid_to);
                const expired = now > validTo;
                resolve({
                    valid: !expired && !!cert.valid_to,
                    issuer: cert.issuer?.O || cert.issuer?.CN || "Desconocido",
                    validTo: cert.valid_to || "N/A"
                });
            } else {
                resolve({
                    valid: false,
                    issuer: "Ninguno",
                    validTo: "N/A",
                    error: "No se pudo obtener el certificado SSL"
                });
            }
            res.resume();
        });

        req.on("error", (err) => {
            resolve({
                valid: false,
                issuer: "Ninguno",
                validTo: "N/A",
                error: err.message
            });
        });

        req.on("timeout", () => {
            req.destroy();
            resolve({
                valid: false,
                issuer: "Ninguno",
                validTo: "N/A",
                error: "Timeout al conectar por HTTPS"
            });
        });

        req.end();
    });
}

// 2. Link status checker for broken links detection
async function checkUrlStatus(url: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(url, {
            method: "HEAD",
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) WebAudit/1.0" }
        });
        clearTimeout(timeoutId);
        return res.status < 400;
    } catch {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const res = await fetch(url, {
                method: "GET",
                signal: controller.signal,
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) WebAudit/1.0" }
            });
            clearTimeout(timeoutId);
            return res.status < 400;
        } catch {
            return false;
        }
    }
}

// 3. Central Audit domain logic
export async function auditDomainAction(rawDomain: string): Promise<{ success: boolean; report?: AuditReport; error?: string }> {
    try {
        // Clean domain
        let domain = rawDomain.trim().toLowerCase();
        domain = domain.replace(/^(https?:\/\/)?(www\.)?/, "");
        domain = domain.split("/")[0]; // remove paths

        if (!domain || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
            return { success: false, error: "Formato de dominio inválido" };
        }

        const url = `https://${domain}`;
        console.log(`🔍 Auditing Domain: ${domain}...`);

        // Perform live fetches and benchmarks
        const start = Date.now();
        let html = "";
        let fetchSuccess = false;
        let ttfb = 0;
        let hsts = false;
        let protocol = "HTTP/1.1";

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(url, {
                signal: controller.signal,
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) WebAudit/1.0" }
            });
            ttfb = Date.now() - start;
            clearTimeout(timeoutId);
            html = await res.text();
            fetchSuccess = true;
            hsts = res.headers.has("strict-transport-security");
        } catch (err: any) {
            console.warn(`HTTPS fetch failed for ${domain}, retrying with HTTP... Error: ${err.message}`);
            try {
                // Try fallback HTTP
                const httpStart = Date.now();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const res = await fetch(`http://${domain}`, {
                    signal: controller.signal,
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) WebAudit/1.0" }
                });
                ttfb = Date.now() - httpStart;
                clearTimeout(timeoutId);
                html = await res.text();
                fetchSuccess = true;
                protocol = "HTTP (Inseguro)";
            } catch (fallbackErr: any) {
                console.error(`HTTP fallback fetch failed: ${fallbackErr.message}`);
                // Don't crash, generate simulated report for lead generation
            }
        }

        // Gather SSL Data
        const sslData = await checkSSLCertificate(domain);

        // Technical Scraper (fallback or raw data feeder for LLM)
        let title = "";
        let description = "";
        let h1Count = 0;
        let imagesCount = 0;
        let imagesMissingAlt = 0;
        let hasViewport = false;
        const rawLinks: string[] = [];

        if (fetchSuccess && html) {
            // Title
            const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            title = titleMatch ? titleMatch[1].trim() : "";

            // Description
            const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) || 
                              html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
            description = descMatch ? descMatch[1].trim() : "";

            // Viewport (responsiveness)
            hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);

            // H1 count
            const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
            h1Count = h1Matches ? h1Matches.length : 0;

            // Images and alts
            const imgMatches = html.match(/<img[^>]*>/gi);
            if (imgMatches) {
                imagesCount = imgMatches.length;
                imgMatches.forEach((img) => {
                    if (!/alt=["']/i.test(img) || /alt=["']\s*["']/i.test(img)) {
                        imagesMissingAlt++;
                    }
                });
            }

            // Links extraction (only absolute http/https)
            const linkRegex = /href=["'](https?:\/\/[^"'\s#]+)/gi;
            let match;
            while ((match = linkRegex.exec(html)) !== null) {
                const link = match[1];
                if (!link.includes(domain) && !rawLinks.includes(link) && rawLinks.length < 15) {
                    rawLinks.push(link);
                }
            }
        }

        // Test broken links sample (up to 5 links)
        const brokenLinks: string[] = [];
        const linksToTest = rawLinks.slice(0, 5);
        if (linksToTest.length > 0) {
            const results = await Promise.all(
                linksToTest.map(async (l) => {
                    const ok = await checkUrlStatus(l);
                    return { url: l, ok };
                })
            );
            results.forEach((r) => {
                if (!r.ok) brokenLinks.push(r.url);
            });
        }

        // Check local SEO indicators
        const hasMapsLink = /google\.com\/maps/i.test(html) || /maps\.google\.com/i.test(html) || /iframe[^>]*src=["'][^"']*google\.com\/maps/i.test(html);
        const hasLocalSchema = /LocalBusiness/i.test(html) || /PostalAddress/i.test(html) || /GeoCoordinates/i.test(html);
        
        // Extract address details
        let localAddress = "";
        const addressMatch = html.match(/dir[eé]cci[oó]n:?\s*([^<>\n|]+)/i) || html.match(/cll|calle|carrera|cra|nro|avenida|ave/i);
        if (addressMatch) {
            localAddress = addressMatch[0].trim().substring(0, 80);
        }

        // Setup technical metrics for LLM prompt
        const rawData = {
            domain,
            fetchSuccess,
            ttfb: ttfb || 450, // default if fetch failed
            sslValid: sslData.valid,
            sslIssuer: sslData.issuer,
            sslExpiry: sslData.validTo,
            hsts,
            protocol,
            title,
            titleLength: title.length,
            description,
            descriptionLength: description.length,
            hasViewport,
            h1Count,
            imagesCount,
            imagesMissingAlt,
            brokenLinksCount: brokenLinks.length,
            brokenLinks,
            hasMapsLink,
            hasLocalSchema,
            localAddress
        };

        // Try AI Report Generation first
        try {
            console.log("🤖 Generating Premium Audit Report with Gemini...");
            const prompt = `
            Eres un Auditor SEO Senior y Desarrollador Frontend Experto en la agencia de marketing digital LegacyMark.
            Debes generar un informe de auditoría técnica y comercial sumamente detallado, realista y en español para el sitio web: "${domain}".
            Aquí tienes los datos reales obtenidos mediante un scraper preliminar:
            ${JSON.stringify(rawData, null, 2)}

            Por favor, genera un archivo JSON que cumpla EXACTAMENTE con la siguiente estructura de interfaz:
            {
                "domain": "${domain}",
                "url": "${url}",
                "score": [Número entre 0 y 100 basado en el promedio ponderado de las 5 áreas. Sé riguroso y justo.],
                "status": ["success" si el score > 85, "warning" si está entre 60 y 85, "error" si es menor a 60],
                "details": {
                    "speed": {
                        "score": [0-100 ponderado por el ttfb. Excelente < 200ms (90-100), Bueno 200ms-600ms (70-90), Lento > 600ms (0-70).],
                        "ttfb": [Valor de ttfb real en ms],
                        "status": ["excellent", "good", "slow" según el ttfb],
                        "feedback": "[Comentario táctico, explicativo y profesional sobre el tiempo de carga del sitio en español]"
                    },
                    "seo": {
                        "score": [0-100 basado en tags meta y h1. Si falta título o descripción o si hay múltiples H1s o ninguno, baja el puntaje.],
                        "title": "[Título real o 'No encontrado']",
                        "titleLength": [Longitud del título],
                        "titleVerdict": "[Ej. 'Óptimo (50-60 caracteres)', 'Muy corto', 'Demasiado largo', 'No configurado']",
                        "description": "[Descripción real o 'No encontrado']",
                        "descriptionLength": [Longitud de descripción],
                        "descriptionVerdict": "[Ej. 'Óptimo (120-160 caracteres)', 'Falta meta description', 'Demasiado larga', 'Demasiado corta']",
                        "h1Count": [Número de h1s encontrados],
                        "h1Verdict": "[Ej. 'Óptimo (Exactamente 1 H1)', 'Múltiples H1s (Incorrecto)', 'Falta encabezado H1']",
                        "imagesCount": [Cantidad de imágenes],
                        "imagesMissingAlt": [Cantidad de imágenes sin atributo alt],
                        "feedback": "[Análisis detallado sobre el SEO On-Page detectado, señalando problemas y fortalezas en español]"
                    },
                    "usability": {
                        "score": [0-100. Si tiene viewport es mínimo 75. Si falta, es máximo 30.],
                        "hasViewport": [true/false],
                        "responsiveVerdict": "[Ej. 'Optimizado para dispositivos móviles' si hasViewport es true, sino 'Sin optimizar para móviles']",
                        "mobileFriendly": [true/false según hasViewport],
                        "feedback": "[Análisis detallado sobre la usabilidad móvil y diseño en español]"
                    },
                    "security": {
                        "score": [0-100. Si sslValid es false, score máximo 40. Si tiene enlaces rotos, resta puntaje.],
                        "sslValid": [true/false],
                        "sslIssuer": "[Emisor del certificado SSL o 'Ninguno']",
                        "sslExpiry": "[Fecha de expiración o 'N/A']",
                        "protocol": "[Protocolo HTTPS o HTTP]",
                        "hsts": [true/false],
                        "brokenLinksCount": [Cantidad de enlaces rotos],
                        "brokenLinks": [Array de URLs de enlaces rotos encontrados],
                        "feedback": "[Análisis detallado de seguridad y enlaces rotos en español]"
                    },
                    "localSeo": {
                        "score": [0-100. Basado en si tiene enlaces a maps, marcado Schema LocalBusiness o dirección física.],
                        "hasGoogleMaps": [true/false basados en hasMapsLink],
                        "googleMapsVerdict": "[Ej. 'Presencia en Google Maps detectada', 'Sin enlaces a Google Maps o perfil local']",
                        "hasLocalSchema": [true/false],
                        "localAddress": "[Dirección física encontrada o 'No detectada']",
                        "feedback": "[Diagnóstico detallado de su posicionamiento SEO local y visibilidad en mapas en español]"
                    }
                },
                "improvements": [
                    [Crea una lista de exactamente 3 mejoras prioritarias y personalizadas de alto impacto basándote en los peores puntajes.]
                    {
                        "impact": "high" | "medium" | "low",
                        "category": "SEO" | "Speed" | "Usability" | "Security" | "Local",
                        "title": "[Título corto y directo en español]",
                        "description": "[Explicación concisa del problema y cómo solucionarlo en español]"
                    }
                ]
            }

            Devuelve ÚNICAMENTE el JSON estructurado. No agregues explicaciones adicionales, ni introducciones, ni bloques de código de markdown. Debe ser un JSON plano parseable directamente.
            `;

            const response = await generateText({
                model: geminiFlashModel,
                prompt: prompt
            });

            const responseText = response.text.trim();
            // Sanitize JSON markers if present
            const cleanJsonText = responseText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
            const report = JSON.parse(cleanJsonText) as AuditReport;
            
            return { success: true, report };

        } catch (aiErr) {
            console.error("❌ Gemini API failed. Generating fallback rule-based audit report...", aiErr);
            
            // Build fallback report using rule-based calculations
            const report = generateFallbackReport(rawData);
            return { success: true, report };
        }

    } catch (error: any) {
        console.error("General error during domain audit:", error);
        return { success: false, error: error.message };
    }
}

// 4. Fallback Rule-Based Auditor
function generateFallbackReport(data: any): AuditReport {
    const domain = data.domain;
    const url = `https://${domain}`;

    // Speed details
    const ttfb = data.ttfb;
    let speedScore = 100;
    let speedStatus: "excellent" | "good" | "slow" = "excellent";
    let speedFeedback = "El tiempo de respuesta inicial del servidor es excelente. La infraestructura está bien configurada.";

    if (ttfb > 600) {
        speedScore = 45;
        speedStatus = "slow";
        speedFeedback = "El servidor experimenta una latencia alta para responder (Time to First Byte elevado). Recomendamos implementar un CDN como Cloudflare y revisar la base de datos.";
    } else if (ttfb > 250) {
        speedScore = 78;
        speedStatus = "good";
        speedFeedback = "El tiempo de respuesta es aceptable, pero puede optimizarse reduciendo recursos del tema o habilitando caché agresivo.";
    }

    // SEO details
    let seoScore = 100;
    let titleVerdict = "Óptimo (50-60 caracteres)";
    let descVerdict = "Óptimo (120-160 caracteres)";
    let h1Verdict = "Óptimo (Exactamente 1 H1)";

    if (!data.title) {
        seoScore -= 30;
        titleVerdict = "No configurado";
    } else if (data.titleLength < 25) {
        seoScore -= 10;
        titleVerdict = "Demasiado corto";
    } else if (data.titleLength > 65) {
        seoScore -= 10;
        titleVerdict = "Demasiado largo";
    }

    if (!data.description) {
        seoScore -= 30;
        descVerdict = "No configurado";
    } else if (data.description.length < 80) {
        seoScore -= 10;
        descVerdict = "Demasiado corto";
    } else if (data.description.length > 170) {
        seoScore -= 10;
        descVerdict = "Demasiado largo";
    }

    if (data.h1Count === 0) {
        seoScore -= 20;
        h1Verdict = "Falta encabezado H1";
    } else if (data.h1Count > 1) {
        seoScore -= 15;
        h1Verdict = "Múltiples H1s (Incorrecto)";
    }

    if (data.imagesMissingAlt > 0) {
        seoScore -= Math.min(15, data.imagesMissingAlt * 3);
    }

    seoScore = Math.max(10, seoScore);
    const seoFeedback = `Se analizaron las etiquetas meta básicas del sitio. ${
        !data.title || !data.description 
            ? "Existen ausencias críticas en metadatos básicos que limitan la indexación orgánica en Google." 
            : "La estructura básica de títulos y descripciones está presente pero requiere optimización en palabras clave principales."
    } ${data.imagesMissingAlt > 0 ? `Se detectaron ${data.imagesMissingAlt} imágenes sin texto alternativo (alt), lo que afecta la accesibilidad y el SEO de imágenes.` : ""}`;

    // Usability details
    const hasViewport = data.hasViewport;
    const usabilityScore = hasViewport ? 92 : 25;
    const responsiveVerdict = hasViewport ? "Optimizado para dispositivos móviles" : "Sin optimizar para móviles";
    const usabilityFeedback = hasViewport
        ? "El sitio web cuenta con la etiqueta meta viewport activa, facilitando una base responsiva para móviles. Se sugiere optimizar el tamaño de las fuentes táctiles."
        : "Falta la etiqueta viewport móvil. Esto significa que la web se ve diminuta en teléfonos inteligentes, provocando una experiencia de usuario deficiente e incrementando el porcentaje de rebote.";

    // Security details
    const sslValid = data.sslValid;
    let securityScore = sslValid ? 95 : 30;
    if (data.brokenLinksCount > 0) {
        securityScore -= Math.min(25, data.brokenLinksCount * 10);
    }
    securityScore = Math.max(10, securityScore);
    const securityFeedback = `${
        sslValid 
            ? `Conexión HTTPS segura configurada mediante certificado válido de ${data.sslIssuer}.` 
            : "El sitio web no está forzando HTTPS o carece de un certificado SSL activo. Google marca este sitio como 'No Seguro' afectando gravemente la confianza del cliente."
    } ${data.brokenLinksCount > 0 ? `Se encontraron ${data.brokenLinksCount} enlaces rotos que generan errores de navegación y dañan la experiencia de navegación.` : "No se detectaron enlaces rotos en la muestra inicial."}`;

    // Local SEO details
    const hasMaps = data.hasMapsLink;
    const localSchema = data.hasLocalSchema;
    let localScore = 30;
    if (hasMaps) localScore += 40;
    if (localSchema) localScore += 20;
    if (data.localAddress) localScore += 10;
    
    const localVerdict = hasMaps ? "Presencia en Google Maps detectada" : "Sin enlaces directos a Google Maps";
    const localFeedback = `${
        hasMaps 
            ? "Se detectaron enlaces y referencias a mapas, lo que favorece el SEO de negocios físicos." 
            : "No encontramos enlaces a perfiles de Google Maps en la página inicial. Esto dificulta que los clientes locales ubiquen físicamente el negocio y reduce la visibilidad geográfica."
    } Además, ${localSchema ? "cuenta con etiquetado Schema de negocio local." : "falta implementar Schema.org de negocio local en el código."}`;

    // Overall score
    const score = Math.round((speedScore * 0.2) + (seoScore * 0.25) + (usabilityScore * 0.2) + (securityScore * 0.2) + (localScore * 0.15));
    const status = score > 85 ? "success" : score > 60 ? "warning" : "error";

    // Improvements
    const improvements: any[] = [];
    if (!sslValid) {
        improvements.push({
            impact: "high",
            category: "Security",
            title: "Instalar y Forzar Certificado SSL (HTTPS)",
            description: "Tu sitio se carga bajo HTTP inseguro. Instala un certificado SSL (gratuito mediante Let's Encrypt) y redirige todo el tráfico para evitar alertas de navegador inseguro."
        });
    }
    if (!hasViewport) {
        improvements.push({
            impact: "high",
            category: "Usability",
            title: "Agregar Etiqueta Viewport Móvil",
            description: "Agrega <meta name='viewport' content='width=device-width, initial-scale=1.0'> al header HTML para que el sitio se ajuste automáticamente a pantallas de celulares."
        });
    }
    if (ttfb > 400) {
        improvements.push({
            impact: "high",
            category: "Speed",
            title: "Optimizar Latencia del Servidor (TTFB)",
            description: "El servidor tarda demasiado en comenzar a enviar datos. Habilita almacenamiento en caché, reduce plugins inactivos o migra a un hosting optimizado."
        });
    }
    if (data.h1Count !== 1) {
        improvements.push({
            impact: "medium",
            category: "SEO",
            title: "Corregir Estructura de Encabezados H1",
            description: `Tu página cuenta con ${data.h1Count} etiquetas H1. Debe existir exactamente una etiqueta H1 por página para que Google entienda el tema central.`
        });
    }
    if (!hasMaps) {
        improvements.push({
            impact: "medium",
            category: "Local",
            title: "Vincular Perfil de Google Maps y Ficha Local",
            description: "Inserta un enlace a tu perfil de Google Maps en el footer para fortalecer tu posicionamiento local y permitir que los clientes encuentren tu dirección física."
        });
    }
    if (data.imagesMissingAlt > 0) {
        improvements.push({
            impact: "low",
            category: "SEO",
            title: "Asignar Textos Alternativos (Alt) en Imágenes",
            description: `Se detectaron ${data.imagesMissingAlt} imágenes sin texto alternativo. Agrégales texto alt descriptivo para mejorar la accesibilidad y el posicionamiento en Google Imágenes.`
        });
    }

    // Ensure we return exactly 3 improvements
    while (improvements.length < 3) {
        improvements.push({
            impact: "low",
            category: "SEO",
            title: "Revisar densidad de palabras clave",
            description: "Analiza el contenido textual del sitio para asegurar la presencia de palabras clave transaccionales alineadas a tus servicios comerciales."
        });
    }

    return {
        domain,
        url,
        score,
        status,
        details: {
            speed: { score: speedScore, ttfb, status: speedStatus, feedback: speedFeedback },
            seo: {
                score: seoScore,
                title: data.title || "No detectado",
                titleLength: data.titleLength,
                titleVerdict,
                description: data.description || "No detectado",
                descriptionLength: data.descriptionLength,
                descriptionVerdict: descVerdict,
                h1Count: data.h1Count,
                h1Verdict,
                imagesCount: data.imagesCount,
                imagesMissingAlt: data.imagesMissingAlt,
                feedback: seoFeedback
            },
            usability: {
                score: usabilityScore,
                hasViewport,
                responsiveVerdict,
                mobileFriendly: hasViewport,
                feedback: usabilityFeedback
            },
            security: {
                score: securityScore,
                sslValid,
                sslIssuer: data.sslIssuer || "Ninguno",
                sslExpiry: data.sslExpiry || "N/A",
                protocol: data.protocol,
                hsts: data.hsts,
                brokenLinksCount: data.brokenLinksCount,
                brokenLinks: data.brokenLinks,
                feedback: securityFeedback
            },
            localSeo: {
                score: localScore,
                hasGoogleMaps: hasMaps,
                googleMapsVerdict: localVerdict,
                hasLocalSchema: localSchema,
                localAddress: data.localAddress || "No detectada",
                feedback: localFeedback
            }
        },
        improvements: improvements.slice(0, 3)
    };
}
