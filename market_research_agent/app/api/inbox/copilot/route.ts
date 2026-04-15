import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { conversationId } = body;

        if (!conversationId) return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });

        // 1. Fetch Conversation Context
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                lead: {
                    include: {
                        deal: {
                            include: {
                                proposals: { orderBy: { createdAt: 'desc' }, take: 1 }
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 10 // Last 10 messages for context
                }
            }
        });

        if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

        // 2. Fetch Gemini API Key
        const companyId = conversation.companyId;
        const geminiCfg = await prisma.integrationConfig.findFirst({
            where: { companyId, provider: "gemini" },
            select: { config: true },
        });

        const apiKey = (geminiCfg?.config as any)?.apiKey ?? process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 400 });
        }

        // 3. Prepare Prompt
        const lead = conversation.lead;
        const deal = lead?.deal;
        const proposal = deal?.proposals?.[0];
        
        // Reverse messages to chronological order
        const chatHistory = conversation.messages.reverse().map(m => 
            `${m.direction === 'INBOUND' ? 'Cliente' : 'Agente'}: ${m.content}`
        ).join('\n');

        const prompt = `Eres un copiloto de ventas (Inbox AI) para la empresa.
Tu objetivo es leer el contexto del cliente y redactar UNA ÚNICA respuesta clara, profesional y persuasiva que el agente humano enviará.

CONTEXTO DEL LEAD:
- Nombre: ${lead?.name ?? 'Desconocido'}
- Origen: ${lead?.source ?? 'Desconocido'}
${deal ? `- Deal Asociado: ${deal.title} (${deal.stage}) - Valor: $${deal.value}` : '- Sin deal activo en el CRM.'}
${proposal ? `- Última Propuesta: ${proposal.title} ($${proposal.items?.reduce((acc: any, i: any) => acc + i.price * i.quantity, 0)}) - Estado: ${proposal.status}` : ''}

HISTORIAL DE CHAT RECIENTE:
${chatHistory}

INSTRUCCIONES:
1. Responde de forma cálida, profesional y directa.
2. Si el cliente pregunta por la propuesta, haz referencia a ella basándote en los datos.
3. Si el cliente tiene una objeción, trátala con empatía e intenta programar una llamada o avanzar el deal.
4. NUNCA inventes precios o características que no estén en el contexto.
5. DEBES DEVOLVER ÚNICAMENTE EL TEXTO DE LA RESPUESTA, listo para ser copiado y pegado en el chat. Sin comillas, sin saludos como "Aquí tienes:", solo el mensaje final.`;

        // 4. Call Gemini
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 250 },
                }),
            }
        );

        if (!geminiRes.ok) {
            console.error("Gemini Error:", await geminiRes.text());
            return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
        }

        const raw = await geminiRes.json();
        const text = raw.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) return NextResponse.json({ error: "Empty response from AI" }, { status: 500 });

        return NextResponse.json({ suggestion: text.trim() });

    } catch (error) {
        console.error("[INBOX COPILOT] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
