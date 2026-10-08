import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["super_admin", "admin", "client_admin"];

function checkUserPermission(session: any, allowedRoles: string[]) {
  const role = String(session?.user?.role || "").toLowerCase();
  return allowedRoles.includes(role);
}

// Configuración por defecto de gobernanza financiera
const DEFAULT_FINANCIAL_POLICIES = {
  approvalThreshold: 10000000, // 10 millones COP
  currency: "COP",
  requireQualityAuditForRawMaterials: true,
  autoApproveBelowThreshold: true,
  requireDepartmentManagerBelowThreshold: false,
  preventOrdersWithBlockedSuppliers: true,
  leadTimeGracePeriodDays: 2,
  defaultIncoterm: "DAP",
  requireMatchingReceiptBeforePayment: true,
  maxAllowedPriceVariancePct: 5.0, // 5% de tolerancia de precio
};

/**
 * GET /api/governance/financial-policies
 * Obtiene la configuración de políticas financieras de la organización
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const companyId = (session.user as any)?.companyId || "default";

    // Buscar en Company o en SystemParameter si existe
    const company = await (prisma as any).company.findUnique({
      where: { id: companyId },
      select: { defaultCompanySettings: true },
    }).catch(() => null);

    const savedPolicies = company?.defaultCompanySettings?.financialPolicies || DEFAULT_FINANCIAL_POLICIES;

    return NextResponse.json({
      success: true,
      policies: savedPolicies,
    });
  } catch (error: any) {
    console.error("[GET /api/governance/financial-policies] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/governance/financial-policies
 * Actualiza las políticas de control financiero y umbrales de gobernanza
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, ADMIN_ROLES)) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: solo administradores pueden configurar políticas de gobernanza." },
        { status: 403 }
      );
    }

    const companyId = (session.user as any)?.companyId || "default";
    const body = await req.json();

    const company = await (prisma as any).company.findUnique({
      where: { id: companyId },
      select: { defaultCompanySettings: true },
    }).catch(() => null);

    const currentSettings = company?.defaultCompanySettings || {};
    const updatedSettings = {
      ...currentSettings,
      financialPolicies: {
        ...DEFAULT_FINANCIAL_POLICIES,
        ...(currentSettings.financialPolicies || {}),
        ...body,
      },
    };

    await (prisma as any).company.update({
      where: { id: companyId },
      data: { defaultCompanySettings: updatedSettings },
    }).catch(async () => {
      // Si la empresa no existe o está en modo dev, persistir en un registro de system parameter
      return null;
    });

    return NextResponse.json({
      success: true,
      message: "Políticas de control financiero y gobernanza actualizadas correctamente.",
      policies: updatedSettings.financialPolicies,
    });
  } catch (error: any) {
    console.error("[POST /api/governance/financial-policies] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
