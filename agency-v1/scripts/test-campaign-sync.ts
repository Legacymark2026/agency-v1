import { PrismaClient } from '@prisma/client';
import { validateCampaignAllPlatforms } from '../lib/validators/platform-validators';
// In a real environment we would import the dispatchers directly,
// but to avoid spending real money, we'll only mock the validation and persistence.
// If you want to really hit the APIS, you would use:
// import { launchMultiPlatformCampaign } from '../actions/marketing/campaign-builder';

const prisma = new PrismaClient();

async function main() {
    console.log("🧪 Iniciando test de sincronización de campañas...\n");

    // 1. Obtener una compañía de prueba
    const company = await prisma.company.findFirst();
    if (!company) {
        console.error("❌ No se encontró ninguna compañía en la base de datos.");
        return;
    }

    console.log(`✅ Compañía de prueba encontrada: ${company.name} (${company.id})`);

    // 2. Parámetros de prueba
    const testPayload = {
        name: `Test Campaign ${Date.now()}`,
        platform: 'FACEBOOK_ADS,TIKTOK_ADS',
        budget: 1500,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días después
        description: 'Campaña de prueba para verificar guardado de parámetros y configs.',
        parameters: {
            objective: 'OUTCOME_LEADS',
            bidStrategy: 'COST_CAP',
            bidAmount: 15.5,
            locations: ['CO', 'US', 'MX'],
            minAge: 25,
            maxAge: 45,
            customAudiences: 'aud_123,aud_456',
            manualPlacements: 'FB_IG'
        },
        trackingConfig: {
            pixelId: 'px_7777777',
            conversionEvent: 'LEAD',
            utmSource: 'legacymark_builder',
            utmMedium: 'social_paid'
        }
    };

    console.log("📝 Payload generado para la campaña:", JSON.stringify(testPayload, null, 2));

    // 3. Simular Guardado en Base de Datos (Como haría saveCampaignDraft)
    console.log("\n💾 Guardando campaña en la base de datos...");
    const savedCampaign = await prisma.campaign.create({
        data: {
            name: testPayload.name,
            code: `TEST-${Date.now()}`,
            platform: testPayload.platform,
            status: 'DRAFT',
            approvalStatus: 'DRAFT',
            launchStatus: 'PENDING',
            companyId: company.id,
            budget: testPayload.budget,
            startDate: testPayload.startDate,
            endDate: testPayload.endDate,
            description: testPayload.description,
            parameters: testPayload.parameters,
            trackingConfig: testPayload.trackingConfig as any,
        }
    });

    console.log(`✅ Campaña guardada exitosamente en BD con ID: ${savedCampaign.id}`);

    // 4. Leer la base de datos para asegurar persistencia
    const verifyCampaign = await prisma.campaign.findUnique({
        where: { id: savedCampaign.id }
    });

    if (verifyCampaign?.parameters && (verifyCampaign.parameters as any).objective === 'OUTCOME_LEADS') {
        console.log("✅ Los parámetros avanzados (JSON) se guardaron correctamente.");
    } else {
        console.error("❌ Fallo guardando los parámetros avanzados.");
    }

    if (verifyCampaign?.trackingConfig && (verifyCampaign.trackingConfig as any).pixelId === 'px_7777777') {
        console.log("✅ La configuración de Tracking (JSON) se guardó correctamente.");
    } else {
        console.error("❌ Fallo guardando la configuración de Tracking.");
    }

    // 5. Validaciones Pre-Flight de Sincronización
    console.log("\n🚀 Realizando Pre-Flight Check (Sincronización con plataformas)...");
    const validations = await validateCampaignAllPlatforms({
        platform: savedCampaign.platform,
        budget: savedCampaign.budget,
        parameters: savedCampaign.parameters as Record<string, unknown> | null,
    });

    validations.forEach(v => {
        if (v.valid) {
            console.log(`✅ [${v.platform}] - Listo para sincronizar.`);
        } else {
            console.log(`❌ [${v.platform}] - Encontró errores de validación antes de sincronizar:`);
            v.errors.forEach(e => console.log(`   - [${e.severity}] ${e.message}`));
        }
    });

    // Nota de seguridad
    console.log("\n⚠️ NOTA: El dispatch real vía API hacia Meta/TikTok no se ejecutó en este test para evitar cargos de presupuesto.");
    console.log("Si deseas probar el Graph API directamente, debes invocar `launchMultiPlatformCampaign` del action `campaign-builder`.");

    // Cleanup de prueba
    await prisma.campaign.delete({ where: { id: savedCampaign.id } });
    console.log("\n🧹 Limpieza completada. Campaña de test eliminada.");
}

main()
    .catch(e => {
        console.error("Error running test:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
