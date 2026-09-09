import { NextResponse } from "next/server";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

// In-Memory Session fallback store
const fallbackSessions = new Map<string, any>();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId") || "company_default_pos";

    try {
      const res = await fetch(`${POS_SERVICE_URL}/api/pos/sessions?companyId=${companyId}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (_) {}

    const activeSession = fallbackSessions.get(companyId) || {
      id: "session_live_01",
      status: "OPEN",
      registerName: "Caja Principal",
      openingBalance: 200000,
      cashSales: 0,
      cardSales: 0,
      transferSales: 0,
      creditSales: 0,
      totalSales: 0,
      orderCount: 0,
      openedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, companyId, activeSession });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
