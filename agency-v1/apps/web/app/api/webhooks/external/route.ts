import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiKey } from "@/lib/auth-api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { runWorkflow } from "@/lib/workflow-executor";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const apiKey = req.headers.get("x-api-key");
        const auth = await validateApiKey(apiKey);

        if (!auth) {
            return NextResponse.json({ error: "Invalid or missing API Key" }, { status: 401 });
        }

        const { companyId } = auth;
        const payload = await req.json();

        // 1. Smart Mapping with AI
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
            Analiza el siguiente JSON proveniente de una plataforma externa (Wix/Shopify/etc).
            Extrae los datos necesarios para crear un Lead en un CRM.
            Retorna UNICAMENTE un JSON con este formato:
            {
                "name": "Nombre completo",
                "email": "correo@ejemplo.com",
                "phone": "telefono",
                "notes": "Resumen de la intención o mensaje",
                "source": "Nombre de la plataforma de origen (ej: Wix, Shopify)"
            }

            Si no encuentras un campo, usa null.
            Payload: ${JSON.stringify(payload)}
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanJson = text.replace(/```json|```/g, "").trim();
        const leadData = JSON.parse(cleanJson);

        if (!leadData.email) {
            return NextResponse.json({ error: "Could not identify email in payload" }, { status: 400 });
        }

        // 2. Create or Update Lead
        const lead = await prisma.lead.upsert({
            where: { 
                companyId_email: { 
                    companyId, 
                    email: leadData.email 
                } 
            },
            update: {
                name: leadData.name || undefined,
                phone: leadData.phone || undefined,
            },
            create: {
                companyId,
                email: leadData.email,
                name: leadData.name || "Lead Externo",
                phone: leadData.phone,
                source: leadData.source || "EXTERNAL_API",
                status: "NEW",
            }
        });

        // 3. Trigger "External Lead" Workflow if exists
        const workflow = await prisma.workflow.findFirst({
            where: { 
                companyId, 
                isActive: true,
                triggerType: "EXTERNAL_WEBHOOK" 
            }
        });

        if (workflow) {
            runWorkflow(workflow.id, {
                leadId: lead.id,
                originPayload: payload,
                mappedData: leadData,
                _companyId: companyId
            }).catch(console.error);
        }

        return NextResponse.json({
            success: true,
            message: "Data ingested successfully",
            leadId: lead.id,
            workflowTriggered: !!workflow
        });

    } catch (error: any) {
        console.error("[External Ingestion] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
