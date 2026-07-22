import http from "http";

export async function runIntegrationTests(baseUrl: string) {
    console.log("  🔹 [NIVEL 2: PRUEBAS DE INTEGRACIÓN] Verificando endpoints y lógica de servicio...");

    // Helper request
    const postJson = (path: string, body: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify(body);
            const u = new URL(baseUrl + path);
            const req = http.request(
                {
                    hostname: u.hostname,
                    port: u.port,
                    path: u.pathname,
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(data),
                    },
                },
                (res) => {
                    let respStr = "";
                    res.on("data", (chunk) => (respStr += chunk));
                    res.on("end", () => {
                        try {
                            resolve({ status: res.statusCode, body: JSON.parse(respStr) });
                        } catch (e) {
                            resolve({ status: res.statusCode, text: respStr });
                        }
                    });
                }
            );
            req.on("error", reject);
            req.write(data);
            req.end();
        });
    };

    // Test 1: API DV NIT Validation
    const resDv = await postJson("/api/pos/dian/verify-nit-dv", { nit: "1005462317" });
    if (resDv.status !== 200 || resDv.body?.dv !== "0") {
        throw new Error(`Integration Test Failed: /api/pos/dian/verify-nit-dv returned ${JSON.stringify(resDv)}`);
    }
    console.log("    ✓ [INTEGRATION] Endpoint /api/pos/dian/verify-nit-dv: OK");

    // Test 2: API UBL 2.1 XML Generator
    const resXml = await postJson("/api/pos/dian/generate-xml-ubl21", {
        documentType: "FACTURA_ELECTRONICA",
        prefix: "SETG",
        number: "980000001",
        issueDate: "2026-07-21",
        issueTime: "09:55:00-05:00",
        paymentForm: "Contado",
        paymentMethod: "Efectivo",
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
            name: "NEOGESTION S.A.S",
            documentType: "NIT",
            documentNumber: "804017909",
            email: "gerencia@neogestion.co"
        },
        items: [
            {
                nro: 1,
                code: "82101504",
                description: "CONSULTORIA DE MARCA",
                quantity: 1,
                unitPrice: 500000,
                totalItemValue: 500000
            }
        ],
        subtotal: 500000,
        taxTotal: 95000,
        discountTotal: 0,
        grandTotal: 595000
    });

    if (resXml.status !== 200 || !resXml.body?.cufe || !resXml.body?.xmlContent) {
        throw new Error(`Integration Test Failed: /api/pos/dian/generate-xml-ubl21 returned ${JSON.stringify(resXml)}`);
    }
    console.log("    ✓ [INTEGRATION] Endpoint /api/pos/dian/generate-xml-ubl21: OK");

    // Test 3: API Habilitation Test Set
    const resTestSet = await postJson("/api/pos/dian/run-test-set", {
        testSetId: "dian-test-set-88291",
        issuer: { nit: "1005462317", companyName: "GARCIA DURAN NESTOR ELIAN" }
    });

    if (resTestSet.status !== 200 || resTestSet.body?.habilitation?.status !== "HABILITADO_DIAN_OK") {
        throw new Error(`Integration Test Failed: /api/pos/dian/run-test-set returned ${JSON.stringify(resTestSet)}`);
    }
    console.log("    ✓ [INTEGRATION] Endpoint /api/pos/dian/run-test-set: OK");

    // Test 4: API Catalog Products Endpoint
    const getJson = (path: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            const u = new URL(baseUrl + path);
            const req = http.request(
                {
                    hostname: u.hostname,
                    port: u.port,
                    path: u.pathname,
                    method: "GET",
                },
                (res) => {
                    let respStr = "";
                    res.on("data", (chunk) => (respStr += chunk));
                    res.on("end", () => {
                        try {
                            resolve({ status: res.statusCode, body: JSON.parse(respStr) });
                        } catch (e) {
                            resolve({ status: res.statusCode, text: respStr });
                        }
                    });
                }
            );
            req.on("error", reject);
            req.end();
        });
    };

    const resProducts = await getJson("/api/pos/products");
    if (resProducts.status !== 200 || !Array.isArray(resProducts.body?.products)) {
        throw new Error(`Integration Test Failed: /api/pos/products returned ${JSON.stringify(resProducts)}`);
    }
    console.log("    ✓ [INTEGRATION] Endpoint /api/pos/products (Microservicio Catálogo): OK\n");
}
