import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { trackClick } from "./controllers/click.controller";
import { processPayout } from "./controllers/payout.controller";
import { startEventConsumers } from "./events/consumer";
import { startReferralReleaseScheduler, releaseReferrals } from "./cron/release-referrals";

const app = express();
const PORT = parseInt(process.env.PORT || "4019", 10);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Health & Readiness Check ──────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "affiliate-service",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

app.get("/ready", async (_req: Request, res: Response) => {
  try {
    // Probar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err) });
  }
});

// ── Redirección & Analíticas de Enlaces ─────────────────────────────────────────
app.get("/r/:code", trackClick);

// ── Liquidación de Comisiones (Payouts) ─────────────────────────────────────────
app.post("/api/affiliates/payouts", processPayout);

// ── Ejecución Manual de Tareas Programadas (Testing) ───────────────────────────
app.post("/api/affiliates/cron/release", async (req: Request, res: Response) => {
  try {
    const warrantyDays = req.body.warrantyDays ? parseInt(req.body.warrantyDays, 10) : 15;
    const result = await releaseReferrals(warrantyDays);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Profile ──────────────────────────────────────────────────────────────────────
app.get("/api/affiliates/profile", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) { res.status(400).json({ success: false, error: "userId required" }); return; }
    const profile = await (prisma as any).affiliateProfile.findUnique({
      where: { userId },
      include: { commissionPlan: true },
    });
    res.json({ success: true, data: profile });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/affiliates/profile", async (req: Request, res: Response) => {
  try {
    const { userId, code, commissionPlanId } = req.body;
    if (!userId || !code || !commissionPlanId) { res.status(400).json({ success: false, error: "userId, code, commissionPlanId required" }); return; }
    const profile = await (prisma as any).affiliateProfile.create({
      data: { userId, code: code.toUpperCase(), commissionPlanId },
      include: { commissionPlan: true },
    });
    res.json({ success: true, data: profile });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Stats ─────────────────────────────────────────────────────────────────────────
app.get("/api/affiliates/stats", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) { res.status(400).json({ success: false, error: "userId required" }); return; }

    const profile = await (prisma as any).affiliateProfile.findUnique({
      where: { userId },
      include: { commissionPlan: true },
    });

    if (!profile) { res.json({ success: true, data: null }); return; }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalClicks, convertedClicks, last30DaysClicks,
      totalReferrals, pendingReferrals, approvedReferrals, rejectedReferrals,
      last30DaysReferrals,
      earnedAgg, pendingAgg, paidAgg,
    ] = await Promise.all([
      (prisma as any).click.count({ where: { affiliateCode: profile.code } }),
      (prisma as any).click.count({ where: { affiliateCode: profile.code } }), // all clicks (no converted field in schema)
      (prisma as any).click.count({ where: { affiliateCode: profile.code, createdAt: { gte: thirtyDaysAgo } } }),
      (prisma as any).referral.count({ where: { affiliateId: profile.id } }),
      (prisma as any).referral.count({ where: { affiliateId: profile.id, status: 'PENDING' } }),
      (prisma as any).referral.count({ where: { affiliateId: profile.id, status: 'APPROVED' } }),
      (prisma as any).referral.count({ where: { affiliateId: profile.id, status: 'REJECTED' } }),
      (prisma as any).referral.count({ where: { affiliateId: profile.id, createdAt: { gte: thirtyDaysAgo } } }),
      (prisma as any).referral.aggregate({ where: { affiliateId: profile.id, status: 'APPROVED' }, _sum: { commissionAmount: true } }),
      (prisma as any).referral.aggregate({ where: { affiliateId: profile.id, status: 'PENDING' }, _sum: { commissionAmount: true } }),
      (prisma as any).payout.aggregate({ where: { affiliateId: profile.id, status: 'PAID' }, _sum: { amount: true } }),
    ]);

    const toNum = (v: any) => v?.toString?.() ?? "0.00";
    const totalEarned = toNum(earnedAgg._sum.commissionAmount);
    const pendingEarned = toNum(pendingAgg._sum.commissionAmount);
    const totalPaidOut = toNum(paidAgg._sum.amount);
    const balance = (parseFloat(totalEarned) - parseFloat(totalPaidOut)).toFixed(2);

    res.json({
      success: true,
      data: {
        profile: { ...profile, commissionPlan: { ...profile.commissionPlan, value: Number(profile.commissionPlan.value) } },
        totalClicks, convertedClicks,
        conversionRate: totalReferrals > 0 ? Math.round((approvedReferrals / totalReferrals) * 100) : 0,
        totalReferrals, pendingReferrals, approvedReferrals, rejectedReferrals,
        totalEarned, pendingEarned, totalPaidOut,
        pendingPayoutBalance: balance,
        last30DaysClicks, last30DaysReferrals,
      }
    });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Referrals ─────────────────────────────────────────────────────────────────────
app.get("/api/affiliates/referrals", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) { res.status(400).json({ success: false, error: "userId required" }); return; }
    const profile = await (prisma as any).affiliateProfile.findUnique({ where: { userId } });
    if (!profile) { res.json({ success: true, data: [] }); return; }
    const rows = await (prisma as any).referral.findMany({
      where: { affiliateId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const data = rows.map((r: any) => ({
      ...r,
      commissionAmount: r.commissionAmount?.toString?.() ?? "0.00",
      orderAmount: r.orderAmount?.toString?.() ?? "0.00",
    }));
    res.json({ success: true, data });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Clicks ────────────────────────────────────────────────────────────────────────
app.get("/api/affiliates/clicks", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) { res.status(400).json({ success: false, error: "userId required" }); return; }
    const profile = await (prisma as any).affiliateProfile.findUnique({ where: { userId } });
    if (!profile) { res.json({ success: true, data: [] }); return; }
    const rows = await (prisma as any).click.findMany({
      where: { affiliateCode: profile.code },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ success: true, data: rows });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Payouts list ──────────────────────────────────────────────────────────────────
app.get("/api/affiliates/payouts", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) { res.status(400).json({ success: false, error: "userId required" }); return; }
    const profile = await (prisma as any).affiliateProfile.findUnique({ where: { userId } });
    if (!profile) { res.json({ success: true, data: [] }); return; }
    const rows = await (prisma as any).payout.findMany({
      where: { affiliateId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
    const data = rows.map((p: any) => ({ ...p, amount: p.amount?.toString?.() ?? "0.00" }));
    res.json({ success: true, data });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Commission Plans ──────────────────────────────────────────────────────────────
app.get("/api/affiliates/plans", async (_req: Request, res: Response) => {
  try {
    const rows = await (prisma as any).commissionPlan.findMany({ orderBy: { createdAt: 'desc' } });
    const data = rows.map((p: any) => ({ ...p, value: Number(p.value) }));
    res.json({ success: true, data });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.post("/api/affiliates/plans", async (req: Request, res: Response) => {
  try {
    const { name, type, value, cookieLifetimeInt } = req.body;
    if (!name || !type || value == null) { res.status(400).json({ success: false, error: "name, type, value required" }); return; }
    const plan = await (prisma as any).commissionPlan.create({
      data: { name, type, value, cookieLifetimeInt: cookieLifetimeInt ?? 30 }
    });
    res.json({ success: true, data: { ...plan, value: Number(plan.value) } });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete("/api/affiliates/plans/:id", async (req: Request, res: Response) => {
  try {
    await (prisma as any).commissionPlan.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── All Affiliates (Admin) ────────────────────────────────────────────────────────
app.get("/api/affiliates", async (_req: Request, res: Response) => {
  try {
    const rows = await (prisma as any).affiliateProfile.findMany({
      include: { commissionPlan: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: rows });
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Inicializar Consumidores & Cron Jobs ──────────────────────────────────────
startEventConsumers();
startReferralReleaseScheduler();

// ── Arrancar Servidor ────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Affiliate Service listening at http://localhost:${PORT}`);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down...");
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Database disconnected. Server closed.");
    process.exit(0);
  });
});
