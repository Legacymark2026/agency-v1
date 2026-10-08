import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MANDATORY_DOCS = ["RUT", "CAMARA_COMERCIO", "CERTIFICACION_BANCARIA"];

// Roles autorizados para operar sobre el módulo de Proveedores
const READ_ROLES = ["super_admin", "admin", "manager", "client_admin", "content_manager"];
const WRITE_ROLES = ["super_admin", "admin", "client_admin", "manager"];

function checkUserPermission(session: any, allowedRoles: string[]) {
  const role = String(session?.user?.role || "").toLowerCase();
  return allowedRoles.includes(role);
}

/**
 * GET /api/suppliers
 * Lista de proveedores con sus documentos de cumplimiento y parámetros extendidos
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, READ_ROLES)) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: permisos insuficientes para consultar proveedores." },
        { status: 403 }
      );
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

      // Deserializar customFields o inicializar defaults
      const extra = typeof s.customFields === "object" && s.customFields !== null ? s.customFields : {};

      return {
        ...s,
        // Parámetros comerciales y operativos
        commercialName: s.name,
        legalName: s.legalName || s.name,
        logoUrl: extra.logoUrl || null,
        mobilePhone: extra.mobilePhone || s.contactPhone || "",
        rawMaterialsScope: extra.rawMaterialsScope || [],
        specialTaxRegime: extra.specialTaxRegime || "REGIMEN_ORDINARIO", // REGIMEN_ORDINARIO, SIMPLE, GRAN_CONTRIBUYENTE, AUTORRETENEDOR, ESPECIAL_ESAL
        departmentContacts: extra.departmentContacts || [],
        accountBalance: extra.accountBalance || { currentBalance: 0, pendingInvoices: 0, lastPaymentDate: null },
        deliveryTerms: extra.deliveryTerms || { shippingMethod: "TERRESTRE", leadTimeDays: 3 },
        incoterm: extra.incoterm || "DDP", // EXW, FCA, CPT, CIP, DAP, DPU, DDP, FOB, CIF
        delayPenaltyPolicy: extra.delayPenaltyPolicy || { penaltyPctPerDay: 0, maxPenaltyPct: 0, gracePeriodDays: 2 },
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
 * Registrar un nuevo proveedor maestro con todos los parámetros completos
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, WRITE_ROLES)) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: rol sin privilegios para dar de alta proveedores." },
        { status: 403 }
      );
    }

    const companyId = (session.user as any)?.companyId || "default_company";
    const body = await req.json();

    const {
      name,
      commercialName,
      legalName,
      taxId,
      taxType = "NIT",
      category = "RAW_MATERIALS",
      status = "ACTIVE",
      logoUrl,
      contactName,
      contactEmail,
      contactPhone,
      mobilePhone,
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
      rawMaterialsScope = [],
      specialTaxRegime = "REGIMEN_ORDINARIO",
      departmentContacts = [],
      accountBalance = { currentBalance: 0, pendingInvoices: 0, lastPaymentDate: null },
      deliveryTerms = { shippingMethod: "TERRESTRE", leadTimeDays: 3 },
      incoterm = "DDP",
      delayPenaltyPolicy = { penaltyPctPerDay: 0, maxPenaltyPct: 0, gracePeriodDays: 2 },
    } = body;

    const finalName = commercialName || name;

    if (!finalName || !taxId) {
      return NextResponse.json(
        { success: false, error: "Razón social / Nombre Comercial y Documento Tributario (NIT/RUT) son obligatorios." },
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

    const customFields = {
      logoUrl,
      mobilePhone,
      rawMaterialsScope,
      specialTaxRegime,
      departmentContacts,
      accountBalance,
      deliveryTerms,
      incoterm,
      delayPenaltyPolicy,
    };

    const supplier = await (prisma as any).supplier.create({
      data: {
        companyId,
        name: finalName,
        legalName: legalName || finalName,
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
        status: status || "ACTIVE",
        ratingScore: 5.0,
        notes,
        customFields,
      },
      include: {
        documents: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Proveedor registrado exitosamente en el catálogo maestro.",
      supplier: {
        ...supplier,
        ...customFields,
        commercialName: supplier.name,
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
