import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateInvoiceViaGrpc } from "@/lib/grpc-invoicing-client";
import { z } from "zod";

const DianInvoiceSchema = z.object({
    documentType: z.string().default("FACTURA_ELECTRONICA"),
    prefix: z.string().default("FE"),
    number: z.string().default("300001"),
    issueDate: z.string().optional(),
    issueTime: z.string().default("10:00:00-05:00"),
    paymentForm: z.string().default("Contado"),
    paymentMethod: z.string().default("Transferencia Débito Bancaria"),
    operationType: z.string().default("10"),
    technicalKey: z.string().optional(),
    environment: z.string().default("2"),
    issuer: z.object({
        company_name: z.string(),
        nit: z.string(),
        dv: z.string(),
    }).optional(),
    buyer: z.object({
        name: z.string(),
        document_number: z.string(),
    }).optional(),
    items: z.array(z.any()).default([]),
    subtotal: z.number().default(0),
    taxTotal: z.number().default(0),
    discountTotal: z.number().default(0),
    grandTotal: z.number().default(0),
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const parsed = DianInvoiceSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: "Datos de factura inválidos", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const data = parsed.data;

        const result = await generateInvoiceViaGrpc({
            document_type: data.documentType,
            prefix: data.prefix,
            number: data.number,
            issue_date: data.issueDate || new Date().toISOString().split("T")[0],
            issue_time: data.issueTime,
            payment_form: data.paymentForm,
            payment_method: data.paymentMethod,
            operation_type: data.operationType,
            technical_key: data.technicalKey || "fc8b05a6315d0ae2041cd135ffd39b5e2c622f0a929db4489dd56dbb9a20c11",
            environment: data.environment,
            issuer: data.issuer || {
                company_name: "EMPRESA DEMO S.A.S",
                nit: "900123456",
                dv: "1",
            },
            buyer: data.buyer || {
                name: "CONSUMIDOR FINAL",
                document_number: "222222222222",
            },
            items: data.items,
            subtotal: data.subtotal,
            tax_total: data.taxTotal,
            discount_total: data.discountTotal,
            grand_total: data.grandTotal,
        });

        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err.message || "Falla al procesar API gRPC Invoicing" },
            { status: 500 }
        );
    }
}

