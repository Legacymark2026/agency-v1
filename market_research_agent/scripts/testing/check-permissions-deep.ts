
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPermissionsDeep() {
    console.log('🕵️ DEEP PERMISSION CHECK...\n');

    const email = 'administrador@legacymark.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true }
    });

    if (!user) { console.error('No user'); return; }

    const fbAccount = user.accounts.find(a => a.provider === 'facebook');
    if (!fbAccount || !fbAccount.access_token) {
        console.error('No Facebook Token');
        return;
    }

    const token = fbAccount.access_token;
    console.log(`Token: ${token.substring(0, 15)}...`);

    try {
        // Inspect the token using itself
        const url = `https://graph.facebook.com/v19.0/debug_token?input_token=${token}&access_token=${token}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.data) {
            console.log('\n--- TOKEN METADATA ---');
            console.log(`Is Valid: ${data.data.is_valid}`);
            console.log(`App ID:   ${data.data.app_id}`);
            console.log(`User ID:  ${data.data.user_id}`);
            console.log(`Expires:  ${new Date(data.data.expires_at * 1000).toLocaleString()}`);

            console.log('\n--- SCOPES ---');
            console.log(data.data.scopes);

            if (data.data.granular_scopes) {
                console.log('\n--- GRANULAR SCOPES ---');
                data.data.granular_scopes.forEach((gs: any) => {
                    console.log(`Scope: ${gs.scope}`);
                    console.log(`   Target Type: ${gs.target_ids ? 'Specific IDs' : 'All'}`);
                    if (gs.target_ids) console.log(`   IDs: ${gs.target_ids.join(', ')}`);
                });
            }
        } else {
            console.error('Failed to debug token:', data);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkPermissionsDeep();
