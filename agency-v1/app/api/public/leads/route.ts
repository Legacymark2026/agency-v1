import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public Lead Capture API (Simplified)
 * 
 * POST /api/public/leads
 * 
 * For landing pages, lead magnets, and public forms
 * No companyId required - uses default company
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { name, email, resourceId, source } = body;

        if (!email) {
            return NextResponse.json(
                { success: false, error: "Email es requerido" },
                { status: 400 }
            );
        }

        if (!name || name.length < 2) {
            return NextResponse.json(
                { success: false, error: "Nombre es requerido" },
                { status: 400 }
            );
        }

        const DEFAULT_COMPANY_ID = "default";

        const lead = await prisma.lead.create({
            data: {
                email,
                name,
                source: source || "lead_magnet",
                formId: resourceId || "lead_magnet_form",
                companyId: DEFAULT_COMPANY_ID,
                status: "NEW",
                score: 50,
                formData: {
                    resourceId: resourceId || null,
                    source: source || "lead_magnet",
                    capturedAt: new Date().toISOString()
                },
            }
        });

        console.log("Lead capturado:", { 
            id: lead.id, 
            name: lead.name, 
            email: lead.email, 
            resourceId, 
            source,
            timestamp: new Date() 
        });

        return NextResponse.json({
            success: true,
            message: "Lead capturado correctamente",
            data: {
                id: lead.id,
                name: lead.name,
                email: lead.email,
            }
        });

    } catch (error: any) {
        console.error("Lead capture error:", error);

        if (error.code === 'P2002') {
            return NextResponse.json(
                { success: false, error: "Este email ya está registrado" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: "Error al capturar el lead" },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        endpoint: "/api/public/leads",
        method: "POST",
        description: "API pública para captura de leads desde landing pages y lead magnets",
        body: {
            name: "string (requerido)",
            email: "string (requerido)",
            resourceId: "string (opcional)",
            source: "string (opcional)"
        }
    });
}