import { sendMetaCapiEvent } from "../lib/meta-capi";
import { sendTiktokCapiEvent } from "../lib/tiktok-capi";
import { sendGa4Event } from "../lib/ga4-mp";
import { sendLinkedinCapiEvent } from "../lib/linkedin-capi";
import { prisma } from "../lib/prisma";

async function main() {
    const args = process.argv.slice(2);
    let companyId = args[0];

    if (!companyId) {
        console.log("ℹ️ No se proporcionó un ID de empresa. Buscando la empresa principal en la base de datos...");
        const firstCompany = await prisma.company.findFirst();
        if (!firstCompany) {
            console.error("❌ Error: No se encontraron empresas en la base de datos local.");
            process.exit(1);
        }
        companyId = firstCompany.id;
        console.log(`✅ Empresa autodetectada: ${firstCompany.name} (${firstCompany.id})`);
    } else {
        const comp = await prisma.company.findUnique({ where: { id: companyId } });
        if (!comp) {
            console.error(`❌ Error: La empresa con ID ${companyId} NO existe en esta base de datos.`);
            process.exit(1);
        }
    }

    console.log(`\n======================================================`);
    console.log(`🧪 SIMULADOR DE EVENTOS CAPI - Broad Audience Training`);
    console.log(`======================================================`);
    console.log(`Empresa ID: ${companyId}`);
    
    // Verificar qué integraciones están activas en DB (sin importar si están activadas o no, para debugging)
    const allConfigs = await prisma.integrationConfig.findMany({
        where: { companyId }
    });

    console.log(`\n🔍 DEPURACIÓN: Todas las integraciones guardadas para esta empresa:`);
    allConfigs.forEach(c => {
        console.log(`   - Provider: ${c.provider} | isEnabled: ${c.isEnabled} | Data Keys: ${Object.keys(c.config || {}).join(', ')}`);
    });

    const activeProviders = allConfigs.filter(c => c.isEnabled).map(c => c.provider);
    console.log(`\n🔌 Integraciones activas encontradas en BD para esta empresa:`);
    console.log(activeProviders.length > 0 ? activeProviders.join(", ") : "Ninguna");

    if (activeProviders.length === 0) {
        console.warn("⚠️ No se puede probar porque no hay integraciones habilitadas.");
        process.exit(0);
    }

    // Datos de prueba
    const testUserData = {
        email: "test.capi.validation@example.com",
        phone: "+573000000000",
        firstName: "Test",
        lastName: "User",
        client_ip_address: "181.53.12.22", // IP genérica de Colombia para test
        client_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Test/1.0",
        fbc: undefined,
        fbp: undefined
    };

    console.log(`\n📤 Disparando Evento de Prueba (Lead / Nuevo Contacto)...`);

    // 1. META CAPI
    if (activeProviders.includes("facebook") || activeProviders.includes("facebook-pixel")) {
        console.log(`\n[1/4] Probando Meta CAPI...`);
        try {
            const configRecord = await prisma.integrationConfig.findFirst({ 
                where: { companyId, provider: { in: ['facebook', 'facebook-pixel'] }, isEnabled: true } 
            });
            const config = configRecord?.config as any || {};
            const pixelId = config.pixelId;
            const accessToken = config.capiToken || config.accessToken;
            
            if (pixelId && accessToken) {
                const res = await sendMetaCapiEvent({
                    pixelId,
                    accessToken,
                    eventName: "Lead",
                    userData: testUserData,
                    customData: { contentName: "TEST_CAPI_SCRIPT", value: 0, currency: "USD" },
                    testEventCode: undefined // Opcional: puedes poner el código de test de Meta aquí
                });
                console.log(`✅ Meta CAPI Respondió con Éxito:`, res);
            } else {
                console.log(`❌ Configuración de Meta incompleta (Falta Pixel o Token)`);
            }
        } catch (e: any) {
            console.error(`❌ Meta CAPI Falló:`, e.response?.data || e.message);
        }
    }

    // 2. TIKTOK CAPI
    if (activeProviders.includes("tiktok-pixel")) {
        console.log(`\n[2/4] Probando TikTok CAPI...`);
        try {
            const result = await sendTiktokCapiEvent(companyId, {
                eventName: "SubmitForm",
                userData: {
                    email: testUserData.email,
                    phone: testUserData.phone,
                    clientIpAddress: testUserData.client_ip_address,
                    clientUserAgent: testUserData.client_user_agent
                },
                customData: { contentName: "TEST_CAPI_SCRIPT", value: 0, currency: "USD" }
            });
            
            if (result?.success) console.log(`✅ TikTok CAPI Respondió con Éxito!`);
            else console.log(`❌ TikTok CAPI Falló:`, result?.error);
        } catch (e: any) {
            console.error(`❌ TikTok CAPI Falló Críticamente:`, e.message);
        }
    }

    // 3. GOOGLE ADS ENHANCED CONVERSIONS (vía GA4-MP)
    if (activeProviders.includes("google-analytics")) {
        console.log(`\n[3/4] Probando Google GA4 Measurement Protocol...`);
        try {
            const result = await sendGa4Event(companyId, {
                eventName: "generate_lead",
                userData: {
                    email: testUserData.email,
                    phone: testUserData.phone,
                    firstName: testUserData.firstName,
                    lastName: testUserData.lastName
                },
                eventParams: { lead_source: "TEST_SCRIPT" }
            });

            if (result?.success) console.log(`✅ Google GA4 Respondió con Éxito (HTTP 204)!`);
            else console.log(`❌ Google GA4 Falló:`, result?.error);
        } catch (e: any) {
            console.error(`❌ Google GA4 Falló Críticamente:`, e.message);
        }
    }

    // 4. LINKEDIN CAPI
    if (activeProviders.includes("linkedin-insight")) {
        console.log(`\n[4/4] Probando LinkedIn CAPI...`);
        try {
            const result = await sendLinkedinCapiEvent(companyId, {
                userData: {
                    email: testUserData.email,
                    firstName: testUserData.firstName,
                    lastName: testUserData.lastName
                },
                conversionInfo: {
                    currencyCode: "USD",
                    amount: 0
                }
            });

            if (result?.success) console.log(`✅ LinkedIn CAPI Respondió con Éxito!`);
            else console.log(`❌ LinkedIn CAPI Falló:`, result?.error);
        } catch (e: any) {
            console.error(`❌ LinkedIn CAPI Falló Críticamente:`, e.message);
        }
    }

    console.log(`\n======================================================`);
    console.log(`🏁 SIMULACIÓN TERMINADA.`);
    process.exit(0);
}

main().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
