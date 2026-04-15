import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
    try {
        await prisma.notification.count();
        console.log("DB OK");
    } catch(e) {
        console.error("DB ERROR", e);
    }
}
run();
