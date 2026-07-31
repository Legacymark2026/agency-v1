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

app.post("/api/v1/mailing-lists", async (req: Request, res: Response) => {
  try {
    const { companyId, name, description } = req.body;
    if (!companyId || !name) return res.status(400).json({ error: "companyId and name required" });
    const list = await (prisma as any).mailingList.create({
      data: { companyId: String(companyId), name: String(name), description: description ? String(description) : null }
    });
    res.status(201).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/v1/mailing-lists/:id/subscribers", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    const subscribers = await (prisma as any).audienceSubscriber.findMany({
      where: { listId: String(id), companyId: String(companyId) },
      orderBy: { createdAt: "desc" }
    });
    res.json(subscribers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/v1/mailing-lists/:id/subscribers", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId, subscribers } = req.body;
    if (!companyId || !Array.isArray(subscribers)) {
      return res.status(400).json({ error: "companyId and subscribers array required" });
    }

    const created = [];
    for (const sub of subscribers) {
      if (sub.email && sub.email.includes("@")) {
        const item = await (prisma as any).audienceSubscriber.upsert({
          where: {
            listId_email: {
              listId: String(id),
              email: sub.email.toLowerCase().trim()
            }
          },
          update: { name: sub.name || undefined, customFields: sub.customFields || undefined },
          create: {
            listId: String(id),
            companyId: String(companyId),
            email: sub.email.toLowerCase().trim(),
            name: sub.name || "",
            customFields: sub.customFields || {}
          }
        });
        created.push(item);
      }
    }
    res.status(201).json({ success: true, count: created.length });
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
