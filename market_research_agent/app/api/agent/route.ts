import { auth } from "@/lib/auth";
import { triageAndRouteMessage } from "@/lib/agent-runner";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { messages, roleType } = await req.json();

        const session = await auth();
        const companyId = (session?.user as any)?.companyId || session?.user?.id;

        if (!session?.user || !companyId) {
            return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401 });
        }

        // El motor ahora resuelve el API de Gemini de forma puramente dinámica usando companyId en agent-runner.ts

        // 1. Extraer el último mensaje (el input actual) y el historial previo
        const inlineHistory = messages
            .filter((m: any) => m.role !== "system")
            .map((m: any) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }]
            }));
            
        // Quitamos el último mensaje del historial, ya que se pasa como userMessage
        const lastUserMessage = inlineHistory.pop()?.parts[0]?.text || "Hola";

        // 2. Mock Contact Data para probar las variables del System Prompt Ultra-Pro
        const contactData = {
            firstName: session?.user?.name?.split(" ")[0] || "Administrador",
            dealStage: "Evaluación de Propuesta",
            lastInteraction: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Hace 10 días para activar la regla de la memoria
            companyName: "Tu Empresa"
        };

        // 3. Ejecutar el nuevo motor cognitivo (Agent Runner)
        const result = await triageAndRouteMessage(companyId, lastUserMessage, undefined, contactData, inlineHistory);

        // 4. Simulador de Streaming (SSE compatible con Vercel AI SDK)
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                if (result.suspended) {
                    controller.enqueue(encoder.encode(`0:${JSON.stringify(result.result)}\n`));
                } else {
                    const text = result.result || "Sin respuesta del modelo.";
                    // Dividimos en pequeñas palabras para simular el typing en tiempo real conservando la latencia del Engine
                    const chunks = text.match(/.{1,4}/g) || [];
                    for (const chunk of chunks) {
                        controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
                        await new Promise(r => setTimeout(r, 10)); // Ultra rápido porque el backend ya procesó todo
                    }
                }
                
                controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`));
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Vercel-AI-Data-Stream": "v1",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error: any) {
        console.error("Agent Route Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Error interno del servidor." }),
            { status: 500 }
        );
    }
}
