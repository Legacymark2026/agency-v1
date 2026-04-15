import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const proposal = await prisma.proposal.findUnique({
            where: { id },
            include: {
                items: true,
                deal: { select: { id: true, title: true } },
                creator: { select: { name: true, email: true } }
            }
        });

        if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json(proposal);
    } catch (error: any) {
        console.error("PROPOSAL_GET_BY_ID_ERROR", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { title, content, value, currency, status, dealId, contactName, contactEmail, expiresAt, items } = body;

        // Si se pasan ítems, podríamos borrarlos todos y re-crearlos, o actualizar. 
        // Para simplicidad en "borrador", borramos los viejos y creamos nuevos si vienen en el payload.
        
        const updateData: any = {
            title,
            content,
            value: value !== undefined ? parseFloat(value) : undefined,
            currency,
            status,
            dealId,
            contactName,
            contactEmail,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        };

        if (items) {
           await prisma.proposalItem.deleteMany({ where: { proposalId: id } });
           updateData.items = {
               create: items.map((item: any) => ({
                    title: item.title,
                    description: item.description,
                    quantity: parseInt(item.quantity || "1"),
                    price: parseFloat(item.price || "0"),
                    taxRate: parseFloat(item.taxRate || "0")
               }))
           };
        }

        const updatedProposal = await prisma.proposal.update({
            where: { id },
            data: updateData,
            include: { items: true }
        });

        return NextResponse.json(updatedProposal);
    } catch (error: any) {
        console.error("PROPOSAL_PUT_ERROR", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await prisma.proposal.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("PROPOSAL_DELETE_ERROR", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
