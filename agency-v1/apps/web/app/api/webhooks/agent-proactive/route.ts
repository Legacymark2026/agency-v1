import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triageAndRouteMessage } from "@/lib/agent-runner";

// Secreto para validar que la petición viene de nuestros propios webhooks o servicios internos
const PROACTIVE_WEBHOOK_SECRET = process.env.PROACTIVE_WEBHOOK_SECRET || "legacy_internal_secret_2026";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${PROACTIVE_WEBHOOK_SECRET}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { companyId, eventType, payload, priority } = body;

        if (!companyId || !eventType) {
            return NextResponse.json({ error: "companyId and eventType are required" }, { status: 400 });
        }

        // 1. Encontrar al administrador principal para notificarle, o usar una conversación global
        const adminUser = await prisma.companyUser.findFirst({
            where: { companyId, role: { in: ["super_admin", "admin"] } },
            orderBy: { createdAt: "asc" }
        });

        if (!adminUser) {
            return NextResponse.json({ error: "No admin found for this company" }, { status: 404 });
        }

        // 2. Buscar su conversación más reciente del agente o crear una nueva
        let conversation = await prisma.agentConversation.findFirst({
            where: { companyId },
            orderBy: { updatedAt: "desc" }
        });

        if (!conversation) {
            conversation = await prisma.agentConversation.create({
                data: { companyId, status: "ACTIVE" }
            });
        }

        // 3. Formatear la orden proactiva oculta
        const proactivePrompt = `[INSTRUCCIÓN DEL SISTEMA - MODO PROACTIVO]
Ha ocurrido un evento automático en la plataforma: "${eventType}".
Datos del evento: ${JSON.stringify(payload)}
Prioridad: ${priority || 'NORMAL'}

Tu tarea: No estás respondiendo a un usuario. Estás iniciando tú la conversación. Escribe un mensaje directo al usuario informándole de este evento de manera concisa y profesional. Si tienes herramientas disponibles para manejar este evento (ej. crear un deal, mandar un correo, etc.), ofrécele al usuario hacerte cargo del problema. Espera a que el usuario te dé permiso explícito para actuar.`;

        // Mock de un userContext de sistema
        const systemContext = {
            id: adminUser.userId,
            role: "system",
            permissions: ["*"], // Tiene permisos totales para evaluar qué herramientas ofrecer
            allowedRoutes: ["*"]
        };

        // 4. Ejecutar el orquestador
        const result = await triageAndRouteMessage(
            companyId,
            proactivePrompt,
            conversation.id,
            {},
            [],
            systemContext
        );

        // Si tienes Pusher / Socket configurado, aquí lanzarías el evento de UI:
        // await pusherServer.trigger(`company-${companyId}-agent`, "new-message", { content: result.result });

        return NextResponse.json({
            success: true,
            conversationId: conversation.id,
            proactiveResponse: result.result
        });

    } catch (error: any) {
        console.error("[Proactive Agent Webhook Error]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
