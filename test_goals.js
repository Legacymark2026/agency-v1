const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const company = await prisma.company.findFirst();
    if (!company) {
      console.log("No company");
      return;
    }
    console.log("Company:", company.id);

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const p = period;
    const [year, month] = p.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    console.log("Querying goals...");
    const goals = await prisma.salesGoal.findMany({
        where: { companyId: company.id, period: p },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { targetAmount: "desc" },
    });
    console.log("Goals:", goals.length);

    console.log("Querying won deals...");
    const wonDeals = await prisma.deal.findMany({
        where: {
            companyId: company.id,
            stage: "WON",
            updatedAt: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { id: true, value: true, assignedTo: true },
    });
    console.log("Won deals:", wonDeals.length);

    console.log("Success!");
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
