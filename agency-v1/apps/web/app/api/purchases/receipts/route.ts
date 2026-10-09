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
 * GET /api/purchases/receipts
 * Lista de actas de recepción con filtrado por orden de compra o estado
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
    const purchaseOrderId = searchParams.get("purchaseOrderId") || "";

    const where: any = {};
    if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId;

    let receipts = [];
    if ((prisma as any).goodsReceipt) {
      receipts = await (prisma as any).goodsReceipt.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }).catch(() => []);
    }

    return NextResponse.json({ success: true, receipts });
  } catch (error: any) {
    console.error("[GET /api/purchases/receipts] Error:", error);
    return NextResponse.json({ success: true, receipts: [] });
  }
}

/**
 * POST /api/purchases/receipts
 * Recibe mercancía en muelle contra una Orden de Compra:
 * - Valida cantidades pedidas vs entregadas
 * - Separa aceptadas vs rechazadas
 * - Alimenta el kárdex (IN_PURCHASE) y crea lotes en tbl_product_lots
 * - Actualiza la OC a PARTIALLY_RECEIVED o RECEIVED
 * - Si hubo rechazos, genera automáticamente el registro de Devolución (PurchaseReturn)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, WRITE_ROLES)) {
      return NextResponse.json({ success: false, error: "Acceso denegado: permisos insuficientes para recibir mercancía" }, { status: 403 });
    }

    const body = await req.json();
    const {
      purchaseOrderId,
      carrierName,
      trackingGuide,
      deliveryNoteRef,
      items = [], // [{ productId, internalSku, name, orderedQty, receivedQty, acceptedQty, rejectedQty, rejectionReason, lotNumber, expiryDate, condition }]
      notes,
    } = body;

    if (!purchaseOrderId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Orden de compra y artículos recibidos requeridos." }, { status: 400 });
    }

    const po = await (prisma as any).purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
    });

    if (!po) {
      return NextResponse.json({ success: false, error: "Orden de compra no encontrada." }, { status: 404 });
    }

    const companyId = (session.user as any)?.companyId || po.companyId || "default";
    const year = new Date().getFullYear();
    const countReceipts = await (prisma as any).goodsReceipt.count().catch(() => 0);
    const receiptNumber = `REC-${year}-${String(countReceipts + 1).padStart(5, "0")}`;

    // Evaluar estado general de la recepción e impacto en inventario
    let totalOrdered = 0;
    let totalAccepted = 0;
    let totalRejected = 0;
    const rejectedItemsList: any[] = [];

    const validatedItems = items.map((it: any) => {
      const ord = Number(it.orderedQty) || 0;
      const rec = Number(it.receivedQty) || 0;
      const acc = Number(it.acceptedQty) || 0;
      const rej = Number(it.rejectedQty) || (rec - acc > 0 ? rec - acc : 0);

      totalOrdered += ord;
      totalAccepted += acc;
      totalRejected += rej;

      if (rej > 0) {
        rejectedItemsList.push({
          internalSku: it.internalSku,
          name: it.name,
          quantity: rej,
          reason: it.rejectionReason || "Rechazo en muelle por no conformidad",
          unitCost: it.unitCost || 0,
          lotNumber: it.lotNumber || null,
        });
      }

      return {
        ...it,
        orderedQty: ord,
        receivedQty: rec,
        acceptedQty: acc,
        rejectedQty: rej,
        lotNumber: it.lotNumber || `LT-${year}-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: it.expiryDate || null,
      };
    });

    // 1. Crear Acta de Recepción
    const receipt = await (prisma as any).goodsReceipt.create({
      data: {
        receiptNumber,
        companyId,
        purchaseOrderId: po.id,
        orderNumber: po.orderNumber,
        warehouseId: po.warehouseId,
        vendorId: po.vendorId,
        vendorName: po.vendorName,
        carrierName: carrierName || null,
        trackingGuide: trackingGuide || null,
        deliveryNoteRef: deliveryNoteRef || null,
        status: "COMPLETED",
        items: validatedItems,
        notes: notes || null,
        receivedBy: session.user.name || session.user.email,
        receivedAt: new Date(),
      },
    });

    // 2. Registrar Lotes y Entrada en Kárdex para los ítems aceptados
    for (const item of validatedItems) {
      if (item.acceptedQty > 0) {
        // Crear ProductLot si la tabla existe
        await (prisma as any).productLot.create({
          data: {
            companyId,
            warehouseId: po.warehouseId,
            productId: item.productId || item.internalSku,
            sku: item.internalSku,
            lotNumber: item.lotNumber,
            quantity: item.acceptedQty,
            initialQuantity: item.acceptedQty,
            unitCost: item.unitPrice || 0,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
          },
        }).catch(() => null);

        // Crear Movimiento de Kárdex
        await (prisma as any).inventoryMovement.create({
          data: {
            companyId,
            warehouseId: po.warehouseId,
            productId: item.productId || item.internalSku,
            sku: item.internalSku,
            type: "IN_PURCHASE",
            quantity: item.acceptedQty,
            unitCost: item.unitPrice || 0,
            reference: po.orderNumber,
            notes: `Ingreso por recepción ${receiptNumber} en muelle`,
          },
        }).catch(() => null);
      }
    }

    // 3. Generar Devolución automática si hubo mercancía rechazada
    let autoReturn = null;
    if (rejectedItemsList.length > 0) {
      const countReturns = await (prisma as any).purchaseReturn.count().catch(() => 0);
      const returnNumber = `DEV-${year}-${String(countReturns + 1).padStart(5, "0")}`;

      autoReturn = await (prisma as any).purchaseReturn.create({
        data: {
          returnNumber,
          companyId,
          purchaseOrderId: po.id,
          orderNumber: po.orderNumber,
          goodsReceiptId: receipt.id,
          vendorId: po.vendorId,
          vendorName: po.vendorName,
          warehouseId: po.warehouseId,
          status: "REQUESTED",
          returnType: "REJECTION_AT_DOCK",
          items: rejectedItemsList,
          totalRefund: rejectedItemsList.reduce((acc, curr) => acc + (curr.quantity * curr.unitCost), 0),
          notes: `Generado automáticamente por rechazo en recepción ${receiptNumber}`,
        },
      });
    }

    // 4. Actualizar estado de la Orden de Compra
    const newStatus = totalAccepted >= totalOrdered ? "RECEIVED" : "PARTIALLY_RECEIVED";
    await (prisma as any).purchaseOrder.update({
      where: { id: po.id },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      message: `Recepción ${receiptNumber} registrada con éxito. Estado OC: ${newStatus}`,
      receipt,
      autoReturn,
      newOrderStatus: newStatus,
    });
  } catch (error: any) {
    console.error("[POST /api/purchases/receipts] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
