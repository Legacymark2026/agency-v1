import { NextResponse } from "next/server";
import { getAvailableModels } from "@/lib/universal-model-registry";

/**
 * GET /api/ai/models
 * Devuelve el catálogo completo de modelos de IA disponibles para
 * la UI de configuración de agentes.
 */
export async function GET() {
    const models = getAvailableModels();
    return NextResponse.json({ models });
}
