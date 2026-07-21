import http from "http";

export async function runE2ETests(baseUrl: string) {
    console.log("  🔺 [NIVEL 3: PRUEBAS END-TO-END / CONTRATO DE SERVICIO] Simulando ciclo de caja y venta POS...");

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

    const companyId = "company_test_e2e_01";

    // Paso 1: Apertura de Caja Registradora (Apertura Z)
    const resOpen = await postJson("/api/pos/sessions/open", {
        companyId,
        registerName: "Caja Principal Test E2E",
        openingBalance: 150000
    });
    if (resOpen.status !== 201 || !resOpen.body?.session?.id) {
        throw new Error(`E2E Step 1 Failed: Apertura de caja falló (${JSON.stringify(resOpen)})`);
    }
    console.log(`    ✓ [E2E - Paso 1] Apertura de Caja Registradora (Sesión: ${resOpen.body.session.id}): OK`);

    // Paso 2: Registro de Venta POS & Emisión de Factura DIAN CUFE
    const resSale = await postJson("/api/pos/orders", {
        companyId,
        customerName: "CONSULTORIA DE COLOMBIA S.A.S",
        customerNit: "804017909",
        paymentMethod: "CASH",
        receivedAmount: 200000,
        items: [
            { id: "p1", title: "Licencia Sistema POS Cloud", quantity: 1, unitPrice: 150000, taxRate: 0.19 }
        ]
    });

    if (resSale.status !== 201 || !resSale.body?.cufe || !resSale.body?.receiptTicket) {
        throw new Error(`E2E Step 2 Failed: Registro de Venta POS falló (${JSON.stringify(resSale)})`);
    }
    console.log(`    ✓ [E2E - Paso 2] Venta Registrada & Factura Emitida con CUFE (${resSale.body.cufe.substring(0, 24)}...): OK`);

    // Paso 3: Cierre de Caja Registradora (Arqueo Z)
    const resClose = await postJson("/api/pos/sessions/close", {
        companyId,
        closingBalance: 328500, // 150.000 apertura + 178.500 venta con IVA
        notes: "Cierre E2E verificado sin cuadre de caja"
    });

    if (resClose.status !== 200 || resClose.body?.summary?.status !== "CLOSED") {
        throw new Error(`E2E Step 3 Failed: Cierre Arqueo Z falló (${JSON.stringify(resClose)})`);
    }
    console.log("    ✓ [E2E - Paso 3] Arqueo Z & Cierre de Caja Registradora: OK\n");
}
