import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/pos/users/eligible
 * Retorna usuarios activos de la empresa divididos por rol:
 *   - cashiers: usuarios activos habilitados para operar caja (user, cashier, sales, admin, super_admin)
 *   - supervisors: usuarios con permisos de supervisión y cierre (supervisor, manager, admin, super_admin)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const companyId = (session.user as any)?.companyId;
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
      take: 200,
    });

    const supervisorRoles = ["super_admin", "admin", "manager", "supervisor"];

    const cashiers = users.map((u) => ({
      id: u.id,
      name: u.name || u.email.split("@")[0],
      email: u.email,
      role: u.role,
    }));

    const supervisors = users
      .filter((u) => supervisorRoles.includes(String(u.role || "").toLowerCase()))
      .map((u) => ({
        id: u.id,
        name: u.name || u.email.split("@")[0],
        email: u.email,
        role: u.role,
      }));

    return NextResponse.json({
      success: true,
      companyId,
      currentTime: new Date().toISOString(),
      cashiers,
      supervisors: supervisors.length > 0 ? supervisors : cashiers, // Fallback si aún no hay roles estrictos
    });
  } catch (error: any) {
    console.error("[POS-EligibleUsers] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
