import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const POS_SERVICE_URL = process.env.POS_SERVICE_URL || "http://pos-service:4020";

const OpenSessionSchema = z.object({
  companyId: z.string().default("company_default_pos"),
  registerId: z.string().optional(),
  registerName: z.string().default("Caja Principal"),
  openedById: z.string().optional(),
  cashierName: z.string().optional(),
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

    const { companyId, registerId, registerName, openedById, cashierName, openingBalance } = parsed.data;
    const finalCashierId = openedById || session.user.id || "cajero_main";
    const finalCashierName = cashierName || session.user.name || session.user.email || "Cajero Principal";

    const payload = {
      ...parsed.data,
      cashierId: finalCashierId,
      cashierName: finalCashierName,
    };

    // Intentar microservicio primero
    try {
      const res = await fetch(`${POS_SERVICE_URL}/api/pos/sessions/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch (_) {}

    // Fallback persistente directo con Prisma PostgreSQL
    let targetCompanyId = companyId;
    if (!targetCompanyId || targetCompanyId === "company_default" || targetCompanyId === "company_default_pos") {
      const firstComp = await prisma.company.findFirst({ select: { id: true } });
      if (firstComp) targetCompanyId = firstComp.id;
    }

    // Resolver o crear caja registradora
    let register = registerId ? await prisma.posRegister.findUnique({ where: { id: registerId } }) : null;
    if (!register) {
      register = await prisma.posRegister.findFirst({
        where: { companyId: targetCompanyId, name: registerName }
      });
    }
    if (!register) {
      register = await prisma.posRegister.create({
        data: {
          id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          companyId: targetCompanyId,
          name: registerName,
          initialFloat: Number(openingBalance) || 0,
          currentBalance: Number(openingBalance) || 0,
          status: "OPEN",
        }
      });
    }

    // Verificar exclusión mutua de turnos
    const activeShift = await prisma.posShift.findFirst({
      where: {
        registerId: register.id,
        status: { in: ["OPEN", "PENDING_SUPERVISION"] }
      }
    });

    if (activeShift) {
      if (activeShift.cashierId !== finalCashierId) {
        return NextResponse.json({
          success: false,
          error: `La caja "${register.name}" actualmente se encuentra ocupada con un turno activo del cajero ${activeShift.cashierName || activeShift.cashierId}. Debe cerrarse dicho turno antes de iniciar uno nuevo.`,
          activeShift
        }, { status: 409 });
      } else {
        return NextResponse.json({
          success: true,
          session: activeShift,
          message: "Turno recuperado exitosamente."
        }, { status: 200 });
      }
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomCode = Math.floor(100 + Math.random() * 900);
    const shiftCode = `TURNO-${dateStr}-${randomCode}`;

    const newShift = await prisma.posShift.create({
      data: {
        shiftCode,
        companyId: targetCompanyId,
        registerId: register.id,
        cashierId: finalCashierId,
        cashierName: finalCashierName,
        openingFloat: Number(openingBalance) || 0,
        expectedCash: Number(openingBalance) || 0,
        status: "OPEN",
      },
      include: { register: true }
    });

    const sessionResponse = {
      id: newShift.id,
      shiftCode: newShift.shiftCode,
      companyId: targetCompanyId,
      registerId: register.id,
      registerName: register.name,
      openedById: finalCashierId,
      cashierName: finalCashierName,
      openingBalance: Number(newShift.openingFloat),
      status: newShift.status,
      openedAt: newShift.openedAt.toISOString(),
      cashSales: 0,
      cardSales: 0,
      transferSales: 0,
      creditSales: 0,
      totalSales: 0,
      orderCount: 0,
    };

    return NextResponse.json({ success: true, session: sessionResponse, shift: newShift }, { status: 201 });
  } catch (error: any) {
    console.error("[POS-OpenSession] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
