import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;

        if (!id) {
            return NextResponse.json({ error: "Identifier required" }, { status: 400 });
        }

        const invoice = await prisma.invoice.findFirst({
            where: {
                OR: [
                    { id },
                    { token: id }
                ]
            },
            select: { id: true, status: true, token: true, updatedAt: true },
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            id: invoice.id,
            status: invoice.status,
            token: invoice.token,
            updatedAt: invoice.updatedAt,
        });
    } catch (error) {
        console.error("🔴 Error fetching invoice status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
