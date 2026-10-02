import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

import { GoalsHierarchyTree } from "@/components/sales/goals-hierarchy-tree";
import { CompPlanPanel } from "@/components/sales/comp-plan-panel";
import { SalesForecastingChart } from "@/components/sales/sales-forecasting-chart";
import { LeaderboardGamification } from "@/components/sales/leaderboard-gamification";
import { SalesGoalFormClient } from "@/components/sales/sales-goal-form-client";
import { CommissionRuleFormClient } from "@/components/sales/commission-rule-form-client";

export default async function SalesDashboardPage() {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    const cu = await prisma.companyUser.findFirst({ where: { userId: session.user.id } });
    if (!cu) return null;

    const companyId = cu.companyId;
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [year, month] = currentPeriod.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const [goals, wonDeals, openDeals, commissionRules, commissions, companyUsers] = await Promise.all([
      (prisma as any).salesGoal.findMany({
        where: { companyId, period: currentPeriod },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: [{ level: "asc" }, { targetAmount: "desc" }],
      }).catch(() => []),

      prisma.deal.findMany({
        where: { companyId, stage: "WON", updatedAt: { gte: startOfMonth, lte: endOfMonth } },
        select: { id: true, value: true, assignedTo: true, probability: true },
      }).catch(() => []),

      prisma.deal.findMany({
        where: { companyId, stage: { notIn: ["WON", "LOST"] } },
        select: { id: true, value: true, probability: true },
      }).catch(() => []),

      prisma.commissionRule.findMany({
        where: { companyId, isActive: true },
        include: { user: { select: { id: true, name: true } } },
      }).catch(() => []),

      prisma.commissionPayment.findMany({
        where: { companyId },
        include: { user: { select: { name: true } }, deal: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }).catch(() => []),

      prisma.companyUser.findMany({
        where: { companyId },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      }).catch(() => []),
    ]);

    // Forecast
    const totalPipeline = openDeals.reduce((acc: number, d: any) => acc + (d.value || 0), 0);
    const weightedPipeline = openDeals.reduce(
      (acc: number, d: any) => acc + (d.value || 0) * ((d.probability || 0) / 100),
      0
    );

    // Leaderboard
    const salesByUser: Record<string, number> = {};
    for (const d of wonDeals) {
      if (d.assignedTo) salesByUser[d.assignedTo] = (salesByUser[d.assignedTo] ?? 0) + (d.value || 0);
    }
    const leaderboard = Object.entries(salesByUser)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .map(([userId, totalSold], idx) => {
        const user = (companyUsers as any[]).find((u: any) => u.userId === userId)?.user ?? null;
        let badge: string | null = null;
        if (idx === 0) badge = "🥇 Top Closer";
        else if ((totalSold as number) > 100000) badge = "💎 Rainmaker";
        else if (idx === 1) badge = "🥈 Runner Up";
        return { user, totalSold, rank: idx + 1, badge };
      });

    const safe = (v: any) => JSON.parse(JSON.stringify(v ?? []));

    // Team users for forms
    const teamUsers = (companyUsers as any[]).map((cu: any) => ({
      id: cu.user.id,
      name: cu.user.name,
      email: cu.user.email,
    }));

    return (
      <div className="p-8 space-y-8 bg-slate-950 min-h-[calc(100vh-4rem)]">

        {/* Header with action buttons */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">
              Sales &amp; Commissions
            </h1>
            <p className="text-slate-400 mt-1">
              Multi-Level Goals · Accelerators · Weighted Forecast · {currentPeriod}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <CommissionRuleFormClient companyId={companyId} teamUsers={teamUsers} />
            <SalesGoalFormClient companyId={companyId} period={currentPeriod} teamUsers={teamUsers} />
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <GoalsHierarchyTree goals={safe(goals)} deals={safe(wonDeals)} />
            <SalesForecastingChart totalPipeline={totalPipeline} weightedPipeline={weightedPipeline} />
          </div>
          <div className="space-y-6">
            <LeaderboardGamification leaderboard={safe(leaderboard)} />
            <CompPlanPanel rules={safe(commissionRules)} commissions={safe(commissions)} />
          </div>
        </div>
      </div>
    );
  } catch (err: any) {
    console.error("[SalesDashboard] Critical render error:", err?.message);
    return (
      <div className="p-8 bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-red-400 text-sm">Error loading Sales Dashboard</p>
          <p className="font-mono text-slate-600 text-xs mt-2">{err?.message}</p>
        </div>
      </div>
    );
  }
}
