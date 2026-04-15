import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { FacebookProvider } from '@/lib/integrations/facebook';

const prisma = new PrismaClient();

async function runAudit() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   META API SYNC AUDIT - LEGACYMARK OMNICHANNEL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Env Var Check
    console.log('[1/4] Checking Environment Variables...');
    const requiredVars = [
        { name: 'META_APP_ID', legacy: 'FACEBOOK_CLIENT_ID' },
        { name: 'META_APP_SECRET', legacy: 'FACEBOOK_CLIENT_SECRET' },
        { name: 'META_WEBHOOK_VERIFY_TOKEN', legacy: 'FACEBOOK_WEBHOOK_VERIFY_TOKEN' }
    ];

    requiredVars.forEach(v => {
        const val = process.env[v.name];
        const legacyVal = process.env[v.legacy];
        if (val) {
            console.log(`✅ ${v.name}: Found`);
        } else if (legacyVal) {
            console.log(`⚠️  ${v.name}: Not found (using legacy ${v.legacy} ✅)`);
        } else {
            console.log(`❌ ${v.name}: MISSING (Legacy ${v.legacy} also missing)`);
        }
    });

    // 2. Integration Config Check
    console.log('\n[2/4] Checking Database IntegrationConfigs...');
    const configs = await prisma.integrationConfig.findMany({
        where: { provider: 'facebook' }
    });

    if (configs.length === 0) {
        console.log('❌ No Meta configurations found in database.');
    } else {
        console.log(`✅ Found ${configs.length} configuration(s).`);
        configs.forEach(c => {
            const data = c.config as any;
            console.log(`   - Company: ${c.companyId}`);
            console.log(`     Enabled: ${c.isEnabled ? '✅' : '❌'}`);
            console.log(`     Page ID: ${data.pageId || '❌ Missing'}`);
            console.log(`     Token:   ${data.accessToken ? '✅ Present' : '❌ Missing'}`);
        });
    }

    // 3. Webhook Delivery Status
    console.log('\n[3/4] Checking Recent Webhook Events...');
    const events = await prisma.webhookEvent.findMany({
        where: { platform: 'META' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    if (events.length === 0) {
        console.log('⚠️  No Meta webhook events found in database. Possible reasons:');
        console.log('   - Webhook URL not configured in Meta portal');
        console.log('   - Verify Token mismatch');
        console.log('   - The server is not reachable from Meta');
    } else {
        console.log(`✅ Found ${events.length} recent events.`);
        events.forEach(e => {
            console.log(`   - [${e.createdAt.toISOString()}] Type: ${e.eventType} | Processed: ${e.processedAt ? '✅' : '✅'}`);
        });
    }

    // 4. Token Health (Graph API Debug)
    console.log('\n[4/4] Probing Meta Graph API Health...');
    for (const c of configs) {
        const data = c.config as any;
        if (data.accessToken) {
            try {
                const response = await fetch(`https://graph.facebook.com/v19.0/debug_token?input_token=${data.accessToken}&access_token=${data.accessToken}`);
                const debugData = await response.json();
                
                if (debugData.data?.is_valid) {
                    const expiry = debugData.data.data_access_expires_at || debugData.data.expires_at;
                    const expiryDate = expiry ? new Date(expiry * 1000).toLocaleDateString() : 'Never';
                    console.log(`✅ Token for ${c.companyId} is VALID. Expires: ${expiryDate}`);
                } else {
                    console.log(`❌ Token for ${c.companyId} is INVALID or EXPIRED.`);
                    console.log(`   Error: ${debugData.error?.message || 'Unknown error'}`);
                }
            } catch (err) {
                console.log(`❌ Failed to probe Graph API for ${c.companyId}`);
            }
        }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   AUDIT COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

runAudit()
    .catch(err => {
        console.error('\n❌ Audit failed with error:', err.message);
    })
    .finally(() => prisma.$disconnect());
