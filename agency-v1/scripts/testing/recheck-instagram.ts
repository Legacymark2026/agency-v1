
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAndRecheckInstagram() {
    console.log('🔄 RESETTING INSTAGRAM SYNC LOGIC & CHECKING...\n');

    const email = 'administrador@legacymark.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true }
    });

    if (!user || !user.profile?.metadata) { console.error('No metadata'); return; }
    const meta = user.profile.metadata as any;
    const pageId = meta.manualConnectedPageId;
    const pageToken = meta.manualConnectedPageToken;

    // 1. Get IG ID
    console.log('1. Fetching linked Instagram ID...');
    const pageRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
    const pageData = await pageRes.json();
    const igId = pageData.instagram_business_account?.id;
    console.log(`   IG ID: ${igId || 'NOT FOUND'}`);

    if (!igId) return;

    // 2. Fetch using IG User ID directly (This is often more reliable for IG DMs)
    // We'll try just the 'conversations' edge on the IG User ID
    console.log('\n2. Trying Direct IG User Access (Might need specific permissions)...');
    try {
        const url = `https://graph.facebook.com/v19.0/${igId}/conversations?access_token=${pageToken}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            console.error(`   Error: ${data.error.message}`);
            if (data.error.code === 200) {
                console.log('   ⚠️  This confirms the "Allow Access to Messages" setting is OFF on the phone.');
                console.log('       Please open Instagram App > Settings > Privacy > Messages > Allow Access.');
            }
        } else {
            console.log(`   ✅ Success! Found ${data.data?.length || 0} via IG User Endpoint.`);
            if (data.data && data.data.length > 0) {
                console.log('   Found messages using this method!');
            }
        }
    } catch (e) { console.error(e); }

    // 3. Check Page Roles (Maybe user isn't admin on the page for IG?)
    console.log('\n3. Checking Page Tasks/Roles...');
    try {
        const tasksUrl = `https://graph.facebook.com/v19.0/${pageId}/roles?access_token=${pageToken}`;
        // Note: roles edge is deprecated/restricted, try /me/permissions for page
        const permUrl = `https://graph.facebook.com/v19.0/me/permissions?access_token=${pageToken}`;
        const permRes = await fetch(permUrl);
        const permData = await permRes.json();
        const igPerms = permData.data?.filter((p: any) => p.permission.includes('instagram'));
        console.log('   Instagram Permissions Granted:', igPerms?.map((p: any) => p.permission));
    } catch (e) { }

}

resetAndRecheckInstagram();
