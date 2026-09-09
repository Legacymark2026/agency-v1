import { NextResponse } from "next/server";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId = "company_default_pos", registerName = "Caja Principal", openedById, openingBalance = 0 } = body;

    try {
      const res = await fetch(`${POS_SERVICE_URL}/api/pos/sessions/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch (_) {}

    const session = {
      id: `pos_session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId,
      registerName,
      openedById: openedById || "cajero_main",
      openingBalance: Number(openingBalance) || 0,
      status: "OPEN",
      openedAt: new Date().toISOString(),
      cashSales: 0,
      cardSales: 0,
      transferSales: 0,
      creditSales: 0,
      totalSales: 0,
      orderCount: 0,
      cashMovements: [],
    };

    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
