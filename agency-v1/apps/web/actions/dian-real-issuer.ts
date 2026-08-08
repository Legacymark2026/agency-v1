"use server";

import { buildRealDianUblXml, buildRealDianSoapEnvelope, DianInvoiceDataInput } from "@/lib/dian-ubl-generator";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function issueRealDianInvoice(input: {
    invoiceNumber: string;
    prefix: string;
    buyerNit: string;
    buyerName: string;
    buyerEmail: string;
    items: {
        code: string;
        unspscCode: string;
        name: string;
        quantity: number;
        price: number;
        vatRate: number;
    }[];
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return { success: false, error: "No autenticado" };
    }

    try {
        const dateStr = new Date().toISOString().split("T")[0];
        const timeStr = new Date().toTimeString().split(" ")[0] + "-05:00";

        const invoicePayload: DianInvoiceDataInput = {
            invoiceNumber: input.invoiceNumber,
            prefix: input.prefix,
            issueDate: dateStr,
            issueTime: timeStr,
            technicalKey: "fc8eac422eba16e22ffd8c6f94b3f40a6e38112d7d06e23b2075a6e87a25032d8471a5c689d0f488f7b764b8a2135678",
            environment: "2", // 2 = Habilitación / Pruebas DIAN
            seller: {
                nit: "901345678",
                dv: "1",
                name: "LEGACYMARK S.A.S.",
                email: "facturacion@legacymark.com",
                address: "Carrera 27 # 36-14",
                cityCode: "68001",
            },
            buyer: {
                docType: "31",
                docNumber: input.buyerNit,
                name: input.buyerName,
                email: input.buyerEmail,
                address: "Calle Comercial 100",
                cityCode: "68001",
            },
            items: input.items,
        };

        // Real XML UBL 2.1 & Real SHA-384 CUFE
        const result = buildRealDianUblXml(invoicePayload);
        const zipContentBase64 = Buffer.from(result.xml).toString("base64");
        const soapEnvelope = buildRealDianSoapEnvelope(zipContentBase64, input.invoiceNumber);

        return {
            success: true,
            cufe: result.cufe,
            qrText: result.qrText,
            subtotal: result.subtotal,
            vatTotal: result.vatTotal,
            total: result.total,
            xmlContent: result.xml,
            soapEnvelope: soapEnvelope,
            environment: "2 - Habilitación / Pruebas DIAN",
        };
    } catch (err: any) {
        return { success: false, error: err.message || "Error al emitir factura DIAN" };
    }
}
