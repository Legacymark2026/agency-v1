import { prisma } from '../lib/prisma';

async function main() {
    const userId = "7e860ceb-70ba-493f-a29f-f4c2cf696eb9";
    const acc = await prisma.account.findFirst({ where: { userId, provider: 'facebook' } });

    if (!acc || !acc.access_token) {
        console.log("No user access token found.");
        return;
    }

    const token = acc.access_token;
    console.log("Checking User Token Permissions...");
    const permUrl = `https://graph.facebook.com/v19.0/me/permissions?access_token=${token}`;
    const perms = await fetch(permUrl).then(r => r.json());
    console.log("Permissions:", JSON.stringify(perms, null, 2));
}
main().then(() => process.exit(0));
