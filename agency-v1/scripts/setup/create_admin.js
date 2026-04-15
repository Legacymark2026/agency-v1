
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@legacymark.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Creating user ${email}...`);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
            role: 'super_admin'
        },
        create: {
            email,
            passwordHash: hashedPassword,
            name: 'Admin User',
            firstName: 'Admin',
            lastName: 'User',
            role: 'super_admin',
        },
    });

    console.log(`User created/updated: ${user.email}`);
    console.log(`Password: ${password}`);

    // Create profile
    try {
        await prisma.userProfile.create({
            data: {
                userId: user.id,
                jobTitle: 'Super Admin',
                department: 'IT',
                bio: 'System Administrator'
            }
        });
        console.log('Profile created.');
    } catch (e) {
        console.log('Profile creation skipped (might already exist).');
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
