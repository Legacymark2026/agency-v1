import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    try {
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        const rateLimitKey = `sign_proposal_${token}_${ip}`;
        
        // 5 intentos por cada 10 minutos
        if (!rateLimit(rateLimitKey, 5, 10 * 60 * 1000)) {
            return NextResponse.json({ error: "Demasiados intentos. Por favor espera." }, { status: 429 });
        }

        const body = await req.json();
        const { signature, clientIp } = body; // signature is base64
        
        if (!signature) {
            return NextResponse.json({ error: "Firma (signature) es requerida." }, { status: 400 });
        }

        const proposal = await prisma.proposal.findUnique({
            where: { token }
        });

        if (!proposal) return NextResponse.json({ error: "Propuesta no encontrada." }, { status: 404 });

        if (proposal.status === "SIGNED") {
            return NextResponse.json({ error: "Esta propuesta ya fue firmada." }, { status: 400 });
        }

        // Marcar como firmada, procesar deal si lo hay.
        const updatedProposal = await prisma.proposal.update({
            where: { id: proposal.id },
            data: {
                status: "SIGNED",
                signature: signature,
                clientIp: clientIp,
                signedAt: new Date()
            }
        });

        // Si la propuesta tiene un Trato (Deal) vinculado, automáticamente ponerlo en WON (Ganado)
        if (updatedProposal.dealId) {
            await prisma.deal.update({
                where: { id: updatedProposal.dealId },
                data: { stage: "WON" }
            });
            // NOTA: Acá podríamos crear automáticamente el KanbanProject asociado usando el mismo dealId.
        }

        return NextResponse.json({ success: true, proposal: updatedProposal });
    } catch (error: any) {
        console.error("PUBLIC_PROPOSAL_SIGN_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
