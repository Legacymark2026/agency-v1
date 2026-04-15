import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST — Generador de reporte diario (llamado desde cron o manualmente)
// Requiere header Authorization con el CRON_SECRET configurado en .env
export async function POST(req: Request) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

    // Get all companies
    const companies = await prisma.company.findMany({
        select: { id: true, name: true }
    });

    const reports = [];

    for (const company of companies) {
        const [
            todayDeals,
            monthWonDeals,
            staleDeals,
            pendingInvoices,
        ] = await Promise.all([
            prisma.deal.count({ where: { companyId: company.id, createdAt: { gte: startOfDay } } }),
            prisma.deal.findMany({
                where: { companyId: company.id, stage: "WON", updatedAt: { gte: startOfMonth } },
                select: { value: true },
            }),
            prisma.deal.count({
                where: { companyId: company.id, stage: { in: ["PROPOSAL", "NEGOTIATION"] }, updatedAt: { lt: sevenDaysAgo } }
            }),
            prisma.invoice.count({
                where: { companyId: company.id, status: "DRAFT_AWAITING_PAYMENT" }
            }),
            prisma.agentConfig.findUnique({
                where: { companyId: company.id }
            })
        ]);

        const monthRevenue = monthWonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const config = arguments[4] || (await prisma.agentConfig.findUnique({ where: { companyId: company.id } })); // The promise array trick


        const reportText = [
            `📊 *Reporte Diario — ${company.name}*`,
            `📅 ${now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}`,
            ``,
            `*CRM hoy:*`,
            `• Nuevos deals hoy: ${todayDeals}`,
            `• Deals ganados en ${monthNames[now.getMonth()]}: ${monthWonDeals.length}`,
            `• Ingresos del mes: $${monthRevenue.toLocaleString('es-MX')}`,
            ``,
            `*Alertas:*`,
            `• Deals estancados >7 días: ${staleDeals}`,
            `• Facturas pendientes de pago: ${pendingInvoices}`,
            ``,
            `_Generado por Agente Cognitivo LegacyMark_`,
        ].join("\n");

        // Send via WhatsApp if configured
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const adminPhone = config?.adminWhatsappPhone || process.env.ADMIN_WHATSAPP_PHONE;

        let whatsappSent = false;
        if (accessToken && phoneNumberId && adminPhone) {
            const res = await fetch(
                `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: adminPhone,
                        type: "text",
                        text: { body: reportText },
                    }),
                }
            );
            whatsappSent = res.ok;
        }

        reports.push({ company: company.name, report: reportText, whatsappSent });
    }

    return NextResponse.json({ success: true, reports, generatedAt: now.toISOString() });
}
