import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { amount, currency = "USD", clientName = "Cliente", description = "Servicios Profesionales", companyId } = body;

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        // Use requested companyId or default to primary company
        let targetCompanyId = companyId;
        if (!targetCompanyId) {
            const firstCompany = await prisma.company.findFirst();
            if (!firstCompany) {
                return NextResponse.json({ error: "No company configured" }, { status: 500 });
            }
            targetCompanyId = firstCompany.id;
        }

        const token = randomUUID();

        const invoice = await prisma.invoice.create({
            data: {
                clientName,
                serviceDescription: description,
                subtotalAmount: numericAmount,
                taxAmount: 0,
                discountAmount: 0,
                totalAmount: numericAmount,
                advanceAmount: 0,
                finalAmount: numericAmount,
                currency: currency.toUpperCase(),
                status: "DRAFT_AWAITING_PAYMENT",
                token: token,
                companyId: targetCompanyId,
                items: {
                    create: [
                        {
                            title: description,
                            quantity: 1,
                            unitPrice: numericAmount,
                            taxRate: 0,
                            totalAmount: numericAmount,
                        }
                    ]
                }
            }
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://legacymarksas.com";
        const publicUrl = `${baseUrl}/es/invoice/${token}`;

        return NextResponse.json({
            success: true,
            invoiceId: invoice.id,
            token: invoice.token,
            publicUrl: publicUrl,
            amount: numericAmount,
            currency: currency.toUpperCase()
        });

    } catch (error: any) {
        console.error("🔴 Error creating quick invoice link:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
