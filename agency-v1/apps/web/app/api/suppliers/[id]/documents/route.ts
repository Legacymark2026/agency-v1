import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const WRITE_ROLES = ["super_admin", "admin", "client_admin", "manager"];

function checkUserPermission(session: any, allowedRoles: string[]) {
  const role = String(session?.user?.role || "").toLowerCase();
  return allowedRoles.includes(role);
}

/**
 * POST /api/suppliers/[id]/documents
 * Adjuntar un documento regulatorio o comercial a un proveedor (Requiere rol de escritura)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!checkUserPermission(session, WRITE_ROLES)) {
      return NextResponse.json(
        { success: false, error: "Acceso denegado: rol sin permisos para certificar documentos de proveedores." },
        { status: 403 }
      );
    }

    const { id: supplierId } = await params;
    const body = await req.json();
    const { documentType, title, fileUrl, expiryDate, notes } = body;

    if (!documentType || !title || !fileUrl) {
      return NextResponse.json(
        { success: false, error: "Tipo de documento, título y URL del archivo son obligatorios." },
        { status: 400 }
      );
    }

    const supplier = await (prisma as any).supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json({ success: false, error: "Proveedor no encontrado" }, { status: 404 });
    }

    const doc = await (prisma as any).supplierDocument.create({
      data: {
        supplierId,
        companyId: supplier.companyId,
        documentType,
        title,
        fileUrl,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: (session.user as any)?.name || (session.user as any)?.email || "Administrador",
        status: "ACTIVE",
        notes,
      },
    });

    return NextResponse.json({ success: true, message: "Documento adjuntado y certificado exitosamente.", document: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
