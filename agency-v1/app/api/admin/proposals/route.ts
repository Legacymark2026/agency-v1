import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { companies: true }
        });

        const activeCompanyId = user?.companies[0]?.companyId;
        if (!activeCompanyId) {
            return NextResponse.json({ error: "No active company found." }, { status: 400 });
        }

        const proposals = await prisma.proposal.findMany({
            where: { companyId: activeCompanyId },
            include: {
                items: true,
                deal: { select: { id: true, title: true } },
                creator: { select: { id: true, name: true, image: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(proposals);
    } catch (error: any) {
        console.error("PROPOSALS_GET_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { title, content, value, currency, companyId, dealId, contactName, contactEmail, expiresAt, items } = body;

        const newProposal = await prisma.proposal.create({
            data: {
                title,
                content,
                value: value ? parseFloat(value) : 0,
                currency: currency || "USD",
                companyId,
                dealId: dealId || null,
                creatorId: session.user.id,
                contactName,
                contactEmail,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                items: items && items.length > 0 ? {
                    create: items.map((item: any) => ({
                        title: item.title,
                        description: item.description,
                        quantity: parseInt(item.quantity || "1"),
                        price: parseFloat(item.price || "0"),
                        taxRate: parseFloat(item.taxRate || "0")
                    }))
                } : undefined
            },
            include: {
                items: true
            }
        });

        return NextResponse.json(newProposal);
    } catch (error: any) {
        console.error("PROPOSALS_POST_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
