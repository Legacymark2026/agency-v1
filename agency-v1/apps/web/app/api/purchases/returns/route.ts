import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const READ_ROLES = ["super_admin", "admin", "client_admin", "manager", "content_manager"];
const WRITE_ROLES = ["super_admin", "admin", "client_admin", "manager"];

function checkUserPermission(session: any, allowedRoles: string[]) {
  const role = String(session?.user?.role || "").toLowerCase();
  return allowedRoles.includes(role);
}

/**
 * GET /api/purchases/returns
 * Lista devoluciones y rechazos a proveedores
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

    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId") || "";

    const where: any = {};
    if (vendorId && vendorId !== "ALL") where.vendorId = vendorId;

    const returns = await (prisma as any).purchaseReturn.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, returns });
  } catch (error: any) {
    console.error("[GET /api/purchases/returns] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/purchases/returns
 * Actualiza estado de la devolución (APROBADA, DESPACHADA, NOTA DE CRÉDITO APLICADA)
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, WRITE_ROLES)) {
      return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, creditNoteRef, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "ID y nuevo estado requeridos." }, { status: 400 });
    }

    const updated = await (prisma as any).purchaseReturn.update({
      where: { id },
      data: {
        status,
        ...(creditNoteRef ? { creditNoteRef } : {}),
        ...(notes ? { notes } : {}),
      },
    });

    return NextResponse.json({ success: true, message: "Devolución actualizada.", returnItem: updated });
  } catch (error: any) {
    console.error("[PATCH /api/purchases/returns] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
