import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAccountScope() {
    console.log('DEBUG_SCOPE_START');

    const email = 'administrador@legacymark.com';

    // 1. Find User
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            accounts: true
        }
    });

    if (!user) {
        console.log('USER_NOT_FOUND');
        return;
    }

    // 2. Check Accounts
    const fbAccount = user.accounts.find(a => a.provider === 'facebook');

    if (!fbAccount) {
        console.log('NO_FB_ACCOUNT');
    } else {
        const currentScopes = fbAccount.scope || 'NONE';
        const requiredScopes = ['pages_show_list', 'pages_read_engagement', 'pages_manage_metadata', 'pages_messaging'];

        requiredScopes.forEach(scope => {
            const hasScope = currentScopes.includes(scope);
            console.log(`SCOPE:${scope}:${hasScope ? 'OK' : 'MISSING'}`);
        });
    }
    console.log('DEBUG_SCOPE_END');
}

checkAccountScope();
