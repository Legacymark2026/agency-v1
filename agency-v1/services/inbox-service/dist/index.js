"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Inbox Service — OmniChannel Communication Microservice
 * Port: 4005 | Sticky Sessions Required (WebSocket)
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4005", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "inbox-service" });
});
app.get("/ready", async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ready" });
    }
    catch (err) {
        res.status(503).json({ status: "not_ready", error: String(err) });
    }
});
app.get("/api/inbox/conversations", async (req, res) => {
    try {
        const { companyId, status, channel, page = "1", limit = "20" } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const where = { companyId: String(companyId) };
        if (status)
            where.status = String(status);
        if (channel)
            where.channel = String(channel);
        const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
        const [conversations, total] = await Promise.all([
            database_1.prisma.conversation.findMany({
                where,
                orderBy: { lastMessageAt: "desc" },
                take: parseInt(String(limit)),
                skip,
                include: {
                    lead: { select: { id: true, name: true, email: true } },
                    assignee: { select: { id: true, name: true, image: true } }
                }
            }),
            database_1.prisma.conversation.count({ where }),
        ]);
        res.json({ conversations, total });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/inbox/conversations/:id/messages", async (req, res) => {
    try {
        const messages = await database_1.prisma.message.findMany({
            where: { conversationId: req.params.id },
            orderBy: { createdAt: "asc" },
            include: { attachments: true }
        });
        res.json({ messages });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/inbox/conversations/:id/messages", async (req, res) => {
    try {
        const { content, type = "TEXT", direction, senderId } = req.body;
        const message = await database_1.prisma.message.create({
            data: {
                conversationId: req.params.id,
                content: content,
                type: type,
                direction: direction,
                senderId: senderId,
                status: "SENT"
            }
        });
        await database_1.prisma.conversation.update({
            where: { id: req.params.id },
            data: {
                lastMessageAt: new Date(),
                lastMessagePreview: content?.slice(0, 100)
            }
        });
        await eventBus.publish("message.sent", { messageId: message.id, conversationId: req.params.id, direction });
        res.status(201).json({ message });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/webhooks/whatsapp", async (req, res) => {
    console.log("[inbox-service] WhatsApp webhook received");
    res.status(200).json({ status: "ok" });
});
app.get("/api/webhooks/whatsapp", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        res.status(200).send(challenge);
    }
    else {
        res.status(403).send("Forbidden");
    }
});
const eventBus = new events_1.EventBus(REDIS_URL, "inbox-service");
eventBus.subscribe("agent.response_ready", async (payload) => {
    console.log(`[inbox-service] AI response ready: ${payload.data.conversationId}`);
});
app.listen(PORT, "0.0.0.0", () => { console.log(`💬 Inbox Service running on port ${PORT}`); });
process.on("SIGTERM", async () => { await eventBus.disconnect(); await database_1.prisma.$disconnect(); process.exit(0); });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.default = app;
//# sourceMappingURL=index.js.map