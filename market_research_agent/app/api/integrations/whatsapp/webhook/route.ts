import { NextRequest, NextResponse } from "next/server";
import { getIntegrationConfig } from "@/actions/integration-config";
import crypto from "crypto";
import { handleIncomingWhatsAppMessage } from "@/lib/whatsapp-service";

// 1. VERIFICACIÓN DEL WEBHOOK (GET)
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const mode = searchParams.get("hub.mode");
        const token = searchParams.get("hub.verify_token");
        const challenge = searchParams.get("hub.challenge");

        if (mode && token) {
            // Obtener configuración de la DB para comparar el token
            const config = await getIntegrationConfig('whatsapp');
            const myVerifyToken = config?.verifyToken || process.env.WHATSAPP_VERIFY_TOKEN;

            if (mode === "subscribe" && token === myVerifyToken) {
                console.log("[WhatsApp Webhook] Verificación exitosa.");
                return new NextResponse(challenge, { status: 200 });
            } else {
                console.error("[WhatsApp Webhook] Fallo de verificación. Token incorrecto.");
                return new NextResponse("Forbidden", { status: 403 });
            }
        }
        return new NextResponse("Bad Request", { status: 400 });

    } catch (error) {
        console.error("[WhatsApp Webhook] Error en GET:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// 2. RECEPCIÓN DE MENSAJES (POST)
export async function POST(req: NextRequest) {
    try {
        // 1. Validar Firma (Seguridad)
        const bodyText = await req.text();
        const signature = req.headers.get("x-hub-signature-256");

        const config = await getIntegrationConfig('whatsapp');
        const appSecret = config?.appSecret || process.env.FACEBOOK_CLIENT_SECRET;

        if (!appSecret) {
            console.error("[WhatsApp Webhook] Falta App Secret en configuración.");
            // Respondemos 200 para no bloquear a Meta, pero logueamos el error grave
            return new NextResponse("Configuration Error", { status: 200 });
        }

        if (!signature) {
            console.warn("[WhatsApp Webhook] Falta firma X-Hub-Signature-256.");
            // En producción estricta devolveríamos 401, pero para debug inicial a veces se permite
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const expectedSignature = "sha256=" + crypto
            .createHmac("sha256", appSecret)
            .update(bodyText)
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("[WhatsApp Webhook] Firma inválida.");
            // console.error(`[Debug] Recibido: ${signature}, Calculado: ${expectedSignature}`);
            return new NextResponse("Forbidden", { status: 403 });
        }

        // 2. Procesar Payload
        const body = JSON.parse(bodyText);

        // Verificar si es un evento de mensaje
        if (body.object === "whatsapp_business_account") {
            if (body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const message = body.entry[0].changes[0].value.messages[0];
                const contact = body.entry[0].changes[0].value.contacts?.[0]; // Info del remitente
                const metadata = body.entry[0].changes[0].value.metadata; // Info del negocio (phone_number_id)

                // Delegar al CRM Action para guardar/sincronizar
                // Usamos `waitUntil` si Vercel lo soporta, o simplemente esperamos (await)
                await handleIncomingWhatsAppMessage({
                    message,
                    contact,
                    metadata
                });
            }
        }

        // Siempre devolver 200 a Meta inmediatamente
        return new NextResponse("EVENT_RECEIVED", { status: 200 });

    } catch (error) {
        console.error("[WhatsApp Webhook] Error en POST:", error);
        // Aun en error, intentamos responder 200 para que Meta no reintente infinitamente si es un error lógico nuestro
        return new NextResponse("Internal Server Error", { status: 200 });
    }
}
