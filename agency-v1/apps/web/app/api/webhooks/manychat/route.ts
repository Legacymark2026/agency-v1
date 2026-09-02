import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/auth-api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { runWorkflow } from "@/lib/workflow-executor";
import { ManyChatService, ManyChatDynamicResponse } from "@/lib/integrations/manychat";

// ==========================================
// 1. ZOD VALIDATION SCHEMA
// ==========================================
const ManyChatRequestSchema = z.object({
    subscriber_id: z.union([z.string(), z.number()]),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    gender: z.string().optional(),
    profile_pic: z.string().optional(),
    live_chat_url: z.string().optional(),
    channel: z.string().optional().default("INSTAGRAM"),
    page_id: z.string().optional(),
    custom_fields: z.record(z.unknown()).optional().default({}),
    tags: z.array(z.string()).optional().default([]),
    last_input_text: z.string().optional(),
    user_question: z.string().optional(),
    action: z.enum(["lead_capture", "live_chat", "ai_query", "sync"]).optional().default("lead_capture"),
});

// ==========================================
// 2. HEALTH CHECK / VERIFY ENDPOINT
// ==========================================
export async function GET() {
    return NextResponse.json({
        status: "ok",
        service: "Agency v1 - ManyChat Dynamic Webhook",
        supportedActions: ["lead_capture", "live_chat", "ai_query", "sync"],
        timestamp: new Date().toISOString(),
    });
}

// ==========================================
// 3. MAIN WEBHOOK HANDLER
// ==========================================
export async function POST(req: NextRequest) {
    try {
        // A. Autenticación Robusta (API Key o Shared Secret)
        const apiKey = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("apiKey");
        const webhookSecret = req.headers.get("x-manychat-secret") || req.nextUrl.searchParams.get("secret");

        let companyId: string | null = null;

        if (apiKey) {
            const auth = await validateApiKey(apiKey);
            if (auth) {
                companyId = auth.companyId;
            }
        }

        // Validación alternativa con Shared Secret o fallback de compañía
        if (!companyId && webhookSecret && process.env.MANYCHAT_WEBHOOK_SECRET) {
            if (webhookSecret === process.env.MANYCHAT_WEBHOOK_SECRET) {
                const defaultCompany = await prisma.company.findFirst({ select: { id: true } });
                companyId = defaultCompany?.id || null;
            }
        }

        // Parámetro explícito de compañía si la API Key es maestra
        if (!companyId) {
            const requestedCompanyId = req.nextUrl.searchParams.get("companyId");
            if (requestedCompanyId) {
                const comp = await prisma.company.findUnique({
                    where: { id: requestedCompanyId },
                    select: { id: true },
                });
                if (comp) companyId = comp.id;
            }
        }

        if (!companyId) {
            return NextResponse.json(
                {
                    version: "v2",
                    content: {
                        messages: [
                            {
                                type: "text",
                                text: "Error de autenticación: API Key o secreto inválido en la plataforma CRM.",
                            },
                        ],
                    },
                },
                { status: 401 }
            );
        }

        // B. Parseo y Validación del Payload
        const rawBody = await req.json().catch(() => ({}));
        const parseResult = ManyChatRequestSchema.safeParse(rawBody);

        if (!parseResult.success) {
            return NextResponse.json(
                {
                    version: "v2",
                    content: {
                        messages: [
                            {
                                type: "text",
                                text: "Error en los datos recibidos desde ManyChat. Revisa el payload.",
                            },
                        ],
                    },
                    errors: parseResult.error.format(),
                },
                { status: 400 }
            );
        }

        const data = parseResult.data;
        const subscriberId = String(data.subscriber_id);
        const channelNormalized = data.channel.toUpperCase();

        // Determinar nombre completo
        const fullName =
            data.name ||
            [data.first_name, data.last_name].filter(Boolean).join(" ") ||
            `Usuario ${channelNormalized} (${subscriberId})`;

        // Determinar email (con fallback seguro para respetar la unicidad en Prisma)
        const finalEmail =
            data.email?.trim() ||
            (data.custom_fields?.email as string)?.trim() ||
            `manychat_${subscriberId}@${data.channel.toLowerCase()}.agency.lead`;

        const phone = data.phone || (data.custom_fields?.phone as string) || null;

        // C. Manejo según la acción solicitada
        switch (data.action) {
            // ─────────────────────────────────────────────────────────
            // 1. CAPTURA DE LEADS (Lead Capture & Growth Tools)
            // ─────────────────────────────────────────────────────────
            case "lead_capture": {
                // Extracción de parámetros UTM de custom_fields
                const utmSource = (data.custom_fields?.utm_source as string) || `manychat_${data.channel.toLowerCase()}`;
                const utmMedium = (data.custom_fields?.utm_medium as string) || "social_automation";
                const utmCampaign = (data.custom_fields?.utm_campaign as string) || undefined;
                const utmContent = (data.custom_fields?.utm_content as string) || undefined;
                const utmTerm = (data.custom_fields?.utm_term as string) || undefined;

                // Upsert del Lead en la base de datos
                const lead = await prisma.lead.upsert({
                    where: {
                        companyId_email: {
                            companyId,
                            email: finalEmail,
                        },
                    },
                    update: {
                        name: fullName,
                        phone: phone || undefined,
                        utmSource,
                        utmMedium,
                        utmCampaign,
                        utmContent,
                        utmTerm,
                        message: data.last_input_text || undefined,
                    },
                    create: {
                        companyId,
                        email: finalEmail,
                        name: fullName,
                        phone,
                        source: `MANYCHAT_${channelNormalized}`,
                        medium: utmMedium,
                        utmSource,
                        utmMedium,
                        utmCampaign,
                        utmContent,
                        utmTerm,
                        message: data.last_input_text || null,
                        status: "NEW",
                        score: 15,
                    },
                });

                // Disparar Workflows automáticos si existen para ManyChat o Webhooks externos
                const workflow = await prisma.workflow.findFirst({
                    where: {
                        companyId,
                        isActive: true,
                        triggerType: { in: ["MANYCHAT_LEAD", "EXTERNAL_WEBHOOK"] },
                    },
                });

                if (workflow) {
                    runWorkflow(workflow.id, {
                        leadId: lead.id,
                        origin: "manychat",
                        channel: channelNormalized,
                        subscriberId,
                        customFields: data.custom_fields,
                        _companyId: companyId,
                    }).catch((err) => console.error("[ManyChat Webhook] Workflow execution error:", err));
                }

                // Respuesta compatible con ManyChat Dynamic Block v2
                const response: ManyChatDynamicResponse = ManyChatService.buildDynamicResponse({
                    text: `¡Listo, ${data.first_name || "amig@"}! Tus datos han quedado registrados correctamente.`,
                    actions: [
                        { action: "set_field_value", field_name: "crm_lead_id", value: lead.id },
                        { action: "add_tag", tag_name: "crm_sincronizado" },
                    ],
                });

                return NextResponse.json(response);
            }

            // ─────────────────────────────────────────────────────────
            // 2. TRASPASO A ASESOR HUMANO (Live Chat Handover)
            // ─────────────────────────────────────────────────────────
            case "live_chat": {
                // 1. Buscar o crear la conversación en el Inbox de Agency v1
                let conversation = await prisma.conversation.findFirst({
                    where: {
                        companyId,
                        platformId: subscriberId,
                        channel: channelNormalized,
                    },
                });

                const lastPreview = data.last_input_text || "El usuario solicitó hablar con un asesor humano desde ManyChat.";

                if (!conversation) {
                    conversation = await prisma.conversation.create({
                        data: {
                            companyId,
                            channel: channelNormalized,
                            platformId: subscriberId,
                            status: "OPEN",
                            priority: "HIGH",
                            lastMessagePreview: lastPreview,
                            lastMessageAt: new Date(),
                            metadata: {
                                manychat_subscriber_id: subscriberId,
                                live_chat_url: data.live_chat_url,
                                profile_pic: data.profile_pic,
                                handed_over_at: new Date().toISOString(),
                            },
                        },
                    });
                } else {
                    conversation = await prisma.conversation.update({
                        where: { id: conversation.id },
                        data: {
                            status: "OPEN",
                            priority: "HIGH",
                            lastMessagePreview: lastPreview,
                            lastMessageAt: new Date(),
                            unreadCount: { increment: 1 },
                        },
                    });
                }

                // 2. Registrar el mensaje en la conversación
                await prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        direction: "INBOUND",
                        content: lastPreview,
                        type: "TEXT",
                        senderId: subscriberId,
                        status: "RECEIVED",
                        metadata: {
                            source: "manychat_handover",
                            pageId: data.page_id,
                        },
                    },
                });

                // 3. Pausar el bot de ManyChat para que el asesor humano tome el control
                try {
                    const manychat = await ManyChatService.forCompany(companyId);
                    await manychat.pauseBot(subscriberId);
                } catch (botErr) {
                    console.warn("[ManyChat Webhook] Could not pause bot remotely:", botErr);
                }

                const response: ManyChatDynamicResponse = ManyChatService.buildDynamicResponse({
                    text: "He conectado tu conversación con nuestro equipo. Un asesor humano te responderá directamente por aquí en breve.",
                    actions: [
                        { action: "add_tag", tag_name: "atendido_por_humano" },
                        { action: "set_field_value", field_name: "crm_conversation_id", value: conversation.id },
                    ],
                });

                return NextResponse.json(response);
            }

            // ─────────────────────────────────────────────────────────
            // 3. CEREBRO IA (Generative AI Response con Gemini)
            // ─────────────────────────────────────────────────────────
            case "ai_query": {
                const query = data.user_question || data.last_input_text;
                let aiReply = "Gracias por tu mensaje. Un asesor te responderá a la brevedad.";

                if (query && process.env.GEMINI_API_KEY) {
                    try {
                        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

                        const systemPrompt = `
                            Eres el asistente virtual inteligente de atención y ventas de nuestra agencia.
                            El usuario te está escribiendo a través de ${data.channel} (ManyChat).
                            Nombre del cliente: ${fullName}
                            Pregunta: "${query}"

                            Instrucciones:
                            - Responde de forma cálida, concisa y persuasiva.
                            - Máximo 2 párrafos cortos (ideal para lectura rápida en móvil).
                            - Invita al usuario a dar el siguiente paso o hablar con un asesor si es necesario.
                        `;

                        const aiResult = await model.generateContent(systemPrompt);
                        const textResponse = aiResult.response.text();
                        if (textResponse) {
                            aiReply = textResponse.trim();
                        }
                    } catch (aiErr) {
                        console.error("[ManyChat Webhook] Gemini AI Error:", aiErr);
                    }
                }

                const response: ManyChatDynamicResponse = ManyChatService.buildDynamicResponse({
                    text: aiReply,
                    quickReplies: [
                        { type: "node", caption: "Hablar con asesor" },
                        { type: "node", caption: "Ver servicios" },
                    ],
                });

                return NextResponse.json(response);
            }

            // ─────────────────────────────────────────────────────────
            // 4. SYNC GENERAL
            // ─────────────────────────────────────────────────────────
            case "sync":
            default: {
                const response: ManyChatDynamicResponse = ManyChatService.buildDynamicResponse({
                    text: "Sincronización con CRM completada.",
                    actions: [
                        { action: "add_tag", tag_name: "sync_ok" },
                    ],
                });
                return NextResponse.json(response);
            }
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[ManyChat Webhook] Internal server error:", msg);

        return NextResponse.json(
            {
                version: "v2",
                content: {
                    messages: [
                        {
                            type: "text",
                            text: "Ocurrió un error temporal al procesar la solicitud en el CRM.",
                        },
                    ],
                },
                error: msg,
            },
            { status: 500 }
        );
    }
}
