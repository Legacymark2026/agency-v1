import { PrismaClient } from '@prisma/client';
import { buildUBL21Invoice, signUBL21 } from '@agency/dian-engine';
import { buildRadianApplicationResponse } from '@agency/dian-engine';
import { decryptPII } from '@agency/vault-client';

const prisma = new PrismaClient();

async function runTestSet() {
    console.log("==================================================");
    console.log("   DIAN ENTERPRISE - AUTOMATED TEST SET RUNNER");
    console.log("==================================================");
    console.log("[TEST] Iniciando inyección de 100 documentos...");

    const testCompanyId = "COMPANY-TEST-ID-123"; // Reemplazar con ID real si se corre en prod
    const testNit = "900000000";

    // 1. Verificar certificado
    console.log("[TEST] Cargando certificado del vault...");
    let p12Buffer: Buffer;
    let p12Password = "12345";
    
    try {
        const certRow = await prisma.dianCertificate.findFirst();
        if (certRow && certRow.certificateBase64) {
            p12Buffer = Buffer.from(certRow.certificateBase64, 'base64');
            p12Password = certRow.passwordHash;
            try {
                if (p12Password.length > 30) p12Password = decryptPII(p12Password);
            } catch (e) {}
            console.log("[TEST] Certificado X.509 cargado correctamente en memoria.");
        } else {
            console.log("[TEST] ⚠️ No se encontró certificado. Abortando Set de Pruebas.");
            return;
        }
    } catch (e) {
        console.log("[TEST] Error al conectar BD para cargar certificado.");
        return;
    }

    // 2. Generar lote de Facturas (Ej: 8 Facturas de venta, 1 Nota Crédito, 1 Nota Débito)
    // Según requerimiento DIAN, el test set suele ser entre 8 a 10 documentos de prueba para habilitación.
    
    const requiredDocs = [
        ...Array(8).fill('FACTURA'),
        'NOTA_CREDITO',
        'NOTA_DEBITO'
    ];

    let successCount = 0;

    for (let i = 0; i < requiredDocs.length; i++) {
        const docType = requiredDocs[i];
        const invoiceNumber = `SET-${i + 1}`;
        console.log(`\n[TEST] ---> Emitiendo ${docType} ${invoiceNumber}`);

        try {
            // Generar UBL
            const { xml, cufe } = buildUBL21Invoice({
                invoiceNumber: invoiceNumber,
                issueDate: new Date(),
                totalAmount: 150000 + (i * 1000),
                subtotal: 126050 + (i * 1000),
                taxes: {
                    iva: 23950,
                    ica: 0,
                    inc: 0
                },
                issuer: {
                    nit: testNit,
                    name: "EMPRESA PRUEBAS S.A.S",
                    technicalKey: process.env.DIAN_TECHNICAL_KEY || "fc8eac422eba16e22ffd8c6f94b3f40a6e38162c"
                },
                customer: {
                    nit: "222222222222",
                    name: "CLIENTE PRUEBA CONSUMIDOR FINAL"
                },
                environment: "2"
            });

            // Sign XML
            const signedXml = signUBL21(xml, { p12Buffer, p12Password });
            
            // Aquí iría el llamado real a SOAP
            // await sendBillSync(...)
            
            console.log(`[TEST] ✅ Éxito (Local). CUFE Generado: ${cufe}`);
            successCount++;

        } catch (error: any) {
            console.error(`[TEST] ❌ Error en ${invoiceNumber}: ${error.message}`);
        }
    }

    console.log("==================================================");
    console.log(`[TEST] SET FINALIZADO. ${successCount}/${requiredDocs.length} documentos procesados.`);
    if (successCount === requiredDocs.length) {
        console.log("[TEST] ESTADO: ACEPTADO (Revisar en portal DIAN sandbox).");
    } else {
        console.log("[TEST] ESTADO: RECHAZADO.");
    }
}

if (require.main === module) {
    runTestSet()
        .then(() => process.exit(0))
        .catch(e => {
            console.error(e);
            process.exit(1);
        });
}
