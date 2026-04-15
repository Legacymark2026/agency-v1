import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        // Find the proposal
        const proposal = await prisma.proposal.findUnique({
            where: { token },
        });

        if (!proposal) {
            return NextResponse.json({ error: "Propuesta no encontrada" }, { status: 404 });
        }

        // Only update status if it's currently DRAFT or SENT
        if (proposal.status === "DRAFT" || proposal.status === "SENT") {
            await prisma.proposal.update({
                where: { token },
                data: {
                    status: "VIEWED",
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating proposal view status:", error);
        return NextResponse.json({ error: "Ocurrió un error al actualizar el estado" }, { status: 500 });
    }
}
