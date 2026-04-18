import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    try {
        const proposal = await prisma.proposal.findUnique({
            where: { token },
            include: {
                items: true,
                company: { 
                    select: { 
                        name: true, 
                        logoUrl: true, 
                        defaultCompanySettings: true 
                    } 
                },
                creator: { 
                    select: { 
                        name: true, 
                        email: true 
                    } 
                }
            }
        });

        if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

        // Marcar como VISUALIZADA si estaba en DRAFT o SENT
        if (proposal.status === "DRAFT" || proposal.status === "SENT") {
            await prisma.proposal.update({
                where: { id: proposal.id },
                data: { status: "VIEWED" }
            });
            proposal.status = "VIEWED";
        }

        return NextResponse.json(proposal);
    } catch (error: any) {
        console.error("PUBLIC_PROPOSAL_GET_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
