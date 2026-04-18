
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Creating both the typo version (gmaii) and corrected version (gmail)
    // to ensure the user can login regardless of what they intended.
    const emailCorrect = 'enriquebohorque02@gmail.com';
    const emailTypo = 'enriquebohorque02@gmaii.com';
    const password = 'Rebyeh2620..';
    const hashedPassword = await hash(password, 12);

    // Upsert Corrected
    try {
        await prisma.user.upsert({
            where: { email: emailCorrect },
            update: { passwordHash: hashedPassword, role: 'admin' },
            create: {
                email: emailCorrect,
                name: "Enrique Bohorquez",
                passwordHash: hashedPassword,
                role: "admin"
            }
        });
        console.log(`✅ Admin created: ${emailCorrect}`);
    } catch (e) { console.error(e) }

    // Upsert Typo
    try {
        await prisma.user.upsert({
            where: { email: emailTypo },
            update: { passwordHash: hashedPassword, role: 'admin' },
            create: {
                email: emailTypo,
                name: "Enrique (Alternate)",
                passwordHash: hashedPassword,
                role: "admin"
            }
        });
        console.log(`✅ Admin created: ${emailTypo}`);
    } catch (e) { console.error(e) }
}

main().finally(() => prisma.$disconnect());
