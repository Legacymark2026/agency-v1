import { sendMetaCapiEvent } from '../lib/meta-capi';
import { prisma } from '../lib/prisma';

/**
 * META ADS FULL FUNNEL TEST SCRIPT
 * 
 * This script allows you to verify that all 4 lifecycle events are being 
 * correctly sent and received by Meta.
 * 
 * INSTRUCTIONS:
 * 1. Go to Meta Events Manager -> Test Events.
 * 2. Copy your "Test Event Code" (e.g., TEST12345).
 * 3. Run this script.
 */

async function runFullTest(testCode: string, companyId: string) {
    console.log(`\n🚀 Starting Meta Ads Funnel Test for Company: ${companyId}`);
    console.log(`📍 Using Test Event Code: ${testCode}\n`);

    // 1. Fetch credentials from DB
    const configRecord = await prisma.integrationConfig.findFirst({
        where: { companyId, provider: 'facebook' }
    });

    if (!configRecord) {
        console.error("❌ Error: No se encontró configuración de Facebook para esta empresa en la base de datos.");
        return;
    }

    const config = configRecord.config as any;
    const pixelId = config.pixelId;
    const accessToken = config.capiToken || config.accessToken;

    if (!pixelId || !accessToken) {
        console.error("❌ Error: Datos incompletos en la configuración:");
        console.log(`  - Pixel ID: ${pixelId ? '✅ OK' : '❌ FALTANTE'}`);
        console.log(`  - CAPI Access Token: ${accessToken ? '✅ OK' : '❌ FALTANTE'}`);
        console.log("\n💡 Ve a LegacyMark -> Configuración -> Integraciones y guarda ambos campos.");
        return;
    }

    const testUser = {
        email: 'test_lead_' + Date.now() + '@legacymark.test',
        phone: '5550102030',
        firstName: 'Test',
        lastName: 'Senior Optimizer',
        fbc: 'fb.1.' + Date.now() + '.test_click_id',
        fbp: 'fb.1.' + Date.now() + '.test_browser_id'
    };

    const events = [
        { name: 'Lead', data: { source: 'TEST_SCRIPT' } },
        { name: 'Contact', data: { method: 'TEST_SCRIPT' } },
        { name: 'QualifiedLead', data: { score: 95, leadType: 'TEST_B2B' } },
        { name: 'Purchase', data: { value: 99.99, currency: 'USD', contentName: 'LegacyMark Pro Plan' } }
    ];

    for (const event of events) {
        console.log(`📤 Sending event: ${event.name}...`);
        const result = await sendMetaCapiEvent({
            pixelId,
            accessToken,
            eventName: event.name as any,
            userData: testUser,
            customData: event.data,
            testEventCode: testCode
        });

        if (result.success) {
            console.log(`✅ Success for ${event.name}`);
        } else {
            console.error(`❌ Failed for ${event.name}:`, result.error);
        }
        // Small delay between events
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("\n✨ Test completed. Please check your Meta Events Manager Dashboard.");
}

// Get arguments from command line
const testCode = process.argv[2];
const companyId = process.argv[3];

if (!testCode || !companyId) {
    console.log("Usage: npx tsx tests/meta-full-funnel-test.ts <TEST_CODE> <COMPANY_ID>");
} else {
    runFullTest(testCode, companyId).catch(console.error);
}
