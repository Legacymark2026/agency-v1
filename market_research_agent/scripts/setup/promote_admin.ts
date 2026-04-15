
import { prisma } from "@/lib/prisma";

async function promoteUser() {
    const email = "enriquebohorquez02@gmail.com";
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: "SUPER_ADMIN" }
        });
        console.log(`Successfully promoted ${user.email} to ${user.role}`);
    } catch (e) {
        console.error("Error updating user:", e);
    }
}

promoteUser()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
