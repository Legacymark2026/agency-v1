
import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'enriquebohorque02@gmail.com';
    const password = 'Rebyeh2620..';

    console.log(`Checking for ${email}...`);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.error("❌ User not found!");
        return;
    }

    console.log(`User found. Role: ${user.role}`);

    const match = await compare(password, user.passwordHash || "");
    if (match) {
        console.log("✅ Password MATCHES hash. Credentials are correct.");
    } else {
        console.error("❌ Password DOES NOT MATCH hash.");
    }
}

main().finally(() => prisma.$disconnect());
