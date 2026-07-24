import { NextResponse } from "next/server";
import { generateInvoiceViaGrpc } from "@/lib/grpc-invoicing-client";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const result = await generateInvoiceViaGrpc({
            document_type: body.documentType || "FACTURA_ELECTRONICA",
            prefix: body.prefix || "FE",
            number: body.number || "300001",
            issue_date: body.issueDate || new Date().toISOString().split("T")[0],
            issue_time: body.issueTime || "10:00:00-05:00",
            payment_form: body.paymentForm || "Contado",
            payment_method: body.paymentMethod || "Transferencia Débito Bancaria",
            operation_type: body.operationType || "10",
            technical_key: body.technicalKey || "fc8b05a6315d0ae2041cd135ffd39b5e2c622f0a929db4489dd56dbb9a20c11",
            environment: body.environment || "2",
            issuer: body.issuer || {
                company_name: "EMPRESA DEMO S.A.S",
                nit: "900123456",
                dv: "1",
            },
            buyer: body.buyer || {
                name: "CONSUMIDOR FINAL",
                document_number: "222222222222",
            },
            items: body.items || [],
            subtotal: Number(body.subtotal) || 0,
            tax_total: Number(body.taxTotal) || 0,
            discount_total: Number(body.discountTotal) || 0,
            grand_total: Number(body.grandTotal) || 0,
        });

        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err.message || "Falla al procesar API gRPC Invoicing" },
            { status: 500 }
        );
    }
}
