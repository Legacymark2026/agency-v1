import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const role = session.user.role as UserRole;
        if (role === UserRole.GUEST || role === UserRole.EXTERNAL_CLIENT) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const invoices = await prisma.invoice.findMany({
            where: { companyId: session.user.companyId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error("[INVOICES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Solo Admin o superior puede crear facturas
        const role = session.user.role as UserRole;
        if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
             return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { clientName, serviceDescription, totalAmount, advanceAmount, finalAmount, currency } = body;

        if (!clientName || !serviceDescription || totalAmount === undefined || advanceAmount === undefined || finalAmount === undefined) {
             return new NextResponse("Missing required fields", { status: 400 });
        }

        const invoice = await prisma.invoice.create({
            data: {
                clientName,
                serviceDescription,
                totalAmount,
                advanceAmount,
                finalAmount,
                currency: currency || "USD",
                companyId: session.user.companyId
            }
        });

        return NextResponse.json(invoice);

    } catch (error) {
        console.error("[INVOICES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
