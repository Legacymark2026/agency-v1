const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getHierarchicalGoals(companyId, currentPeriod) {
    const goals = await prisma.salesGoal.findMany({
        where: { companyId, period: currentPeriod },
        include: { user: { select: { id: true, name: true } } }
    });
    const p = currentPeriod;
    const [year, month] = p.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const wonDeals = await prisma.deal.findMany({
        where: {
            companyId,
            stage: "WON",
            updatedAt: { gte: startOfMonth, lte: endOfMonth }
        },
        select: { id: true, value: true, assignedTo: true, probability: true }
    });
    return { success: true, goals, wonDeals };
}

async function getSalesForecast(companyId, currentPeriod) {
    const p = currentPeriod;
    const [year, month] = p.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const activeDeals = await prisma.deal.findMany({
        where: {
            companyId,
            stage: { notIn: ["WON", "LOST"] },
            updatedAt: { gte: startOfMonth, lte: endOfMonth }
        },
        select: { id: true, value: true, probability: true }
    });

    const totalPipeline = activeDeals.reduce((acc, d) => acc + d.value, 0);
    const weightedPipeline = activeDeals.reduce((acc, d) => acc + (d.value * ((d.probability || 0) / 100)), 0);
    return { success: true, totalPipeline, weightedPipeline };
}

async function getLeaderboard(companyId, currentPeriod) {
    const p = currentPeriod;
    const [year, month] = p.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const wonDeals = await prisma.deal.findMany({
        where: {
            companyId,
            stage: "WON",
            updatedAt: { gte: startOfMonth, lte: endOfMonth }
        },
        select: { id: true, value: true, assignedTo: true }
    });

    const salesByUser = {};
    for (const d of wonDeals) {
        if (d.assignedTo) {
            salesByUser[d.assignedTo] = (salesByUser[d.assignedTo] || 0) + d.value;
        }
    }

    const users = await prisma.companyUser.findMany({
        where: { companyId },
        include: { user: { select: { id: true, name: true, image: true } } },
    });

    const getBadge = (vol) => {
        if (vol > 50000) return "🥇 Top Closer";
        if (vol > 20000) return "🔥 Rainmaker";
        return null;
    };

    const ranked = Object.entries(salesByUser)
        .sort((a, b) => b[1] - a[1])
        .map(([userId, totalSold], index) => {
            const user = users.find(u => u.userId === userId)?.user || {};
            return {
                user,
                totalSold,
                rank: index + 1,
                badge: getBadge(totalSold),
            };
        });

    return { success: true, leaderboard: ranked };
}

async function run() {
  try {
    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No company");

    const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

    console.log("Fetching hierarchical...");
    const goalsRes = await getHierarchicalGoals(company.id, currentPeriod);
    
    console.log("Fetching forecast...");
    const forecastRes = await getSalesForecast(company.id, currentPeriod);
    
    console.log("Fetching leaderboard...");
    const leaderboardRes = await getLeaderboard(company.id, currentPeriod);

    console.log("Fetching rules...");
    const rules = await prisma.commissionRule.findMany({
        where: { companyId: company.id, isActive: true },
        include: { user: { select: { id: true, name: true } } }
    });

    console.log("Fetching commissions...");
    const commissions = await prisma.commissionPayment.findMany({
        where: { companyId: company.id },
        include: { user: { select: { name: true } }, deal: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 20
    });

    // simulate component render serialization
    JSON.parse(JSON.stringify(goalsRes.goals));
    JSON.parse(JSON.stringify(goalsRes.wonDeals));
    JSON.parse(JSON.stringify(rules));
    JSON.parse(JSON.stringify(commissions));
    JSON.parse(JSON.stringify(leaderboardRes.leaderboard));

    console.log("All success!");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
