/**
 * Inbox Service — OmniChannel Communication Microservice
 * Port: 4005 | Sticky Sessions Required (WebSocket)
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";

const app = express();
const PORT = parseInt(process.env.PORT || "4005", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "inbox-service" });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err) });
  }
});

app.get("/api/inbox/conversations", async (req, res) => {
  try {
    const { companyId, status, channel, page = "1", limit = "20" } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });
    const where: Record<string, unknown> = { companyId: String(companyId) };
    if (status) where.status = String(status);
    if (channel) where.channel = String(channel);
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({ where, orderBy: { lastMessageAt: "desc" }, take: parseInt(String(limit)), skip,
        include: { lead: { select: { id: true, name: true, email: true } }, assignee: { select: { id: true, name: true, image: true } } } }),
      prisma.conversation.count({ where }),
    ]);
    res.json({ conversations, total });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.get("/api/inbox/conversations/:id/messages", async (req, res) => {
  try {
    const messages = await prisma.message.findMany({ where: { conversationId: req.params.id }, orderBy: { createdAt: "asc" }, include: { attachments: true } });
    res.json({ messages });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/inbox/conversations/:id/messages", async (req, res) => {
  try {
    const { content, type = "TEXT", direction, senderId } = req.body;
    const message = await prisma.message.create({ data: { conversationId: req.params.id, content, type, direction, senderId, status: "SENT" } });
    await prisma.conversation.update({ where: { id: req.params.id }, data: { lastMessageAt: new Date(), lastMessagePreview: content?.slice(0, 100) } });
    await eventBus.publish("message.sent", { messageId: message.id, conversationId: req.params.id, direction });
    res.status(201).json({ message });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/webhooks/whatsapp", async (req, res) => {
  console.log("[inbox-service] WhatsApp webhook received");
  res.status(200).json({ status: "ok" });
});

app.get("/api/webhooks/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) { res.status(200).send(challenge); }
  else { res.status(403).send("Forbidden"); }
});

const eventBus = new EventBus(REDIS_URL, "inbox-service");
eventBus.subscribe("agent.response_ready", async (payload) => {
  console.log(`[inbox-service] AI response ready: ${payload.data.conversationId}`);
});

app.listen(PORT, "0.0.0.0", () => { console.log(`💬 Inbox Service running on port ${PORT}`); });
process.on("SIGTERM", async () => { await eventBus.disconnect(); await prisma.$disconnect(); process.exit(0); });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;
