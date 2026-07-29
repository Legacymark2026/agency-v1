import express, { Request, Response } from "express";
try {
  require("@agency/observability/register");
} catch { /* optional */ }
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { setupGracefulShutdown } from "@agency/service-auth";
import { marketingRouter } from "./routes/marketing.routes";
import { errorHandler } from "./middlewares/marketing.middleware";

const app = express();
const PORT = parseInt(process.env.PORT || "4009", 10);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ─── Health & Readiness ───────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "marketing-service",
    version: "2.0.0",
    timestamp: new Date().toISOString()
  });
});

app.get("/ready", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err) });
  }
});

// ─── Router Mounting ──────────────────────────────────────────────────────────
// Mount under /api/v1 (versioned) and /api (backwards compatibility for proxy)
app.use("/api/v1", marketingRouter);
app.use("/api", marketingRouter);

// ─── Email Templates & Mailing Lists (Auxiliary Legacy Routes) ───────────────
app.get("/api/v1/email-templates", async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    const templates = await (prisma as any).emailTemplate.findMany({
      where: { companyId: String(companyId) },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, subject: true, category: true, createdAt: true }
    });
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/v1/mailing-lists", async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    const lists = await (prisma as any).mailingList.findMany({
      where: { companyId: String(companyId) },
      include: { _count: { select: { subscribers: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json(lists);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.use(errorHandler);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Marketing Service (Mass Email Platform v2.0) listening at http://localhost:${PORT}`);
});

setupGracefulShutdown(server);

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
