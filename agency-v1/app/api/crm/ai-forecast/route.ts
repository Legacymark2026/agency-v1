import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/crm/ai-forecast?companyId=xxx
 * Genera una predicción de cierre de pipeline usando Gemini.
 */
export async function GET(request: NextRequest) {
    const companyId = request.nextUrl.searchParams.get("companyId");
    if (!companyId) return NextResponse.json({ error: "Missing companyId" }, { status: 400 });

    try {
        // 1. Recopilar datos del pipeline
        const [deals, wonLast30, wonLast60] = await Promise.all([
            prisma.deal.findMany({
                where: { companyId, stage: { notIn: ["WON", "LOST"] } },
                select: { id: true, title: true, value: true, stage: true, probability: true, lastActivity: true, expectedClose: true, assignedTo: true },
            }),
            prisma.deal.count({ where: { companyId, stage: "WON", updatedAt: { gte: new Date(Date.now() - 30 * 86400000) } } }),
            prisma.deal.count({ where: { companyId, stage: "WON", updatedAt: { gte: new Date(Date.now() - 60 * 86400000) } } }),
        ]);

        const pipelineValue = deals.reduce((s, d) => s + d.value, 0);
        const weightedValue = deals.reduce((s, d) => s + d.value * (d.probability / 100), 0);
        const stagnantCount = deals.filter(d => {
            const daysSince = (Date.now() - new Date(d.lastActivity).getTime()) / 86400000;
            return daysSince > 10;
        }).length;
        const conversionRate30 = wonLast30;
        const growthRate = wonLast60 > 0 ? (wonLast30 / wonLast60 - 1) * 100 : 0;

        // 2. Obtener la API key de Gemini desde IntegrationConfig
        const geminiConfig = await prisma.integrationConfig.findFirst({
            where: { companyId, provider: "gemini" },
            select: { config: true },
        });

        const apiKey = (geminiConfig?.config as any)?.apiKey ?? process.env.GEMINI_API_KEY;

        if (!apiKey) {
            // Fallback: Forecast algorítmico sin AI
            const forecast = generateAlgorithmicForecast({ pipelineValue, weightedValue, stagnantCount, deals, growthRate });
            return NextResponse.json({ ...forecast, source: "algorithmic" });
        }

        // 3. Llamar a Gemini API
        const prompt = `Eres un experto en forecasting de ventas B2B. Analiza el siguiente pipeline y genera una predicción de cierre para los próximos 30 días.

DATOS DEL PIPELINE:
- Total de deals activos: ${deals.length}
- Valor total del pipeline: $${pipelineValue.toFixed(0)}
- Valor ponderado (por probabilidad): $${weightedValue.toFixed(0)}
- Deals estancados (>10 días sin actividad): ${stagnantCount}
- Deals ganados últimos 30 días: ${conversionRate30}
- Crecimiento vs mes anterior: ${growthRate.toFixed(1)}%
- Etapas actuales: ${JSON.stringify(deals.reduce((acc: any, d) => { acc[d.stage] = (acc[d.stage] ?? 0) + 1; return acc; }, {}))}

Responde EXACTAMENTE en este formato JSON:
{
  "predictedRevenue": <número en USD>,
  "confidenceScore": <0-100>,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "keyInsights": [<string>, <string>, <string>],
  "recommendations": [<string>, <string>],
  "bestCaseRevenue": <número>,
  "worstCaseRevenue": <número>
}`;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
                }),
            }
        );

        const raw = await geminiRes.json();
        const text = raw.candidates?.[0]?.content?.parts?.[0]?.text;
        const aiData = JSON.parse(text);

        return NextResponse.json({
            ...aiData,
            pipelineValue,
            weightedValue,
            activeDealCount: deals.length,
            source: "gemini",
        });

    } catch (error) {
        console.error("[AI FORECAST] Error:", error);
        // Fallback algorítmico si Gemini falla
        const deals = await prisma.deal.findMany({ where: { companyId, stage: { notIn: ["WON", "LOST"] } }, select: { value: true, probability: true, lastActivity: true } });
        const pipelineValue = deals.reduce((s, d) => s + d.value, 0);
        const weightedValue = deals.reduce((s, d) => s + d.value * (d.probability / 100), 0);
        const stagnantCount = deals.filter(d => (Date.now() - new Date(d.lastActivity).getTime()) / 86400000 > 10).length;
        return NextResponse.json({ ...generateAlgorithmicForecast({ pipelineValue, weightedValue, stagnantCount, deals, growthRate: 0 }), source: "algorithmic_fallback" });
    }
}

function generateAlgorithmicForecast({ pipelineValue, weightedValue, stagnantCount, deals, growthRate }: any) {
    const stagnantRatio = deals.length > 0 ? stagnantCount / deals.length : 0;
    const riskLevel = stagnantRatio > 0.5 ? "HIGH" : stagnantRatio > 0.25 ? "MEDIUM" : "LOW";
    const confidenceScore = Math.max(30, Math.min(85, 70 - stagnantRatio * 40 + growthRate * 0.5));

    return {
        predictedRevenue: Math.round(weightedValue * 0.75),
        confidenceScore: Math.round(confidenceScore),
        riskLevel,
        bestCaseRevenue: Math.round(weightedValue),
        worstCaseRevenue: Math.round(weightedValue * 0.4),
        pipelineValue,
        weightedValue,
        activeDealCount: deals.length,
        keyInsights: [
            `${stagnantCount} deals sin actividad reciente (>${10} días)`,
            `Valor ponderado del pipeline: $${weightedValue.toFixed(0)}`,
            riskLevel === "HIGH" ? "Alto riesgo de stagnación en el pipeline" : "Pipeline en buen estado",
        ],
        recommendations: [
            stagnantCount > 0 ? `Activar seguimiento en ${stagnantCount} deals estancados` : "Mantener ritmo de actividad actual",
            "Revisar deals en etapa PROPOSAL para acelerar decisión del cliente",
        ],
    };
}
