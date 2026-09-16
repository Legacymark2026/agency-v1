import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

const OpenSessionSchema = z.object({
  companyId: z.string().default("company_default_pos"),
  registerName: z.string().default("Caja Principal"),
  openedById: z.string().optional(),
  openingBalance: z.number().min(0).default(0),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = OpenSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const { companyId, registerName, openedById, openingBalance } = parsed.data;

    try {
      const res = await fetch(`${POS_SERVICE_URL}/api/pos/sessions/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch (_) {}

    const posSession = {
      id: `pos_session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      companyId,
      registerName,
      openedById: openedById || (session.user as any)?.id || "cajero_main",
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

    return NextResponse.json({ success: true, session: posSession }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

