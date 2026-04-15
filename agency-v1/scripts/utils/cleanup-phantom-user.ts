import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupPhantomUser() {
    console.log('🧹 Cleaning up phantom user...');

    const phantomUserId = '451b9101-549f-42a0-99fa-1dcad9acc057';

    try {
        const user = await prisma.user.findUnique({
            where: { id: phantomUserId }
        });

        if (!user) {
            console.log('✅ Phantom user already gone.');
            return;
        }

        console.log(`⚠️  Found phantom user: ${user.email} (Role: ${user.role})`);

        // Delete the user
        await prisma.user.delete({
            where: { id: phantomUserId }
        });

        console.log('✅ Successfully deleted phantom user.');
        console.log('👉 Please ask the user to clear cookies/re-login immediately.');

    } catch (error) {
        console.error('❌ Error cleaning up user:', error);
    }
}

cleanupPhantomUser();
