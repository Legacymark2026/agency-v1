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
 * GET /api/purchases/[id]
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, READ_ROLES)) {
      return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;

    const order = await (prisma as any).purchaseOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Orden de compra no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("[GET /api/purchases/[id]] Error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Error al consultar orden" }, { status: 500 });
  }
}

/**
 * PATCH /api/purchases/[id]
 * Permite cambiar el estado de la orden (DRAFT -> ISSUED -> CONFIRMED -> IN_TRANSIT -> CANCELLED)
 * o editar sus términos mientras no esté confirmada/cerrada.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, WRITE_ROLES)) {
      return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const existingOrder = await (prisma as any).purchaseOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: "Orden de compra no encontrada" }, { status: 404 });
    }

    const updateData: any = {};

    // Manejo de transiciones de ciclo de vida
    if (body.action) {
      if (body.action === "ISSUE") {
        updateData.status = "ISSUED";
        updateData.issuedAt = new Date();
      } else if (body.action === "CONFIRM") {
        updateData.status = "CONFIRMED";
        updateData.confirmedAt = new Date();
      } else if (body.action === "IN_TRANSIT") {
        updateData.status = "IN_TRANSIT";
      } else if (body.action === "CANCEL") {
        updateData.status = "CANCELLED";
        updateData.cancelledAt = new Date();
        updateData.rejectionReason = body.rejectionReason || "Cancelada por el comprador";
      }
    }

    if (body.status && !body.action) {
      updateData.status = body.status;
    }

    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.incoterm !== undefined) updateData.incoterm = body.incoterm;
    if (body.incotermPlace !== undefined) updateData.incotermPlace = body.incotermPlace;
    if (body.paymentTermsDays !== undefined) updateData.paymentTermsDays = Number(body.paymentTermsDays);
    if (body.shippingMethod !== undefined) updateData.shippingMethod = body.shippingMethod;
    if (body.deliveryDate !== undefined) updateData.deliveryDate = body.deliveryDate ? new Date(body.deliveryDate) : null;
    if (body.shippingCost !== undefined) updateData.shippingCost = Number(body.shippingCost);
    if (body.otherCosts !== undefined) updateData.otherCosts = Number(body.otherCosts);

    // Si se enviaron items actualizados
    if (Array.isArray(body.items) && body.items.length > 0) {
      let subtotal = 0;
      let discountTotal = 0;
      let taxAmount = 0;

      const validatedItems = body.items.map((item: any) => {
        const qty = Number(item.quantity) || 1;
        const unitPrice = Number(item.unitPrice) || 0;
        const discPct = Number(item.discountPct) || 0;
        const taxPct = Number(item.taxRatePct) || 19;

        const lineGross = qty * unitPrice;
        const lineDisc = lineGross * (discPct / 100);
        const lineNet = lineGross - lineDisc;
        const lineTax = lineNet * (taxPct / 100);
        const lineTotal = lineNet + lineTax;

        subtotal += lineGross;
        discountTotal += lineDisc;
        taxAmount += lineTax;

        return {
          productId: item.productId || null,
          internalSku: item.internalSku || "",
          supplierSku: item.supplierSku || "",
          barcode: item.barcode || "",
          name: item.name || "",
          quantity: qty,
          purchaseUnit: item.purchaseUnit || "UNIDAD",
          conversionFactor: Number(item.conversionFactor) || 1,
          unitPrice,
          discountPct: discPct,
          taxRatePct: taxPct,
          subtotal: lineNet,
          total: lineTotal,
        };
      });

      updateData.items = validatedItems;
      updateData.subtotal = subtotal;
      updateData.discountTotal = discountTotal;
      updateData.taxAmount = taxAmount;
      const ship = updateData.shippingCost !== undefined ? updateData.shippingCost : existingOrder.shippingCost;
      const oth = updateData.otherCosts !== undefined ? updateData.otherCosts : existingOrder.otherCosts;
      updateData.total = subtotal - discountTotal + taxAmount + ship + oth;
    }

    const updated = await (prisma as any).purchaseOrder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Orden de compra ${updated.orderNumber} actualizada correctamente.`,
      order: updated,
    });
  } catch (error: any) {
    console.error("[PATCH /api/purchases/[id]] Error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Error al actualizar orden" }, { status: 500 });
  }
}

/**
 * DELETE /api/purchases/[id]
 * Solo permitido para órdenes en estado DRAFT o CANCELLED
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, WRITE_ROLES)) {
      return NextResponse.json({ success: false, error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;

    const existingOrder = await (prisma as any).purchaseOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: "Orden no encontrada" }, { status: 404 });
    }

    if (!["DRAFT", "CANCELLED"].includes(existingOrder.status)) {
      return NextResponse.json(
        { success: false, error: "Solo se pueden eliminar órdenes de compra en borrador o canceladas." },
        { status: 400 }
      );
    }

    await (prisma as any).purchaseOrder.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Orden ${existingOrder.orderNumber} eliminada satisfactoriamente.`,
    });
  } catch (error: any) {
    console.error("[DELETE /api/purchases/[id]] Error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Error al eliminar orden" }, { status: 500 });
  }
}
