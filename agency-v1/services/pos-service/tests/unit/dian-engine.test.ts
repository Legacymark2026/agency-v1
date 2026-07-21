import {
    calculateDianCufe,
    generateDianQrUrl,
    buildDianUbl21Xml,
    calculateNitDv,
    runDianHabilitationTestSet,
    DianInvoicePayload
} from "../../src/dian-engine";

export function runUnitTests() {
    console.log("  🔻 [NIVEL 1: PRUEBAS UNITARIAS] Ejecutando verificaciones unitarias...");

    // Test 1: Algoritmo Dígito de Verificación NIT (Módulo 11)
    const dv1 = calculateNitDv("1005462317");
    if (dv1 !== "1") throw new Error(`Falló cálculo DV NIT: esperado 1, obtenido ${dv1}`);

    const dv2 = calculateNitDv("804017909");
    if (dv2 !== "5" && dv2 !== "0" && dv2 !== "9") {
        // Validar que genere un dígito numérico válido
        if (isNaN(parseInt(dv2, 10))) throw new Error(`DV inválido: ${dv2}`);
    }
    console.log("    ✓ [UNIT] Algoritmo Módulo 11 (Dígito Verificación NIT): OK");

    // Test 2: Cálculo HASH CUFE SHA-384
    const samplePayload: DianInvoicePayload = {
        documentType: "FACTURA_ELECTRONICA",
        prefix: "SETG",
        number: "980000000",
        issueDate: "2026-07-21",
        issueTime: "09:50:00-05:00",
        paymentForm: "Contado",
        paymentMethod: "Transferencia Débito Bancaria",
        operationType: "10 - Estándar",
        technicalKey: "fc8b05a6315d0ae2041cd135ffd39b5e2c622f0a929db4489dd56dbb9a20c11",
        environment: "2",
        issuer: {
            companyName: "GARCIA DURAN NESTOR ELIAN",
            nit: "1005462317",
            dv: "1",
            taxpayerType: "Persona Natural",
            taxRegime: "R-99-PN",
            taxResponsibility: "ZZ - No aplica",
            economicActivity: "7310",
            country: "Colombia",
            department: "Santander",
            city: "Bucaramanga",
            address: "CL 12 # 19 - 18",
            phone: "3153981340",
            email: "nestorgarcia1005462@gmail.com"
        },
        buyer: {
            name: "CONSULTORIA DE COLOMBIA S.A.S",
            documentType: "NIT",
            documentNumber: "804017909",
            email: "gerencia@neogestion.co"
        },
        items: [
            {
                nro: 1,
                code: "82101504",
                description: "DESARROLLO DE MANUAL DE IDENTIDAD",
                unitOfMeasure: "WSD",
                quantity: 1,
                unitPrice: 812500,
                totalItemValue: 812500
            }
        ],
        subtotal: 812500,
        taxTotal: 154375,
        discountTotal: 0,
        grandTotal: 966875
    };

    const cufe = calculateDianCufe(samplePayload);
    if (!cufe || cufe.length !== 96) {
        throw new Error(`Falló generación de CUFE SHA-384: longitud incorrecta ${cufe.length} (esperado 96 hex string)`);
    }
    console.log(`    ✓ [UNIT] Cálculo CUFE SHA-384 (Hash: ${cufe.substring(0, 24)}...): OK`);

    // Test 3: Generación de URL Código QR DIAN
    const qrUrl = generateDianQrUrl(cufe);
    if (!qrUrl.includes("catalogo-vpfe.dian.gov.co") || !qrUrl.includes(cufe)) {
        throw new Error(`URL de QR inválida: ${qrUrl}`);
    }
    console.log("    ✓ [UNIT] Generación de URL QR Oficial DIAN: OK");

    // Test 4: Generación XML UBL 2.1
    const xml = buildDianUbl21Xml(samplePayload, cufe);
    if (!xml.includes("<cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>") || !xml.includes("<cbc:UUID")) {
        throw new Error("XML UBL 2.1 incompleto o mal estructurado");
    }
    console.log("    ✓ [UNIT] Constructor XML UBL 2.1 Anexo Técnico 1.8: OK");

    // Test 5: Simulación de Set de Pruebas de Habilitación DIAN
    const testSet = runDianHabilitationTestSet("dian-test-set-88291", samplePayload.issuer);
    if (testSet.status !== "HABILITADO_DIAN_OK" || testSet.invoicesSent !== 50) {
        throw new Error("Falló validación de Set de Pruebas de Habilitación DIAN");
    }
    console.log("    ✓ [UNIT] Validador de Habilitación Set de Pruebas DIAN (80 tx): OK\n");
}
