
import { prisma } from "@/lib/prisma";

async function checkRoles() {
    const users = await prisma.user.findMany({
        select: {
            email: true,
            role: true,
            id: true
        }
    });
    console.log("Current Users and Roles:");
    users.forEach(u => console.log(`${u.email}: ${u.role}`));
}

checkRoles()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
