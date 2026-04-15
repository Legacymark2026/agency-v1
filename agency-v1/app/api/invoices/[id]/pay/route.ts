import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { company: true },
        });

        if (!invoice) {
            return new NextResponse("Invoice not found", { status: 404 });
        }

        return NextResponse.redirect(new URL(`/es/invoice/${invoice.token}`, req.url));

    } catch (error) {
        console.error("[INVOICE_PAY_GET]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}