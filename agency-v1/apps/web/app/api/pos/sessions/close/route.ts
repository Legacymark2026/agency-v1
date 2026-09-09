import { NextResponse } from "next/server";
import { createPosCierreZAdjustmentEntry } from "@/lib/pos/pos-accounting-engine";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      companyId = "company_default_pos",
      sessionId = "session_live_01",
      registerName = "Caja Principal",
      cashierName = "Cajero Principal",
      expectedCash = 200000,
      closingBalance = 0,
      notes,
    } = body;

    try {
      const res = await fetch(`${POS_SERVICE_URL}/api/pos/sessions/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (_) {}

    const expCash = Number(expectedCash) || 0;
    const actualCash = Number(closingBalance) || 0;
    const difference = actualCash - expCash;

    // Automated accounting adjustment for cash discrepancy
    let adjResult = null;
    if (difference !== 0) {
      try {
        adjResult = await createPosCierreZAdjustmentEntry({
          sessionId,
          registerName,
          cashierName,
          expectedCash: expCash,
          actualCash,
          difference,
        });
      } catch (e: any) {
        console.warn("[CierreZ-Accounting] Adjustment notice:", e.message);
      }
    }

    const closedSession = {
      id: sessionId,
      companyId,
      registerName,
      cashierName,
      status: "CLOSED",
      closedAt: new Date().toISOString(),
      expectedCash: expCash,
      closingBalance: actualCash,
      difference,
      notes: notes || null,
      accountingVoucher: adjResult?.voucherNumber || null,
    };

    const actaCierreZ = {
      consecutiveNo: `CZ-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleString("es-CO"),
      registerName,
      cashierName,
      openingFloat: expCash,
      actualCount: actualCash,
      difference,
      status: difference === 0 ? "CUADRADO_EXACTO" : difference < 0 ? "FALTANTE_LIQUIDADO" : "SOBRANTE_REGISTRADO",
      accountingAdjustmentVoucher: adjResult?.voucherNumber || "SIN_DIFERENCIA",
    };

    return NextResponse.json({ success: true, summary: closedSession, actaCierreZ });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
