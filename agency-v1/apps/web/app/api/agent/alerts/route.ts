import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — Retorna alertas proactivas: deals estancados + facturas vencidas
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ alerts: [] });

    const companyId = (session.user as any)?.companyId || session.user.id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [staleDeals, overdueInvoices] = await Promise.all([
        prisma.deal.findMany({
            where: {
                companyId,
                stage: { in: ["PROPOSAL", "NEGOTIATION", "CONTACTED"] },
                updatedAt: { lt: sevenDaysAgo },
            },
            select: { id: true, title: true, stage: true, updatedAt: true, value: true },
            take: 5,
        }),
        prisma.invoice.findMany({
            where: {
                companyId,
                status: "DRAFT_AWAITING_PAYMENT",
                createdAt: { lt: fourteenDaysAgo },
            },
            select: { id: true, clientName: true, totalAmount: true, createdAt: true },
            take: 5,
        }),
    ]);

    const alerts = [
        ...staleDeals.map((d) => ({
            id: d.id,
            type: "stale_deal" as const,
            severity: "warning" as const,
            title: `Deal estancado: ${d.title}`,
            description: `Sin actualización en +7 días en etapa ${d.stage}`,
            value: d.value ? `$${d.value}` : undefined,
            daysStale: Math.floor((Date.now() - d.updatedAt.getTime()) / (1000 * 60 * 60 * 24)),
        })),
        ...overdueInvoices.map((inv) => ({
            id: inv.id,
            type: "overdue_invoice" as const,
            severity: "danger" as const,
            title: `Factura pendiente: ${inv.clientName}`,
            description: `Sin pago por +14 días | $${inv.totalAmount}`,
            value: `$${inv.totalAmount}`,
            daysStale: Math.floor((Date.now() - inv.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        })),
    ];

    return NextResponse.json({ alerts, count: alerts.length });
}
