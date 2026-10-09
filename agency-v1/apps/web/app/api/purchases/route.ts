import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Roles autorizados para operar en compras
const READ_ROLES = ["super_admin", "admin", "client_admin", "manager", "content_manager"];
const WRITE_ROLES = ["super_admin", "admin", "client_admin", "manager"];

function checkUserPermission(session: any, allowedRoles: string[]) {
  const role = String(session?.user?.role || "").toLowerCase();
  return allowedRoles.includes(role);
}

/**
 * GET /api/purchases
 * Lista todas las órdenes de compra con filtros por estado, proveedor, bodega y búsqueda por SKU/número.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, READ_ROLES)) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: permisos insuficientes para consultar compras." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const vendorId = searchParams.get("vendorId") || "";
    const warehouseId = searchParams.get("warehouseId") || "";

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (vendorId && vendorId !== "ALL") where.vendorId = vendorId;
    if (warehouseId && warehouseId !== "ALL") where.warehouseId = warehouseId;

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { vendorName: { contains: search, mode: "insensitive" } },
        { vendorNit: { contains: search, mode: "insensitive" } },
      ];
    }

    const orders = await (prisma as any).purchaseOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // También traemos almacenes para resolver nombres de bodegas si existen
    const warehouses = await (prisma as any).warehouse.findMany({
      select: { id: true, name: true, code: true, city: true },
    }).catch(() => []);

    const warehouseMap = new Map(warehouses.map((w: any) => [w.id, w.name]));

    const enrichedOrders = orders.map((o: any) => {
      const rawItems = o.items;
      const itemList = Array.isArray(rawItems) ? rawItems : (rawItems?.items || []);
      const meta = !Array.isArray(rawItems) && typeof rawItems === 'object' ? rawItems : {};

      return {
        ...o,
        currency: meta.currency || o.currency || 'COP',
        exchangeRate: meta.exchangeRate || o.exchangeRate || 1.0,
        incoterm: meta.incoterm || o.incoterm || 'DAP',
        incotermPlace: meta.incotermPlace || o.incotermPlace || null,
        paymentTermsDays: meta.paymentTermsDays || o.paymentTermsDays || 30,
        shippingMethod: meta.shippingMethod || o.shippingMethod || 'TERRESTRE',
        shippingCost: meta.shippingCost || 0,
        otherCosts: meta.otherCosts || 0,
        discountTotal: meta.discountTotal || 0,
        vendorEmail: meta.vendorEmail || o.vendorEmail || null,
        vendorPhone: meta.vendorPhone || o.vendorPhone || null,
        vendorAddress: meta.vendorAddress || o.vendorAddress || null,
        deliveryDate: meta.deliveryDate || o.deliveryDate || null,
        warehouseName: warehouseMap.get(o.warehouseId) || o.warehouseId || "Bodega Central",
        items: itemList,
        itemsCount: itemList.length,
      };
    });

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
      total: enrichedOrders.length,
    });
  } catch (error: any) {
    console.error("[GET /api/purchases] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Error interno al consultar órdenes de compra." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/purchases
 * Crea una nueva Orden de Compra profesional vinculada al catálogo técnico de proveedores.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, WRITE_ROLES)) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: permisos insuficientes para emitir órdenes de compra." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      vendorId,
      vendorName,
      vendorNit,
      vendorEmail,
      vendorPhone,
      vendorAddress,
      warehouseId,
      currency = "COP",
      exchangeRate = 1.0,
      incoterm,
      incotermPlace,
      paymentTermsDays = 30,
      deliveryDate,
      shippingMethod,
      shippingCost = 0,
      otherCosts = 0,
      notes,
      items = [],
    } = body;

    if (!vendorName || !warehouseId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Proveedor, bodega de destino y al menos un artículo son requeridos." },
        { status: 400 }
      );
    }

    // Calcular montos matemáticos
    let subtotal = 0;
    let discountTotal = 0;
    let taxAmount = 0;

    const validatedItems = items.map((item: any) => {
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

    const total = subtotal - discountTotal + taxAmount + Number(shippingCost) + Number(otherCosts);

    // Generar consecutivo OC-YYYY-XXXXX
    const year = new Date().getFullYear();
    const count = await (prisma as any).purchaseOrder.count().catch(() => 0);
    const orderNumber = `OC-${year}-${String(count + 1).padStart(5, "0")}`;

    const companyId = (session.user as any).companyId || "default";

    const newOrder = await (prisma as any).purchaseOrder.create({
      data: {
        orderNumber,
        companyId,
        warehouseId,
        vendorId: vendorId || null,
        vendorName,
        vendorNit: vendorNit || null,
        status: "DRAFT",
        subtotal,
        taxAmount,
        total,
        items: {
          items: validatedItems,
          currency,
          exchangeRate: Number(exchangeRate) || 1.0,
          incoterm: incoterm || null,
          incotermPlace: incotermPlace || null,
          paymentTermsDays: Number(paymentTermsDays) || 30,
          shippingMethod: shippingMethod || "TERRESTRE",
          shippingCost: Number(shippingCost) || 0,
          otherCosts: Number(otherCosts) || 0,
          discountTotal,
          vendorEmail: vendorEmail || null,
          vendorPhone: vendorPhone || null,
          vendorAddress: vendorAddress || null,
          deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
        },
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Orden de Compra ${orderNumber} creada con éxito en borrador.`,
      order: newOrder,
    });
  } catch (error: any) {
    console.error("[POST /api/purchases] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Error al crear orden de compra." },
      { status: 500 }
    );
  }
}
