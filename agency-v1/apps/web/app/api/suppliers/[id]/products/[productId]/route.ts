import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const WRITE_ROLES = ["super_admin", "admin", "client_admin", "manager"];
const DELETE_ROLES = ["super_admin", "admin"];

function checkUserPermission(session: any, allowedRoles: string[]) {
  const role = String(session?.user?.role || "").toLowerCase();
  return allowedRoles.includes(role);
}

/**
 * PATCH /api/suppliers/[id]/products/[productId]
 * Modificar un producto del catálogo del proveedor
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, WRITE_ROLES)) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: rol sin permisos de edición." },
        { status: 403 }
      );
    }

    const { id: supplierId, productId } = await params;
    const body = await req.json();

    const existing = await (prisma as any).supplierProduct.findFirst({
      where: { id: productId, supplierId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado en el catálogo del proveedor." },
        { status: 404 }
      );
    }

    const updateData: any = {};
    const stringFields = [
      "internalSku",
      "supplierSku",
      "barcode",
      "name",
      "description",
      "category",
      "subcategory",
      "currency",
      "discountStructure",
      "purchaseUnit",
      "availabilityStatus",
      "supplierType",
      "storageConditions",
      "notes",
    ];

    for (const f of stringFields) {
      if (f in body) updateData[f] = body[f] || null;
    }

    if ("purchasePrice" in body) updateData.purchasePrice = Number(body.purchasePrice);
    if ("taxRatePct" in body) updateData.taxRatePct = Number(body.taxRatePct);
    if ("conversionFactor" in body) updateData.conversionFactor = Number(body.conversionFactor);
    if ("minOrderQty" in body) updateData.minOrderQty = Number(body.minOrderQty);
    if ("orderMultiple" in body) updateData.orderMultiple = Number(body.orderMultiple);
    if ("leadTimeDays" in body) updateData.leadTimeDays = Number(body.leadTimeDays);
    if ("shelfLifeDays" in body) updateData.shelfLifeDays = body.shelfLifeDays ? Number(body.shelfLifeDays) : null;
    if ("priceValidityStart" in body) {
      updateData.priceValidityStart = body.priceValidityStart ? new Date(body.priceValidityStart) : null;
    }
    if ("priceValidityEnd" in body) {
      updateData.priceValidityEnd = body.priceValidityEnd ? new Date(body.priceValidityEnd) : null;
    }

    const updated = await (prisma as any).supplierProduct.update({
      where: { id: productId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Producto de proveedor actualizado con éxito.",
      product: updated,
    });
  } catch (error: any) {
    console.error("[SupplierProductItemAPI] PATCH Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/suppliers/[id]/products/[productId]
 * Eliminar un producto del catálogo del proveedor
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, DELETE_ROLES)) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: se requieren permisos administrativos para dar de baja productos de catálogo." },
        { status: 403 }
      );
    }

    const { id: supplierId, productId } = await params;

    await (prisma as any).supplierProduct.delete({
      where: { id: productId },
    });

    return NextResponse.json({
      success: true,
      message: "Producto desvinculado y retirado del catálogo del proveedor.",
    });
  } catch (error: any) {
    console.error("[SupplierProductItemAPI] DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
