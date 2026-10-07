import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId") || "company_default_pos";
    const registerId = searchParams.get("registerId");
    const cashierId = searchParams.get("cashierId") || session.user.id;

    // 1. Probar microservicio POS
    try {
      const url = new URL(`${POS_SERVICE_URL}/api/pos/sessions`);
      url.searchParams.set("companyId", companyId);
      if (registerId) url.searchParams.set("registerId", registerId);
      if (cashierId) url.searchParams.set("cashierId", cashierId);

      const res = await fetch(url.toString(), {
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (_) {}

    // 2. Fallback de alta fidelidad contra base de datos PostgreSQL (Prisma)
    let targetCompanyId = companyId;
    if (!targetCompanyId || targetCompanyId === "company_default" || targetCompanyId === "company_default_pos") {
      const firstComp = await prisma.company.findFirst({ select: { id: true } });
      if (firstComp) targetCompanyId = firstComp.id;
    }

    const where: any = {
      companyId: targetCompanyId,
      status: { in: ["OPEN", "PENDING_SUPERVISION"] },
    };
    if (registerId) where.registerId = registerId;
    if (cashierId) where.cashierId = cashierId;

    let activeShift = await prisma.posShift.findFirst({
      where,
      include: { register: true },
      orderBy: { openedAt: "desc" },
    });

    // Si no encontró por cashierId específico, busca cualquier turno abierto en la empresa
    if (!activeShift && !registerId) {
      activeShift = await prisma.posShift.findFirst({
        where: {
          companyId: targetCompanyId,
          status: { in: ["OPEN", "PENDING_SUPERVISION"] },
        },
        include: { register: true },
        orderBy: { openedAt: "desc" },
      });
    }

    const activeSession = activeShift ? {
      id: activeShift.id,
      shiftCode: activeShift.shiftCode,
      registerId: activeShift.registerId,
      registerName: activeShift.register?.name || "Caja Principal",
      openedById: activeShift.cashierId,
      cashierName: activeShift.cashierName,
      supervisorId: activeShift.supervisorId,
      supervisorName: activeShift.supervisorName || "Supervisor General",
      status: activeShift.status,
      openedAt: activeShift.openedAt.toISOString(),
      openingBalance: Number(activeShift.openingFloat),
      cashSales: Number(activeShift.cashSalesTotal),
      cardSales: Number(activeShift.cardSalesTotal),
      transferSales: Number(activeShift.transferSalesTotal),
      creditSales: Number(activeShift.creditSalesTotal),
      totalSales: Number(activeShift.totalSales),
      orderCount: activeShift.orderCount,
      expectedCash: Number(activeShift.openingFloat) + Number(activeShift.cashSalesTotal),
    } : null;

    return NextResponse.json({
      success: true,
      companyId: targetCompanyId,
      activeSession,
      activeShift,
    });
  } catch (error: any) {
    console.error("[POS-GetSessions] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
