import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId") || (session.user as any).companyId;
    const cashierId = searchParams.get("cashierId");
    const registerId = searchParams.get("registerId");
    const status = searchParams.get("status");

    let targetCompanyId = companyId;
    if (!targetCompanyId || targetCompanyId === "company_default" || targetCompanyId === "company_default_pos") {
      const firstComp = await prisma.company.findFirst({ select: { id: true } });
      if (firstComp) targetCompanyId = firstComp.id;
    }

    const where: any = {};
    if (targetCompanyId) where.companyId = targetCompanyId;
    if (cashierId) where.cashierId = cashierId;
    if (registerId) where.registerId = registerId;
    if (status) where.status = status;

    const shifts = await prisma.posShift.findMany({
      where,
      include: {
        register: true,
        movements: true,
        _count: {
          select: { invoices: true }
        }
      },
      orderBy: { openedAt: "desc" },
      take: 50,
    });

    const formattedShifts = shifts.map((s: any) => ({
      id: s.id,
      shiftCode: s.shiftCode,
      companyId: s.companyId,
      registerId: s.registerId,
      registerName: s.register?.name || "Caja Principal",
      cashierId: s.cashierId,
      cashierName: s.cashierName || "Cajero",
      supervisorId: s.supervisorId,
      supervisorName: s.supervisorName || "Supervisor",
      status: s.status,
      openedAt: s.openedAt.toISOString(),
      declaredClosedAt: s.declaredClosedAt?.toISOString() || null,
      verifiedClosedAt: s.verifiedClosedAt?.toISOString() || null,
      openingFloat: Number(s.openingFloat),
      declaredCash: s.declaredCash ? Number(s.declaredCash) : null,
      expectedCash: Number(s.expectedCash),
      difference: Number(s.difference),
      cashSalesTotal: Number(s.cashSalesTotal),
      cardSalesTotal: Number(s.cardSalesTotal),
      transferSalesTotal: Number(s.transferSalesTotal),
      creditSalesTotal: Number(s.creditSalesTotal),
      totalSales: Number(s.totalSales),
      orderCount: s.orderCount || s._count?.invoices || 0,
      denominationsCount: s.denominationsCount,
      cashierNotes: s.cashierNotes,
      supervisorNotes: s.supervisorNotes,
    }));

    // Obtener lista de cajeros únicos para filtro
    const uniqueCashiers = Array.from(
      new Set(
        shifts.map((s: any) => JSON.stringify({ id: s.cashierId, name: s.cashierName || "Cajero" }))
      )
    ).map((s: any) => JSON.parse(s));

    return NextResponse.json({
      success: true,
      shifts: formattedShifts,
      cashiers: uniqueCashiers,
    });
  } catch (error: any) {
    console.error("[POS-ShiftsHistory] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
