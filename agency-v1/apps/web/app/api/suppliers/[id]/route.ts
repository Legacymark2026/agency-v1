import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const READ_ROLES = ["super_admin", "admin", "manager", "client_admin", "content_manager"];
const WRITE_ROLES = ["super_admin", "admin", "client_admin", "manager"];
const DELETE_ROLES = ["super_admin", "admin"];

function checkUserPermission(session: any, allowedRoles: string[]) {
  const role = String(session?.user?.role || "").toLowerCase();
  return allowedRoles.includes(role);
}

/**
 * GET /api/suppliers/[id]
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, READ_ROLES)) {
      return NextResponse.json({ success: false, error: "Permisos insuficientes" }, { status: 403 });
    }

    const { id } = await params;
    const supplier = await (prisma as any).supplier.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ success: false, error: "Proveedor no encontrado" }, { status: 404 });
    }

    const extra = typeof supplier.customFields === "object" && supplier.customFields !== null ? supplier.customFields : {};

    return NextResponse.json({
      success: true,
      supplier: {
        ...supplier,
        commercialName: supplier.name,
        legalName: supplier.legalName || supplier.name,
        mobilePhone: extra.mobilePhone || supplier.contactPhone || "",
        rawMaterialsScope: extra.rawMaterialsScope || [],
        specialTaxRegime: extra.specialTaxRegime || "REGIMEN_ORDINARIO",
        departmentContacts: extra.departmentContacts || [],
        accountBalance: extra.accountBalance || { currentBalance: 0, pendingInvoices: 0, lastPaymentDate: null },
        deliveryTerms: extra.deliveryTerms || { shippingMethod: "TERRESTRE", leadTimeDays: 3 },
        incoterm: extra.incoterm || "DDP",
        delayPenaltyPolicy: extra.delayPenaltyPolicy || { penaltyPctPerDay: 0, maxPenaltyPct: 0, gracePeriodDays: 2 },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/suppliers/[id]
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, WRITE_ROLES)) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: rol sin permisos para modificar proveedores." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await (prisma as any).supplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Proveedor no encontrado" }, { status: 404 });
    }

    const existingExtra = typeof existing.customFields === "object" && existing.customFields !== null ? existing.customFields : {};

    const standardFields = [
      "name",
      "legalName",
      "taxId",
      "taxType",
      "category",
      "contactName",
      "contactEmail",
      "contactPhone",
      "address",
      "city",
      "country",
      "currency",
      "bankName",
      "bankAccountType",
      "bankAccountNumber",
      "bankAccountHolder",
      "status",
      "notes",
    ];

    const data: any = {};
    for (const key of standardFields) {
      if (key in body) data[key] = body[key];
    }

    if ("commercialName" in body && body.commercialName) {
      data.name = body.commercialName;
    }

    if ("paymentTermsDays" in body) data.paymentTermsDays = Number(body.paymentTermsDays);
    if ("creditLimit" in body) data.creditLimit = Number(body.creditLimit);
    if ("discountRatePct" in body) data.discountRatePct = Number(body.discountRatePct);
    if ("ratingScore" in body) data.ratingScore = Number(body.ratingScore);

    // Merge custom fields
    const updatedCustomFields = {
      ...existingExtra,
      ...(body.mobilePhone !== undefined && { mobilePhone: body.mobilePhone }),
      ...(body.rawMaterialsScope !== undefined && { rawMaterialsScope: body.rawMaterialsScope }),
      ...(body.specialTaxRegime !== undefined && { specialTaxRegime: body.specialTaxRegime }),
      ...(body.departmentContacts !== undefined && { departmentContacts: body.departmentContacts }),
      ...(body.accountBalance !== undefined && { accountBalance: body.accountBalance }),
      ...(body.deliveryTerms !== undefined && { deliveryTerms: body.deliveryTerms }),
      ...(body.incoterm !== undefined && { incoterm: body.incoterm }),
      ...(body.delayPenaltyPolicy !== undefined && { delayPenaltyPolicy: body.delayPenaltyPolicy }),
    };

    data.customFields = updatedCustomFields;

    const updated = await (prisma as any).supplier.update({
      where: { id },
      data,
      include: {
        documents: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Proveedor actualizado con éxito.",
      supplier: {
        ...updated,
        ...updatedCustomFields,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/suppliers/[id]
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, DELETE_ROLES)) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: solo Administradores pueden dar de baja a un proveedor." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await (prisma as any).supplier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Proveedor eliminado exitosamente del catálogo maestro." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
