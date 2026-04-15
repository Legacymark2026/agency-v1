
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAppMode() {
    console.log('🕵️ CHECKING FACEBOOK APP MODE...\n');

    const email = 'administrador@legacymark.com';
    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    if (!user?.profile?.metadata) return;
    const meta = user.profile.metadata as any;
    const token = meta.manualConnectedPageToken;
    const appId = '716753194854147'; // From previous logs

    try {
        const url = `https://graph.facebook.com/v19.0/${appId}?fields=id,name,roles,link,category&access_token=${token}`;
        const res = await fetch(url);
        const json = await res.json();

        console.log('--- APP DETAILS ---');
        console.log(JSON.stringify(json, null, 2));

        // Check if we can fetch roles (only works for admins/devs)
        if (json.roles) {
            console.log('We can see roles.');
        } else {
            console.log('Roles hidden (likely normal behavior).');
        }

    } catch (e) { console.error(e); }
}

checkAppMode();
