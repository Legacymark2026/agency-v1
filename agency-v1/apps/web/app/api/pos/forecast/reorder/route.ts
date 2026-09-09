import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const leadTimeDays = Number(searchParams.get("leadTimeDays")) || 3;

    try {
      const msRes = await fetch(`${POS_SERVICE_URL}/api/pos/forecast/reorder?leadTimeDays=${leadTimeDays}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      });
      if (msRes.ok) {
        const msData = await msRes.json();
        return NextResponse.json(msData);
      }
    } catch (_) {}

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const where: any = {
      createdAt: { gte: thirtyDaysAgo },
      notes: { contains: "[POS]" },
    };
    if (companyId) where.companyId = companyId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: { items: true },
      take: 200,
    });

    const salesVelocityMap = new Map<string, number>();
    invoices.forEach((inv: any) => {
      inv.items.forEach((it: any) => {
        const key = it.title;
        const cur = salesVelocityMap.get(key) || 0;
        salesVelocityMap.set(key, cur + it.quantity);
      });
    });

    const defaultItems = [
      { title: "Consultoría Estratégica POS (1 hora)", total: 45 },
      { title: "Impresora Térmica POS 80mm USB/LAN", total: 18 },
      { title: "Lector Código de Barras Láser 2D", total: 24 },
    ];

    if (salesVelocityMap.size === 0) {
      defaultItems.forEach(d => salesVelocityMap.set(d.title, d.total));
    }

    const forecast = Array.from(salesVelocityMap.entries()).map(([title, totalUnits]) => {
      const avgDailySales = totalUnits / 30;
      const safetyStock = Math.ceil(avgDailySales * 2);
      const reorderPoint = Math.ceil(avgDailySales * leadTimeDays + safetyStock);
      const annualDemand = avgDailySales * 365;
      const eoq = Math.ceil(Math.sqrt((2 * annualDemand * 15000) / 2000));

      return {
        productTitle: title,
        totalUnits30Days: totalUnits,
        avgDailySales: Math.round(avgDailySales * 100) / 100,
        safetyStock,
        reorderPoint,
        suggestedReorderQuantity: Math.max(10, eoq),
        status: avgDailySales > 1.5 ? "HIGH_DEMAND" : "NORMAL",
      };
    });

    return NextResponse.json({
      success: true,
      leadTimeDays,
      forecast,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
