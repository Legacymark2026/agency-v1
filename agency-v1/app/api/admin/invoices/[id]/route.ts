import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/auth";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
             return new NextResponse("Unauthorized", { status: 401 });
        }

        const role = session.user.role as UserRole;
        if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id }
        });

        if (!invoice || invoice.companyId !== session.user.companyId) {
             return new NextResponse("Not Found", { status: 404 });
        }

        await prisma.invoice.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
         console.error("[INVOICE_DELETE]", error);
         return new NextResponse("Internal Error", { status: 500 });
    }
}
