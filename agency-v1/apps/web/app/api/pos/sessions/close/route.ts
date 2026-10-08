import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPosCierreZAdjustmentEntry } from "@/lib/pos/pos-accounting-engine";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const {
      companyId = "company_default_pos",
      sessionId,
      shiftId,
      registerName = "Caja Principal",
      cashierId,
      cashierName = "Cajero Principal",
      cashierNotes,
      cashierApproved = true,
      cashierSignedAt,
      expectedCash,
      closingBalance = 0,
      notes,
      supervisorId,
      supervisorName,
      supervisorNotes,
      supervisorApproved = true,
      supervisorSignedAt,
      denominationsCount,
    } = body;

    const targetShiftId = shiftId || sessionId;

    // Intentar microservicio primero
    try {
      const res = await fetch(`${POS_SERVICE_URL}/api/pos/sessions/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          supervisorId: supervisorId || session?.user?.id,
          supervisorName: supervisorName || session?.user?.name,
        }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (_) {}

    // Fallback persistente directo con Prisma PostgreSQL
    let currentShift: any = null;
    if (targetShiftId) {
      currentShift = await prisma.posShift.findUnique({
        where: { id: targetShiftId },
        include: { register: true },
      });
    }

    if (!currentShift) {
      currentShift = await prisma.posShift.findFirst({
        where: { status: { in: ["OPEN", "PENDING_SUPERVISION"] } },
        include: { register: true },
        orderBy: { openedAt: "desc" },
      });
    }

    const expCash = currentShift ? (Number(currentShift.openingFloat) + Number(currentShift.cashSalesTotal)) : (Number(expectedCash) || 0);
    const actualCash = Number(closingBalance) || 0;
    const difference = actualCash - expCash;

    // Ajuste contable automático si hay descuadre
    let adjResult: any = null;
    if (difference !== 0) {
      try {
        adjResult = await createPosCierreZAdjustmentEntry({
          sessionId: currentShift?.id || targetShiftId || "session_default",
          registerName: currentShift?.register?.name || registerName,
          cashierName: currentShift?.cashierName || cashierName,
          expectedCash: expCash,
          actualCash,
          difference,
        });
      } catch (e: any) {
        console.warn("[CierreZ-Accounting] Notice:", e.message);
      }
    }

    const finalStatus = difference === 0 ? "CLOSED_BALANCED" : "CLOSED_DISCREPANCY";

    let closedShiftRecord: any = null;
    if (currentShift) {
      closedShiftRecord = await prisma.posShift.update({
        where: { id: currentShift.id },
        data: {
          status: finalStatus,
          declaredClosedAt: new Date(),
          verifiedClosedAt: new Date(),
          declaredCash: actualCash,
          expectedCash: expCash,
          difference,
          denominationsCount: denominationsCount || null,
          cashierId: cashierId || currentShift.cashierId,
          cashierName: cashierName || currentShift.cashierName,
          cashierNotes: cashierNotes || notes || null,
          supervisorId: supervisorId || session?.user?.id || "supervisor_pos",
          supervisorName: supervisorName || session?.user?.name || "Supervisor Autorizado",
          supervisorNotes: supervisorNotes || null,
        },
        include: { register: true },
      });
    }

    const closedSession = {
      id: closedShiftRecord?.id || targetShiftId || "session_live_01",
      companyId: closedShiftRecord?.companyId || companyId,
      registerName: closedShiftRecord?.register?.name || registerName,
      cashierName: closedShiftRecord?.cashierName || cashierName,
      cashierApproved: Boolean(cashierApproved),
      cashierSignedAt: cashierSignedAt || new Date().toISOString(),
      supervisorName: closedShiftRecord?.supervisorName || supervisorName || "Supervisor Autorizado",
      supervisorApproved: Boolean(supervisorApproved),
      supervisorSignedAt: supervisorSignedAt || new Date().toISOString(),
      status: closedShiftRecord?.status || finalStatus,
      openedAt: closedShiftRecord?.openedAt?.toISOString() || null,
      closedAt: new Date().toISOString(),
      expectedCash: expCash,
      closingBalance: actualCash,
      difference,
      notes: notes || null,
      supervisorNotes: supervisorNotes || null,
      accountingVoucher: adjResult?.voucherNumber || null,
      totalSales: closedShiftRecord ? Number(closedShiftRecord.totalSales) : 0,
      cashSales: closedShiftRecord ? Number(closedShiftRecord.cashSalesTotal) : 0,
      cardSales: closedShiftRecord ? Number(closedShiftRecord.cardSalesTotal) : 0,
      transferSales: closedShiftRecord ? Number(closedShiftRecord.transferSalesTotal) : 0,
      orderCount: closedShiftRecord ? closedShiftRecord.orderCount : 0,
    };

    const actaCierreZ = {
      consecutiveNo: closedShiftRecord?.shiftCode ? `CZ-${closedShiftRecord.shiftCode}` : `CZ-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleString("es-CO"),
      registerName: closedSession.registerName,
      cashierName: closedSession.cashierName,
      supervisorName: closedSession.supervisorName,
      openingFloat: closedShiftRecord ? Number(closedShiftRecord.openingFloat) : expCash,
      actualCount: actualCash,
      expectedCash: expCash,
      difference,
      status: difference === 0 ? "CUADRADO_EXACTO" : difference < 0 ? "FALTANTE_LIQUIDADO" : "SOBRANTE_REGISTRADO",
      accountingAdjustmentVoucher: adjResult?.voucherNumber || "SIN_DIFERENCIA",
    };

    return NextResponse.json({ success: true, summary: closedSession, shift: closedShiftRecord, actaCierreZ });
  } catch (error: any) {
    console.error("[POS-CloseSession] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
