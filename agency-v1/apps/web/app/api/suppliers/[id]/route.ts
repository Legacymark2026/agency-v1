import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/suppliers/[id]
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
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

    return NextResponse.json({ success: true, supplier });
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

    const { id } = await params;
    const body = await req.json();

    const allowedUpdates = [
      "name",
      "legalName",
      "category",
      "contactName",
      "contactEmail",
      "contactPhone",
      "address",
      "city",
      "country",
      "paymentTermsDays",
      "creditLimit",
      "currency",
      "bankName",
      "bankAccountType",
      "bankAccountNumber",
      "bankAccountHolder",
      "discountRatePct",
      "status",
      "ratingScore",
      "notes",
    ];

    const data: any = {};
    for (const key of allowedUpdates) {
      if (key in body) {
        if (key === "paymentTermsDays" || key === "creditLimit" || key === "discountRatePct" || key === "ratingScore") {
          data[key] = Number(body[key]);
        } else {
          data[key] = body[key];
        }
      }
    }

    const updated = await (prisma as any).supplier.update({
      where: { id },
      data,
      include: {
        documents: true,
      },
    });

    return NextResponse.json({ success: true, supplier: updated });
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

    const { id } = await params;
    await (prisma as any).supplier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Proveedor eliminado exitosamente" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
