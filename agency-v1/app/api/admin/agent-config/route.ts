import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { AGENCY_SYSTEM_PROMPT } from "@/lib/ai/system-prompt"; // Fallback if no DB record

// GET current agent config
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

        const companyId = (session.user as any)?.companyId || session.user.id;

        let config = await prisma.agentConfig.findUnique({
            where: { companyId },
        });

        if (!config) {
            // Return defaults if none exists
            return NextResponse.json({
                config: {
                    systemPrompt: AGENCY_SYSTEM_PROMPT,
                    llmModel: "gemini-2.0-flash-lite",
                    temperature: 0.7,
                    maxTokens: 1024,
                    adminWhatsappPhone: process.env.ADMIN_WHATSAPP_PHONE || "",
                    monthlySalesTarget: 10000,
                    isActive: true
                }
            });
        }

        return NextResponse.json({ config });
    } catch (error) {
        console.error("Agent Config GET error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST/PUT agent config
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

        const companyId = (session.user as any)?.companyId || session.user.id;
        const body = await req.json();

        const data = {
            systemPrompt: body.systemPrompt,
            llmModel: body.llmModel,
            temperature: parseFloat(body.temperature) || 0.7,
            maxTokens: parseInt(body.maxTokens) || 1024,
            adminWhatsappPhone: body.adminWhatsappPhone || null,
            monthlySalesTarget: parseFloat(body.monthlySalesTarget) || null,
            isActive: body.isActive !== undefined ? body.isActive : true,
        };

        const config = await prisma.agentConfig.upsert({
            where: { companyId },
            update: data,
            create: {
                ...data,
                companyId,
            },
        });

        return NextResponse.json({ success: true, config });
    } catch (error) {
        console.error("Agent Config POST error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
