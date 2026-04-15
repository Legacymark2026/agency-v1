import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * POST /api/proposals/[id]/sign
 * Body: { signature: string (base64 dataURL), clientIp?: string }
 * Ruta pública - no requiere autenticación, solo el token correcto.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const proposal = await prisma.proposal.findUnique({
            where: { id },
            include: { deal: true },
        });

        if (!proposal) {
            return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 });
        }

        if (proposal.status === "SIGNED") {
            return NextResponse.json({ error: "Esta propuesta ya fue firmada", alreadySigned: true, signedAt: proposal.signedAt });
        }

        if (proposal.expiresAt && new Date() > proposal.expiresAt) {
            return NextResponse.json({ error: "Esta propuesta ha expirado" }, { status: 410 });
        }

        const body = await request.json();
        const { signature, clientIp } = body;

        if (!signature) {
            return NextResponse.json({ error: "Firma requerida" }, { status: 400 });
        }

        const ip = clientIp ?? request.headers.get("x-forwarded-for") ?? "unknown";

        // 1. Marcar propuesta como firmada
        await prisma.proposal.update({
            where: { id },
            data: {
                status: "SIGNED",
                signature,
                clientIp: ip,
                signedAt: new Date(),
            },
        });

        // 2. Si hay un deal vinculado → moverlo a WON automáticamente
        if (proposal.dealId) {
            await prisma.deal.update({
                where: { id: proposal.dealId },
                data: { stage: "WON", lastActivity: new Date() },
            });

            // Registrar en historial de etapas
            await prisma.dealStageHistory.create({
                data: {
                    dealId: proposal.dealId,
                    fromStage: proposal.deal?.stage ?? "NEGOTIATION",
                    toStage: "WON",
                    note: `Deal ganado automáticamente por firma de propuesta "${proposal.title}"`,
                },
            });

            revalidatePath("/dashboard/admin/crm/pipeline");
            revalidatePath(`/dashboard/admin/crm/deals/${proposal.dealId}`);
        }

        return NextResponse.json({
            success: true,
            message: "Propuesta firmada exitosamente",
            signedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error("[SIGN API] Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

/**
 * GET /api/proposals/[id]/sign?token=xxx
 * Devuelve datos de la propuesta para la página pública de firma.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const token = request.nextUrl.searchParams.get("token");

    try {
        const proposal = await prisma.proposal.findFirst({
            where: token ? { token } : { id },
            include: {
                items: true,
                company: { select: { name: true } },
                creator: { select: { name: true, email: true } },
            },
        });

        if (!proposal) {
            return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 });
        }

        // No devolver la firma (datos sensibles)
        const { signature, clientIp, ...publicProposal } = proposal;

        return NextResponse.json({ data: publicProposal });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
