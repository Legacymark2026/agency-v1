
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Please provide an email address as an argument.');
        process.exit(1);
    }

    console.log(`Looking for user with email: ${email}...`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error('User not found!');
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (${user.id}). Current role: ${user.role}`);

        const updatedUser = await prisma.user.update({
            where: { email },
            data: { role: 'SUPER_ADMIN' },
        });

        console.log(`SUCCESS: User ${updatedUser.email} is now ${updatedUser.role}`);
    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
