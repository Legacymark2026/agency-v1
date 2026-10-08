import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/suppliers/[id]/documents
 * Adjuntar un documento regulatorio o comercial a un proveedor
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
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
        verifiedBy: (session.user as any)?.name || "Sistema",
        status: "ACTIVE",
        notes,
      },
    });

    return NextResponse.json({ success: true, message: "Documento adjuntado exitosamente", document: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
