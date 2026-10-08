import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MANDATORY_DOCS = ["RUT", "CAMARA_COMERCIO", "CERTIFICACION_BANCARIA"];

/**
 * GET /api/suppliers
 * Lista de proveedores con sus documentos de cumplimiento
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (category && category !== "ALL") where.category = category;
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { legalName: { contains: search, mode: "insensitive" } },
        { taxId: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const suppliers = await (prisma as any).supplier.findMany({
      where,
      include: {
        documents: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
      take: 200,
    });

    const now = new Date();

    const formatted = suppliers.map((s: any) => {
      const activeDocs = (s.documents || []).filter((d: any) => d.status === "ACTIVE");
      const activeDocTypes = activeDocs.map((d: any) => d.documentType);
      const missingMandatory = MANDATORY_DOCS.filter((m) => !activeDocTypes.includes(m));
      const expiredDocs = (s.documents || []).filter(
        (d: any) => d.expiryDate && new Date(d.expiryDate) < now
      );

      return {
        ...s,
        compliance: {
          compliant: missingMandatory.length === 0 && expiredDocs.length === 0,
          missingMandatoryDocs: missingMandatory,
          expiredDocs: expiredDocs.map((d: any) => d.documentType),
        },
      };
    });

    return NextResponse.json({
      success: true,
      count: formatted.length,
      suppliers: formatted,
    });
  } catch (error: any) {
    console.error("[SuppliersAPI] GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/suppliers
 * Registrar un nuevo proveedor maestro
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const companyId = (session.user as any)?.companyId || "default_company";
    const body = await req.json();

    const {
      name,
      legalName,
      taxId,
      taxType = "NIT",
      category = "GENERAL",
      contactName,
      contactEmail,
      contactPhone,
      address,
      city,
      country = "Colombia",
      paymentTermsDays = 30,
      creditLimit = 0,
      currency = "COP",
      bankName,
      bankAccountType,
      bankAccountNumber,
      bankAccountHolder,
      discountRatePct = 0,
      notes,
    } = body;

    if (!name || !taxId) {
      return NextResponse.json(
        { success: false, error: "Razón social / Nombre y Documento Tributario (NIT/RUT) son obligatorios." },
        { status: 400 }
      );
    }

    const existing = await (prisma as any).supplier.findFirst({
      where: {
        companyId,
        taxId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Ya existe un proveedor registrado con el NIT/Documento ${taxId}.` },
        { status: 409 }
      );
    }

    const supplier = await (prisma as any).supplier.create({
      data: {
        companyId,
        name,
        legalName: legalName || name,
        taxId,
        taxType,
        category,
        contactName,
        contactEmail,
        contactPhone,
        address,
        city,
        country,
        paymentTermsDays: Number(paymentTermsDays) || 30,
        creditLimit: Number(creditLimit) || 0,
        currency,
        bankName,
        bankAccountType,
        bankAccountNumber,
        bankAccountHolder,
        discountRatePct: Number(discountRatePct) || 0,
        status: "ACTIVE",
        ratingScore: 5.0,
        notes,
      },
      include: {
        documents: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Proveedor registrado exitosamente.",
      supplier: {
        ...supplier,
        compliance: {
          compliant: false,
          missingMandatoryDocs: MANDATORY_DOCS,
          expiredDocs: [],
        },
      },
    });
  } catch (error: any) {
    console.error("[SuppliersAPI] POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
