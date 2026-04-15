
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@legacymark.com';
    const password = 'password123';

    console.log(`🔍 Checking for user: ${email}...`);

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
        console.log(`✅ User found (ID: ${existingUser.id}). Updating password...`);
        await prisma.user.update({
            where: { email },
            data: {
                passwordHash: hashedPassword,
                role: 'super_admin' // Ensure role is correct
            }
        });
        console.log(`🎉 Password updated to: ${password}`);
    } else {
        console.log(`⚠️ User not found. Creating new admin user...`);
        await prisma.user.create({
            data: {
                email,
                name: 'Admin User',
                passwordHash: hashedPassword,
                role: 'super_admin'
            }
        });
        console.log(`🎉 User created with password: ${password}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
