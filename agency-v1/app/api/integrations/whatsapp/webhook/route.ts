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
            const config = await getIntegrationConfig('whatsapp') as any;
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

        const config = await getIntegrationConfig('whatsapp') as any;
        const appSecret = config?.appSecret || process.env.FACEBOOK_CLIENT_SECRET;

        if (!appSecret) {
            console.error("[WhatsApp Webhook] Falta App Secret en configuración.");
            return new NextResponse("Configuration Error", { status: 200 });
        }

        if (!signature) {
            console.warn("[WhatsApp Webhook] Falta firma X-Hub-Signature-256.");
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const expectedSignature = "sha256=" + crypto
            .createHmac("sha256", appSecret)
            .update(bodyText)
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("[WhatsApp Webhook] Firma inválida.");
            return new NextResponse("Forbidden", { status: 403 });
        }

        // 2. Procesar Payload
        const body = JSON.parse(bodyText);

        if (body.object !== "whatsapp_business_account") {
            console.log("[WhatsApp Webhook] Payload no es de WhatsApp Business");
            return new NextResponse("OK", { status: 200 });
        }

        // Procesar cada entrada
        for (const entry of body.entry || []) {
            const changes = entry.changes || [];
            
            for (const change of changes) {
                const value = change.value;
                const field = change.field;
                
                console.log(`[WhatsApp Webhook] Field received: ${field}`);
                
                // ===============================================
                // HANDLER: messages (Mensajes entrantes)
                // ===============================================
                if (field === 'messages' && value.messages?.length > 0) {
                    const message = value.messages[0];
                    const contact = value.contacts?.[0];
                    const metadata = value.metadata;
                    
                    await handleIncomingWhatsAppMessage({
                        message,
                        contact,
                        metadata
                    });
                    continue;
                }
                
                // ===============================================
                // HANDLER: message_echoes (Mensajes salidos)
                // ===============================================
                if (field === 'message_echoes' && value.messages?.length > 0) {
                    await handleMessageEcho(value, config);
                    continue;
                }
                
                // ===============================================
                // HANDLER: template_category_update
                // ===============================================
                if (field === 'template_category_update') {
                    await handleTemplateCategoryUpdate(value, config);
                    continue;
                }
                
                // ===============================================
                // HANDLER: message_template_status_update
                // ===============================================
                if (field === 'message_template_status_update') {
                    await handleTemplateStatusUpdate(value, config);
                    continue;
                }
                
                // ===============================================
                // HANDLER: security_update
                // ===============================================
                if (field === 'security_update') {
                    await handleSecurityUpdate(value, config);
                    continue;
                }
                
                // ===============================================
                // HANDLER: account_update
                // ===============================================
                if (field === 'account_update') {
                    await handleAccountUpdate(value, config);
                    continue;
                }
            }
        }

        // Siempre devolver 200 a Meta inmediatamente
        return new NextResponse("EVENT_RECEIVED", { status: 200 });

    } catch (error) {
        console.error("[WhatsApp Webhook] Error en POST:", error);
        return new NextResponse("Internal Server Error", { status: 200 });
    }
}

// ===============================================
// HELPER: Handle Message Echoes (Sent Messages)
// ===============================================
async function handleMessageEcho(value: any, config: any) {
    console.log('[WhatsApp Webhook] Processing message echo:', JSON.stringify(value, null, 2));
    
    const messages = value.messages || [];
    const metadata = value.metadata;
    
    for (const msg of messages) {
        const messageId = msg.id;
        const status = msg.status;
        
        console.log(`[WhatsApp Webhook] Message ${messageId} status: ${status}`);
        
        // Update message status in DB
        // This would update the externalId status to SENT/DELIVERED/READ
    }
}

// ===============================================
// HELPER: Handle Template Category Update
// ===============================================
async function handleTemplateCategoryUpdate(value: any, config: any) {
    console.log('[WhatsApp Webhook] Processing template category update:', JSON.stringify(value, null, 2));
    
    const category = value.category;
    const templateName = value.template_name;
    const language = value.language;
    
    console.log(`[WhatsApp Webhook] Template ${templateName} category changed to: ${category}`);
    
    // Log or create notification for admin
}

// ===============================================
// HELPER: Handle Template Status Update
// ===============================================
async function handleTemplateStatusUpdate(value: any, config: any) {
    console.log('[WhatsApp Webhook] Processing template status update:', JSON.stringify(value, null, 2));
    
    const templateName = value.template_name;
    const language = value.language;
    const status = value.status; // APPROVED, REJECTED, PENDING, DISABLED
    const reason = value.reason;
    
    console.log(`[WhatsApp Webhook] Template ${templateName} (${language}) status: ${status}`);
    
    if (status === 'REJECTED') {
        console.log(`[WhatsApp Webhook] Template rejected. Reason: ${reason}`);
    }
    
    // Could create notification or log for admin dashboard
}

// ===============================================
// HELPER: Handle Security Update
// ===============================================
async function handleSecurityUpdate(value: any, config: any) {
    console.log('[WhatsApp Webhook] Processing security update:', JSON.stringify(value, null, 2));
    
    const securityType = value.security_type; // e.g., 'two_factor_added', 'phone_number_changed'
    const timestamp = value.timestamp;
    
    console.log(`[WhatsApp Webhook] Security update: ${securityType} at ${timestamp}`);
    
    // Log critical security events
}

// ===============================================
// HELPER: Handle Account Update
// ===============================================
async function handleAccountUpdate(value: any, config: any) {
    console.log('[WhatsApp Webhook] Processing account update:', JSON.stringify(value, null, 2));
    
    const accountStatus = value.account_status; // READY, PENDING, LIMITED, BANNED
    const features = value.features || [];
    
    console.log(`[WhatsApp Webhook] Account status: ${accountStatus}`);
    console.log(`[WhatsApp Webhook] Features: ${JSON.stringify(features)}`);
    
    if (accountStatus === 'BANNED' || accountStatus === 'LIMITED') {
        console.error(`[WhatsApp Webhook] CRITICAL: Account ${accountStatus}! Immediate action required.`);
        // Could trigger email alert to admin
    }
}
