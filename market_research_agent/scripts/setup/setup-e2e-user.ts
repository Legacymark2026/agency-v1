
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'e2e@test.com';
    const password = 'TestPassword123!';
    const hashedPassword = await hash(password, 12);

    // Upsert user
    const user = await prisma.user.upsert({
        where: { email },
        update: { passwordHash: hashedPassword },
        create: {
            email,
            name: "E2E Tester",
            passwordHash: hashedPassword,
            role: "admin"
        }
    });

    console.log(`User ready: ${email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
