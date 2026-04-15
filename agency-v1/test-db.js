const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const invoice = await prisma.invoice.findFirst({
        include: {
            company: true,
            items: true
        }
    });
    console.log(invoice);
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
