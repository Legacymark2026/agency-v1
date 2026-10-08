import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const READ_ROLES = ["super_admin", "admin", "manager", "client_admin", "content_manager"];
const WRITE_ROLES = ["super_admin", "admin", "client_admin", "manager"];

function checkUserPermission(session: any, allowedRoles: string[]) {
  const role = String(session?.user?.role || "").toLowerCase();
  return allowedRoles.includes(role);
}

/**
 * GET /api/suppliers/[id]/products
 * Listar el catálogo de artículos/productos provistos por un proveedor
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

    const { id: supplierId } = await params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const supplierType = searchParams.get("supplierType") || "";

    const where: any = { supplierId };
    if (status && status !== "ALL") where.availabilityStatus = status;
    if (supplierType && supplierType !== "ALL") where.supplierType = supplierType;
    if (search) {
      where.OR = [
        { internalSku: { contains: search, mode: "insensitive" } },
        { supplierSku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await (prisma as any).supplierProduct.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error("[SupplierProductsAPI] GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/suppliers/[id]/products
 * Registrar un nuevo ítem en el catálogo técnico-comercial del proveedor
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, WRITE_ROLES)) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: rol sin permisos de edición en catálogo de proveedores." },
        { status: 403 }
      );
    }

    const { id: supplierId } = await params;
    const companyId = (session.user as any)?.companyId || "default_company";
    const body = await req.json();

    const {
      internalSku,
      supplierSku,
      barcode,
      name,
      description,
      category = "GENERAL",
      subcategory,
      purchasePrice = 0,
      currency = "COP",
      discountStructure,
      taxRatePct = 19,
      priceValidityStart,
      priceValidityEnd,
      purchaseUnit = "UNIDAD",
      conversionFactor = 1.0,
      minOrderQty = 1.0,
      orderMultiple = 1.0,
      leadTimeDays = 3,
      availabilityStatus = "ACTIVE",
      supplierType = "PRIMARY",
      shelfLifeDays,
      storageConditions,
      notes,
    } = body;

    if (!internalSku || !supplierSku || !name) {
      return NextResponse.json(
        { success: false, error: "SKU Interno, SKU Proveedor y Nombre del Producto son campos obligatorios." },
        { status: 400 }
      );
    }

    // Validar unicidad de internalSku para este proveedor
    const existing = await (prisma as any).supplierProduct.findFirst({
      where: {
        supplierId,
        internalSku,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `El SKU Interno ${internalSku} ya existe en el catálogo de este proveedor.` },
        { status: 409 }
      );
    }

    const product = await (prisma as any).supplierProduct.create({
      data: {
        supplierId,
        companyId,
        internalSku,
        supplierSku,
        barcode: barcode || null,
        name,
        description: description || null,
        category,
        subcategory: subcategory || null,
        purchasePrice: Number(purchasePrice) || 0,
        currency,
        discountStructure: discountStructure || null,
        taxRatePct: Number(taxRatePct) || 0,
        priceValidityStart: priceValidityStart ? new Date(priceValidityStart) : null,
        priceValidityEnd: priceValidityEnd ? new Date(priceValidityEnd) : null,
        purchaseUnit,
        conversionFactor: Number(conversionFactor) || 1.0,
        minOrderQty: Number(minOrderQty) || 1.0,
        orderMultiple: Number(orderMultiple) || 1.0,
        leadTimeDays: Number(leadTimeDays) || 3,
        availabilityStatus,
        supplierType,
        shelfLifeDays: shelfLifeDays ? Number(shelfLifeDays) : null,
        storageConditions: storageConditions || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Producto homologado y registrado en el catálogo del proveedor.",
      product,
    });
  } catch (error: any) {
    console.error("[SupplierProductsAPI] POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
