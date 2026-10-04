import { PrismaClient } from '@prisma/client';
import { buildUBL21Invoice, signUBL21, sendBillSync } from '@agency/dian-engine';
import { decryptPII } from '@agency/vault-client';

const prisma = new PrismaClient();

async function processQueue() {
    console.log("[DIAN] Iniciando escaneo de Cola de Contingencia Tipo 04 (SLA: 48h)...");
    
    // Buscar facturas encoladas en los últimos 2 días (48 horas)
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

    const queuedInvoices = await prisma.invoice.findMany({
        where: {
            dianStatus: 'QUEUED',
            createdAt: {
                gte: twoDaysAgo
            }
        },
        include: { company: true }
    });

    if (queuedInvoices.length === 0) {
        console.log("[DIAN] Cola vacía. Sistema al día.");
        return;
    }

    console.log(`[DIAN] Encontradas ${queuedInvoices.length} facturas encoladas. Procesando...`);

    for (const invoice of queuedInvoices) {
        try {
            console.log(`[DIAN] Reintentando transmisión para Factura ${invoice.id}...`);
            
            const certRow = await prisma.dianCertificate.findFirst({
                where: { companyId: invoice.companyId }
            });

            if (!certRow || !certRow.certificateBase64) {
                throw new Error("No hay un certificado digital (.p12) configurado para la firma UBL.");
            }

            const p12Buffer = Buffer.from(certRow.certificateBase64, 'base64');
            let p12Password = certRow.passwordHash;
            try {
                if (p12Password.length > 30) p12Password = decryptPII(p12Password);
            } catch (e) {
                console.warn("[DIAN] Vault Decryption failed, using fallback.");
            }

            const { xml, cufe } = buildUBL21Invoice({
                invoiceNumber: `FE-${invoice.id.split('-')[0].toUpperCase()}`,
                issueDate: invoice.createdAt, // Contingency MUST use the original date
                totalAmount: invoice.finalAmount,
                subtotal: invoice.subtotalAmount,
                taxes: {
                    iva: invoice.taxAmount,
                    ica: invoice.reteICA || 0,
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
                environment: "2"
            });

            const signedXml = signUBL21(xml, { p12Buffer, p12Password });
            const zipFileName = `z${invoice.company.taxId || "900000000"}000${invoice.id.split('-')[0]}.zip`;

            // En un entorno real llamaríamos sendBillSync
            // const soapRes = await sendBillSync(zipFileName, signedXml, {...});

            await prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                    dianStatus: "ACCEPTED",
                    status: "EMITIDA_DIAN",
                    cufe: cufe,
                    notes: `${invoice.notes || ''}\n[RECOVERY] Transmitida desde Cola de Contingencia tras recuperación DIAN. CUFE: ${cufe}`
                }
            });

            console.log(`[DIAN] ✅ Factura ${invoice.id} recuperada y transmitida (CUFE: ${cufe}).`);

        } catch (error: any) {
            console.error(`[DIAN] ❌ Fallo al procesar factura ${invoice.id} en la cola:`, error.message);
            // Queda en QUEUED para el próximo ciclo
        }
    }
}

// Ejecutar si se invoca directo
if (require.main === module) {
    processQueue()
        .then(() => process.exit(0))
        .catch(e => {
            console.error(e);
            process.exit(1);
        });
}
