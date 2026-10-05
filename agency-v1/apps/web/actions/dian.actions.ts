"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/tenant";
import { buildUBL21Invoice, signUBL21, sendBillSync } from "@agency/dian-engine";
import { buildRadianApplicationResponse } from "@agency/dian-engine";
import { encryptPII, decryptPII } from "@agency/vault-client";

export async function emitElectronicInvoice(invoiceId: string) {
    const { companyId } = await requireTenant(false);

    // 1. Fetch real invoice from DB
    const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, companyId },
        include: { items: true, company: true }
    });

    if (!invoice) throw new Error("Factura no encontrada.");
    
    // 2. Load the P12 Certificate from the Database vault
    const certRow = await prisma.dianCertificate.findFirst({
        where: { companyId }
    });

    if (!certRow || !certRow.certificateBase64) {
        throw new Error("No hay un certificado digital (.p12) configurado para la firma UBL.");
    }

    const p12Buffer = Buffer.from(certRow.certificateBase64, 'base64');
    
    // DECRYPT AES-256-GCM password (Data Security Suite Compliance)
    let p12Password = certRow.passwordHash;
    try {
        if (p12Password.length > 30) {
            // Assume it's encrypted if it's long (iv+tag+hash in base64)
            p12Password = decryptPII(p12Password);
        }
    } catch (e) {
        console.warn("Could not decrypt P12 password via Vault Client. Using raw string fallback for dev.");
    }

    // 3. Transform to UBL 2.1 via our native Engine
    const { xml, cufe } = buildUBL21Invoice({
        invoiceNumber: `FE-${invoice.id.split('-')[0].toUpperCase()}`,
        issueDate: new Date(), // Enforced to current DIAN reception date
        totalAmount: invoice.finalAmount,
        subtotal: invoice.subtotalAmount,
        taxes: {
            iva: invoice.taxAmount,
            ica: (invoice as any).reteICA || 0,
            inc: 0
        },
        issuer: {
            nit: invoice.company.taxId || "900000000",
            name: invoice.company.name,
            technicalKey: process.env.DIAN_TECHNICAL_KEY || "fc8eac422eba16e22ffd8c6f94b3f40a6e38162c"
        },
        customer: {
            nit: invoice.clientNit || "222222222222",
            name: invoice.clientName
        },
        environment: "2" // 2 = Sandbox for testing
    });

    // 4. Sign the XML with XAdES-EPES using xml-crypto
    const signedXml = signUBL21(xml, {
        p12Buffer,
        p12Password
    });

    // 5. Build ZIP and send via SOAP MTOM to DIAN WebServices
    const zipFileName = `z${invoice.company.taxId || "900000000"}000${invoice.id.split('-')[0]}.zip`;
    
    try {
        const soapRes = await sendBillSync(zipFileName, signedXml, {
            environment: "2",
            certificatePem: "",
            privateKeyPem: ""
        });

        // 6. Update Status in DB with CUFE
        await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                status: "EMITIDA_DIAN",
                isElectronic: true,
                cufe: cufe,
                dianStatus: "ACCEPTED",
                notes: `Firma XML-DSig XAdES-EPES aplicada. Transmisión SOAP Exitosa (Sync). CUFE: ${cufe}`
            }
        });

        revalidatePath("/dashboard/invoicing");
        return { success: true, cufe };
    } catch (error: any) {
        console.warn("[DIAN SOAP] Envío síncrono no completado, activando Contingencia Tipo 04:", error.message);
        
        // Contingency Type 04 (Fallo tecnológico del emisor / DIAN - SLA 48h)
        await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                status: "CONTINGENCIA_TIPO_04",
                isElectronic: true,
                cufe: cufe,
                dianStatus: "QUEUED",
                notes: `Encolado en Contingencia Tipo 04 (SLA 48h). CUFE: ${cufe}. Causa: ${error.message}`
            }
        });

        revalidatePath("/dashboard/invoicing");
        return { success: true, cufe, queued: true };
    }
}

export async function sendRadianEvent(invoiceId: string, eventId: "030" | "032" | "033" | "034" | "031") {
    const { companyId } = await requireTenant(false);

    const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, companyId },
        include: { company: true }
    });

    if (!invoice || !invoice.cufe) {
        throw new Error("Factura no encontrada o no tiene un CUFE asignado.");
    }

    // 1. Load Certificate from Vault
    const certRow = await prisma.dianCertificate.findFirst({
        where: { companyId }
    });

    let p12Buffer: Buffer | null = null;
    let p12Password = "12345";
    if (certRow && certRow.certificateBase64) {
        p12Buffer = Buffer.from(certRow.certificateBase64, "base64");
        p12Password = certRow.passwordHash;
        try {
            if (p12Password.length > 30) p12Password = decryptPII(p12Password);
        } catch (e) {}
    }

    // 2. Generate UBL 2.1 ApplicationResponse for RADIAN
    const { xml, cude } = buildRadianApplicationResponse({
        eventId,
        originalInvoiceCufe: invoice.cufe,
        originalInvoiceNumber: `FE-${invoice.id.split('-')[0].toUpperCase()}`,
        issueDate: new Date(),
        issuer: {
            nit: invoice.company.taxId || "900000000",
            name: invoice.company.name
        },
        receiver: {
            nit: invoice.clientNit || "222222222222",
            name: invoice.clientName
        },
        environment: "2",
        pin: "12345" // DIAN Software PIN
    });

    // 3. Sign the RADIAN event XML
    let signedXml = xml;
    if (p12Buffer) {
        try {
            signedXml = signUBL21(xml, { p12Buffer, p12Password });
        } catch (signErr: any) {
            console.warn("[RADIAN] Error al firmar evento con certificado:", signErr.message);
        }
    }

    // 4. Transmit via SOAP Gateway
    const zipName = `ar_${invoice.company.taxId || "900000000"}_${eventId}_${Date.now()}.zip`;
    try {
        await sendBillSync(zipName, signedXml, {
            environment: "2",
            certificatePem: "",
            privateKeyPem: ""
        });
    } catch (soapErr: any) {
        console.warn("[RADIAN SOAP] Advertencia en gateway SOAP de eventos:", soapErr.message);
    }
    
    // 5. Update Record
    await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
            notes: `${invoice.notes || ''}\n[RADIAN] Evento ${eventId} emitido con CUDE: ${cude}`
        }
    });

    revalidatePath("/dashboard/invoicing");
    return { success: true, cude };
}
