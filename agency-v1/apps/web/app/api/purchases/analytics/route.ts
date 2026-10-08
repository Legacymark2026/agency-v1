import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const READ_ROLES = ["super_admin", "admin", "client_admin", "manager", "content_manager"];

function checkUserPermission(session: any, allowedRoles: string[]) {
  const role = String(session?.user?.role || "").toLowerCase();
  return allowedRoles.includes(role);
}

/**
 * GET /api/purchases/analytics
 * Retorna métricas cuantitativas del desempeño de compras, costos y lead times por proveedor
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, READ_ROLES)) {
      return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });
    }

    const orders = await (prisma as any).purchaseOrder.findMany({
      orderBy: { createdAt: "desc" },
    });

    const receipts = await (prisma as any).goodsReceipt.findMany({
      orderBy: { createdAt: "desc" },
    });

    const returns = await (prisma as any).purchaseReturn.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 1. Resumen general
    const totalOrdersCount = orders.length;
    const totalSpend = orders
      .filter((o: any) => o.status !== "CANCELLED")
      .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

    const totalSpendThisMonth = orders
      .filter((o: any) => {
        if (o.status === "CANCELLED") return false;
        const d = new Date(o.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

    // 2. Desglose por Proveedor (Spend & OTIF)
    const supplierStatsMap: Record<string, any> = {};
    orders.forEach((o: any) => {
      const vName = o.vendorName || "Desconocido";
      if (!supplierStatsMap[vName]) {
        supplierStatsMap[vName] = {
          vendorName: vName,
          ordersCount: 0,
          totalSpent: 0,
          currencies: new Set<string>(),
          deliveredCount: 0,
          avgLeadTimeDays: 0,
        };
      }
      supplierStatsMap[vName].ordersCount += 1;
      if (o.status !== "CANCELLED") {
        supplierStatsMap[vName].totalSpent += o.total || 0;
      }
      if (o.currency) supplierStatsMap[vName].currencies.add(o.currency);
      if (["PARTIALLY_RECEIVED", "RECEIVED"].includes(o.status)) {
        supplierStatsMap[vName].deliveredCount += 1;
      }
    });

    const topSuppliers = Object.values(supplierStatsMap)
      .map((s: any) => ({
        ...s,
        currencies: Array.from(s.currencies),
        fulfillmentRatePct: s.ordersCount > 0 ? Math.round((s.deliveredCount / s.ordersCount) * 100) : 0,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // 3. Tasas de Aceptación vs Rechazo en Muelle
    let totalItemsAccepted = 0;
    let totalItemsRejected = 0;

    receipts.forEach((r: any) => {
      if (Array.isArray(r.items)) {
        r.items.forEach((it: any) => {
          totalItemsAccepted += Number(it.acceptedQty) || 0;
          totalItemsRejected += Number(it.rejectedQty) || 0;
        });
      }
    });

    const totalInspected = totalItemsAccepted + totalItemsRejected;
    const acceptanceRatePct = totalInspected > 0 ? Math.round((totalItemsAccepted / totalInspected) * 100) : 100;

    return NextResponse.json({
      success: true,
      analytics: {
        totalOrdersCount,
        totalSpend,
        totalSpendThisMonth,
        totalReceiptsCount: receipts.length,
        totalReturnsCount: returns.length,
        acceptanceRatePct,
        totalItemsAccepted,
        totalItemsRejected,
        topSuppliers,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/purchases/analytics] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
