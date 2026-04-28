import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const SYSTEM_PROMPT = `Eres un experto en automatización de marketing y CRM. Tu tarea es convertir descripciones en lenguaje natural en workflows estructurados para un sistema DAG (Directed Acyclic Graph) compatible con ReactFlow.

TIPOS DE NODOS DISPONIBLES:
- triggerNode: Punto de entrada del workflow. Solo puede haber UNO.
  data: { label: string, triggerType: "FORM_SUBMISSION" | "NEW_LEAD" | "DEAL_CREATED" | "STAGE_CHANGED" | "MANUAL" }
  
- actionNode: Ejecuta una acción.
  data: { label: string, actionType: "SEND_EMAIL" | "SEND_WHATSAPP" | "CREATE_TASK" | "UPDATE_DEAL" | "ADD_TAG" | "SEND_NOTIFICATION" | "HTTP", subject?: string, htmlBody?: string, message?: string, to?: string }
  
- conditionNode: Bifurcación condicional (salidas: "true" y "false").
  data: { label: string, variable: string, operator: "equals" | "contains" | "gt" | "lt" | "not_equals", conditionValue: string }
  
- waitNode: Espera antes de continuar.
  data: { label: string, delayValue: string, delayUnit: "m" | "h" | "d" }
  
- aiNode: Ejecuta un agente de IA.
  data: { label: string, aiTask: string, agentId?: string, prompt?: string }

REGLAS:
1. Genera IDs únicos para cada nodo (node_1, node_2, etc.)
2. Los edges deben conectar nodos lógicamente
3. conditionNode usa sourceHandle: "true" o "false" en sus edges salientes
4. Los positions deben ser razonables (x: 0-1200, y: 0-2000)
5. Siempre empieza con un triggerNode
6. Responde SOLO con JSON válido, sin markdown, sin explicaciones

FORMATO DE RESPUESTA:
{
  "name": "Nombre del workflow generado",
  "description": "Descripción breve en español",
  "nodes": [...],
  "edges": [{ "id": "e1", "source": "node_1", "target": "node_2", "sourceHandle": null }]
}`;

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { description, companyId } = await req.json();
    if (!description || typeof description !== "string") {
        return NextResponse.json({ error: "description is required" }, { status: 400 });
    }
    if (description.length > 2000) {
        return NextResponse.json({ error: "description too long (max 2000 chars)" }, { status: 400 });
    }

    // Get company-specific Gemini key or fall back to global
    let apiKey = process.env.GEMINI_API_KEY;
    if (companyId) {
        try {
            const integration = await prisma.integrationConfig.findFirst({
                where: { companyId, provider: "GEMINI", isEnabled: true },
            });
            if (integration?.config && typeof integration.config === "object") {
                const cfg = integration.config as { apiKey?: string };
                if (cfg.apiKey) apiKey = cfg.apiKey;
            }
        } catch { /* use global key */ }
    }

    if (!apiKey) {
        return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
        },
    });

    const prompt = `${SYSTEM_PROMPT}\n\nDescripción del usuario:\n"${description}"`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    let parsed: any;
    try {
        // Strip markdown fences if model adds them despite responseMimeType
        const clean = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
        parsed = JSON.parse(clean);
    } catch {
        console.error("[AI Copilot] Invalid JSON from Gemini:", rawText.substring(0, 500));
        return NextResponse.json({ error: "AI returned invalid JSON. Try rephrasing." }, { status: 422 });
    }

    // Validate minimal structure
    if (!parsed.nodes || !Array.isArray(parsed.nodes) || !parsed.edges || !Array.isArray(parsed.edges)) {
        return NextResponse.json({ error: "AI response missing nodes/edges" }, { status: 422 });
    }

    // Ensure at least one triggerNode
    const hasTrigger = parsed.nodes.some((n: any) => n.type === "triggerNode");
    if (!hasTrigger) {
        return NextResponse.json({ error: "AI workflow missing triggerNode" }, { status: 422 });
    }

    return NextResponse.json({
        success: true,
        workflow: {
            name: parsed.name || "Workflow IA",
            description: parsed.description || description,
            nodes: parsed.nodes,
            edges: parsed.edges,
        },
    });
}
