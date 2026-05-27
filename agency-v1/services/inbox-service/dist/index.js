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
// Import local inbox libraries
const sla_1 = require("./lib/inbox/sla");
const audit_1 = require("./lib/inbox/audit");
const threading_1 = require("./lib/inbox/threading");
const templates_1 = require("./lib/inbox/templates");
const merge_1 = require("./lib/inbox/merge");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4005", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
// ── Health & Readiness ───────────────────────────────────────────────────────
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
// ── Conversations ────────────────────────────────────────────────────────────
app.get("/api/inbox/conversations", async (req, res) => {
    try {
        const { companyId, status, channel, assignedTo, search, platformId, leadId, page = "1", limit = "20" } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const where = { companyId: String(companyId) };
        if (status)
            where.status = String(status);
        if (channel)
            where.channel = String(channel);
        if (assignedTo)
            where.assignedTo = String(assignedTo);
        if (platformId)
            where.platformId = String(platformId);
        if (leadId)
            where.leadId = String(leadId);
        if (search) {
            where.OR = [
                { lead: { name: { contains: String(search), mode: "insensitive" } } },
                { lead: { email: { contains: String(search), mode: "insensitive" } } },
                { messages: { some: { content: { contains: String(search), mode: "insensitive" } } } }
            ];
        }
        const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
        const [conversations, total] = await Promise.all([
            database_1.prisma.conversation.findMany({
                where,
                orderBy: { lastMessageAt: "desc" },
                take: parseInt(String(limit)),
                skip,
                include: {
                    lead: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        }
                    },
                    assignee: {
                        select: {
                            id: true,
                            name: true,
                            image: true
                        }
                    },
                    slaConfig: {
                        select: {
                            status: true,
                            firstResponseMinutes: true,
                            resolutionMinutes: true,
                            firstResponseAt: true,
                            resolvedAt: true,
                            breachedAt: true,
                            createdAt: true,
                            pausedMinutes: true,
                        }
                    },
                    _count: {
                        select: { messages: true }
                    }
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
app.get("/api/inbox/conversations/duplicates", async (req, res) => {
    try {
        const { leadId, channel, companyId } = req.query;
        if (!leadId || !channel || !companyId) {
            return res.status(400).json({ error: "leadId, channel, and companyId are required" });
        }
        const duplicates = await (0, merge_1.findDuplicateConversations)(String(leadId), String(channel), String(companyId));
        res.json({ success: true, data: duplicates });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/inbox/conversations/:id", async (req, res) => {
    try {
        const conversation = await database_1.prisma.conversation.findUnique({
            where: { id: req.params.id },
            include: {
                lead: true,
                assignee: true,
                slaConfig: true
            }
        });
        if (!conversation)
            return res.status(404).json({ error: "Conversation not found" });
        res.json({ success: true, conversation });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/inbox/conversations", async (req, res) => {
    try {
        let { companyId, leadId, channel } = req.body;
        if (!leadId || !channel) {
            return res.status(400).json({ error: "leadId and channel required" });
        }
        if (!companyId) {
            const company = await database_1.prisma.company.findFirst();
            if (!company)
                return res.status(400).json({ error: "No company found" });
            companyId = company.id;
        }
        const existing = await database_1.prisma.conversation.findFirst({
            where: { companyId, leadId, channel },
            orderBy: { lastMessageAt: "desc" },
        });
        if (existing) {
            if (existing.status === "OPEN") {
                return res.json({ success: true, data: existing, isNew: false });
            }
            const reopened = await database_1.prisma.conversation.update({
                where: { id: existing.id },
                data: {
                    status: "OPEN",
                    lastMessageAt: new Date(),
                    lastMessagePreview: "Conversation reopened",
                },
            });
            return res.json({ success: true, data: reopened, isNew: false });
        }
        const conversation = await database_1.prisma.conversation.create({
            data: {
                companyId,
                leadId,
                channel,
                status: "OPEN",
                lastMessageAt: new Date(),
                lastMessagePreview: "New conversation started"
            }
        });
        res.status(201).json({ success: true, data: conversation, isNew: true });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.patch("/api/inbox/conversations/:id", async (req, res) => {
    try {
        const { status, unreadCount, tags, assignedTo, metadata } = req.body;
        const { userId } = req.query; // Actor user ID
        const before = await database_1.prisma.conversation.findUnique({ where: { id: req.params.id } });
        if (!before)
            return res.status(404).json({ error: "Conversation not found" });
        const conversation = await database_1.prisma.conversation.update({
            where: { id: req.params.id },
            data: {
                ...(status !== undefined && { status }),
                ...(unreadCount !== undefined && { unreadCount }),
                ...(tags !== undefined && { tags }),
                ...(assignedTo !== undefined && { assignedTo }),
                ...(metadata !== undefined && { metadata }),
            }
        });
        // Logging Audits if changed
        const actorId = userId ? String(userId) : "system";
        if (status && before.status !== status) {
            await (0, audit_1.auditStatusChanged)(conversation.id, conversation.companyId, actorId, before.status, status);
        }
        if (assignedTo !== undefined && before.assignedTo !== assignedTo) {
            await (0, audit_1.auditAssignmentChanged)(conversation.id, conversation.companyId, actorId, before.assignedTo, assignedTo);
        }
        res.json({ success: true, data: conversation });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/inbox/conversations/:id/merge", async (req, res) => {
    try {
        const { secondaryId, companyId, userId } = req.body;
        if (!secondaryId || !companyId || !userId) {
            return res.status(400).json({ error: "secondaryId, companyId, and userId required" });
        }
        const success = await (0, merge_1.mergeConversations)(req.params.id, secondaryId, companyId, userId);
        res.json({ success });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Messages ─────────────────────────────────────────────────────────────────
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
        const { content, type = "TEXT", direction = "OUTBOUND", senderId, status = "SENT", mediaUrl, mediaType, attachments = [], inReplyToHeader, subject } = req.body;
        const conversation = await database_1.prisma.conversation.findUnique({
            where: { id: req.params.id }
        });
        if (!conversation)
            return res.status(404).json({ error: "Conversation not found" });
        // 1. Create the message in DB
        const message = await database_1.prisma.message.create({
            data: {
                conversationId: req.params.id,
                content: content || null,
                type: type,
                direction: direction,
                senderId: senderId,
                status: status,
                mediaUrl: mediaUrl || (attachments.length > 0 ? attachments[0].url : null),
                mediaType: mediaType || (attachments.length > 0 ? attachments[0].type : null),
            }
        });
        // Create attachments if any
        if (attachments && attachments.length > 0) {
            const attachData = attachments.map((a) => ({
                messageId: message.id,
                fileName: a.fileName || a.name || "Archivo",
                mediaUrl: a.mediaUrl || a.url,
                mediaType: a.mediaType || a.type || "image/jpeg",
                fileSize: a.fileSize || 0,
            }));
            await database_1.prisma.messageAttachment.createMany({ data: attachData });
        }
        // 2. Thread linking using subject or headers
        if (subject || inReplyToHeader) {
            try {
                await (0, threading_1.linkMessageToThread)(req.params.id, message.id, subject || "", inReplyToHeader);
            }
            catch (err) {
                console.error("[inbox-service] Thread linking failed:", err);
            }
        }
        // 3. Update Conversation (last message, preview, unreadCount)
        const preview = content
            ? content.substring(0, 100)
            : attachments.length > 0 ? "🎤 Nota de voz" : "...";
        await database_1.prisma.conversation.update({
            where: { id: req.params.id },
            data: {
                lastMessageAt: new Date(),
                lastMessagePreview: preview,
                status: "OPEN", // Re-open if closed
                unreadCount: { increment: direction === "INBOUND" ? 1 : 0 },
            }
        });
        // 4. SLA updates if outbound reply
        if (direction === "OUTBOUND") {
            try {
                await (0, sla_1.markFirstResponse)(req.params.id);
            }
            catch (err) {
                console.error("[inbox-service] markFirstResponse failed:", err);
            }
        }
        // 5. Audit message sent
        if (senderId) {
            try {
                await (0, audit_1.auditMessageSent)(req.params.id, message.id, conversation.companyId, senderId, {
                    attachmentsCount: attachments.length,
                });
            }
            catch (err) {
                console.error("[inbox-service] auditMessageSent failed:", err);
            }
        }
        // 6. Publish Event
        await eventBus.publish("message.sent", { messageId: message.id, conversationId: req.params.id, direction });
        res.status(201).json({ success: true, message });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.patch("/api/inbox/messages/:id", async (req, res) => {
    try {
        const { status, externalId } = req.body;
        const message = await database_1.prisma.message.update({
            where: { id: req.params.id },
            data: {
                ...(status !== undefined && { status }),
                ...(externalId !== undefined && { externalId }),
            }
        });
        res.json({ success: true, message });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/inbox/messages/:id/thread", async (req, res) => {
    try {
        const thread = await (0, threading_1.getMessageThread)(req.params.id);
        res.json({ success: true, data: thread });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── SLA & Audit Trails ───────────────────────────────────────────────────────
app.post("/api/inbox/conversations/:id/sla", async (req, res) => {
    try {
        const { companyId } = req.body;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const sla = await (0, sla_1.initializeSLA)(req.params.id, companyId);
        res.json({ success: true, data: sla });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/inbox/conversations/:id/sla", async (req, res) => {
    try {
        const warning = await (0, sla_1.getSLAWarning)(req.params.id);
        const sla = await database_1.prisma.conversationSLA.findUnique({ where: { conversationId: req.params.id } });
        res.json({ success: true, data: { sla, warning } });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/inbox/sla/breached", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const breached = await (0, sla_1.getBreachedSLAs)(String(companyId));
        res.json({ success: true, data: breached });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/inbox/conversations/:id/audit", async (req, res) => {
    try {
        const { limit = "100" } = req.query;
        const auditTrail = await (0, audit_1.getAuditTrail)(req.params.id, parseInt(String(limit)));
        res.json({ success: true, data: auditTrail });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/inbox/audit", async (req, res) => {
    try {
        const { action, payload } = req.body;
        await (0, audit_1.logAuditEvent)(action, payload);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/inbox/audit/report", async (req, res) => {
    try {
        const { companyId, startDate, endDate } = req.query;
        if (!companyId || !startDate || !endDate) {
            return res.status(400).json({ error: "companyId, startDate, and endDate required" });
        }
        const report = await (0, audit_1.generateAuditReport)(String(companyId), new Date(String(startDate)), new Date(String(endDate)));
        res.json({ success: true, data: report });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Macros ───────────────────────────────────────────────────────────────────
app.get("/api/inbox/macros", async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const macros = await database_1.prisma.inboxMacro.findMany({
            where: { companyId: String(companyId) },
            orderBy: { createdAt: "desc" }
        });
        res.json({ success: true, data: macros });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/inbox/macros", async (req, res) => {
    try {
        const { companyId, title, description, icon, color, actionType, payload, isActive } = req.body;
        const macro = await database_1.prisma.inboxMacro.create({
            data: {
                companyId,
                title,
                description,
                icon: icon || "Wand2",
                color: color || "#10b981",
                actionType,
                payload: payload || {},
                isActive: isActive ?? true
            }
        });
        res.status(201).json({ success: true, data: macro });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.patch("/api/inbox/macros/:id", async (req, res) => {
    try {
        const macro = await database_1.prisma.inboxMacro.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json({ success: true, data: macro });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.delete("/api/inbox/macros/:id", async (req, res) => {
    try {
        await database_1.prisma.inboxMacro.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/inbox/macros/:id/toggle", async (req, res) => {
    try {
        const { isActive } = req.body;
        const macro = await database_1.prisma.inboxMacro.update({
            where: { id: req.params.id },
            data: { isActive }
        });
        res.json({ success: true, data: macro });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Drafts ───────────────────────────────────────────────────────────────────
app.post("/api/inbox/conversations/:id/drafts", async (req, res) => {
    try {
        const { content, status = "DRAFT", createdBy } = req.body;
        const draft = await database_1.prisma.messageDraft.create({
            data: {
                conversationId: req.params.id,
                content,
                version: 1,
                status: status,
                createdBy: createdBy,
            }
        });
        res.status(201).json({ success: true, data: draft });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.patch("/api/inbox/drafts/:id", async (req, res) => {
    try {
        const draft = await database_1.prisma.messageDraft.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json({ success: true, data: draft });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/inbox/conversations/:id/drafts", async (req, res) => {
    try {
        const drafts = await database_1.prisma.messageDraft.findMany({
            where: { conversationId: req.params.id },
            orderBy: { createdAt: "desc" }
        });
        res.json({ success: true, data: drafts });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Contacts ─────────────────────────────────────────────────────────────────
app.post("/api/inbox/log-contact", async (req, res) => {
    try {
        const { leadId, channel } = req.body;
        if (!leadId || !channel)
            return res.status(400).json({ error: "leadId and channel required" });
        const lead = await database_1.prisma.lead.findUnique({
            where: { id: leadId },
            select: { companyId: true, email: true, phone: true }
        });
        if (!lead)
            return res.status(404).json({ error: "Lead not found" });
        let conversation = await database_1.prisma.conversation.findFirst({
            where: {
                companyId: lead.companyId,
                leadId: leadId,
                channel: channel
            }
        });
        if (!conversation) {
            let platformId = undefined;
            if (channel === "WHATSAPP" || channel === "SMS")
                platformId = lead.phone || undefined;
            if (channel === "EMAIL")
                platformId = lead.email || undefined;
            conversation = await database_1.prisma.conversation.create({
                data: {
                    companyId: lead.companyId,
                    leadId: leadId,
                    channel: channel,
                    status: "OPEN",
                    platformId: platformId,
                    lastMessageAt: new Date(),
                    lastMessagePreview: `Contact initiated via ${channel}`
                }
            });
        }
        else if (conversation.status === "ARCHIVED" || conversation.status === "CLOSED") {
            conversation = await database_1.prisma.conversation.update({
                where: { id: conversation.id },
                data: { status: "OPEN", lastMessageAt: new Date(), lastMessagePreview: `Contact initiated via ${channel} (Reopened)` }
            });
        }
        res.json({ success: true, conversationId: conversation.id });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/inbox/conversations/:id/threads", async (req, res) => {
    try {
        const threads = await (0, threading_1.getConversationThreads)(req.params.id);
        res.json({ success: true, data: threads });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/inbox/conversations/:id/render-template", async (req, res) => {
    try {
        const { template, companyId, userId } = req.body;
        if (!template || !companyId || !userId) {
            return res.status(400).json({ error: "template, companyId, and userId required" });
        }
        const conversation = await database_1.prisma.conversation.findUnique({
            where: { id: req.params.id },
            include: { lead: true, assignee: true },
        });
        if (!conversation)
            return res.status(404).json({ error: "Conversation not found" });
        const company = await database_1.prisma.company.findUnique({ where: { id: companyId } });
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        const context = (0, templates_1.buildMacroTemplateContext)({
            lead: conversation.lead,
            user,
            company,
            conversation,
        });
        const renderedContent = (0, templates_1.renderTemplate)(template, context);
        res.json({
            success: true,
            renderedContent,
            context,
        });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/inbox/conversations/:id/tags", async (req, res) => {
    try {
        const { tagName, userId } = req.body;
        if (!tagName || !userId)
            return res.status(400).json({ error: "tagName and userId required" });
        const conversation = await database_1.prisma.conversation.findUnique({ where: { id: req.params.id } });
        if (!conversation)
            return res.status(404).json({ error: "Conversation not found" });
        const currentTags = Array.isArray(conversation.tags) ? conversation.tags : [];
        if (currentTags.includes(tagName)) {
            return res.json({ success: true, alreadyExists: true, tags: currentTags });
        }
        const newTags = [...currentTags, tagName];
        await database_1.prisma.$transaction([
            database_1.prisma.conversation.update({
                where: { id: req.params.id },
                data: { tags: newTags },
            }),
            database_1.prisma.inboxTagAssignment.create({
                data: {
                    conversationId: req.params.id,
                    tagName,
                    assignedBy: userId,
                },
            }),
        ]);
        await (0, audit_1.logAuditEvent)("tag_added", {
            conversationId: req.params.id,
            companyId: conversation.companyId,
            userId,
            resourceType: "conversation",
            resourceId: req.params.id,
            newValue: { tag: tagName },
        });
        res.json({ success: true, tags: newTags });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.delete("/api/inbox/conversations/:id/tags/:tag", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId)
            return res.status(400).json({ error: "userId query parameter required" });
        const conversation = await database_1.prisma.conversation.findUnique({ where: { id: req.params.id } });
        if (!conversation)
            return res.status(404).json({ error: "Conversation not found" });
        const currentTags = Array.isArray(conversation.tags) ? conversation.tags : [];
        const newTags = currentTags.filter((t) => t !== req.params.tag);
        await database_1.prisma.$transaction([
            database_1.prisma.conversation.update({
                where: { id: req.params.id },
                data: { tags: newTags },
            }),
            database_1.prisma.inboxTagAssignment.updateMany({
                where: { conversationId: req.params.id, tagName: req.params.tag, removedAt: null },
                data: { removedAt: new Date() },
            }),
        ]);
        await (0, audit_1.logAuditEvent)("tag_removed", {
            conversationId: req.params.id,
            companyId: conversation.companyId,
            userId: String(userId),
            resourceType: "conversation",
            resourceId: req.params.id,
            oldValue: { tag: req.params.tag },
        });
        res.json({ success: true, tags: newTags });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/inbox/conversations/:id/tags/history", async (req, res) => {
    try {
        const history = await database_1.prisma.inboxTagAssignment.findMany({
            where: { conversationId: req.params.id },
            orderBy: { createdAt: "desc" },
            include: { assigner: { select: { id: true, name: true } } }
        });
        res.json({ success: true, data: history });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Webhook: Whatsapp ────────────────────────────────────────────────────────
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
app.listen(PORT, "0.0.0.0", () => {
    console.log(`💬 Inbox Service running on port ${PORT}`);
});
process.on("SIGTERM", async () => {
    await eventBus.disconnect();
    await database_1.prisma.$disconnect();
    process.exit(0);
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.default = app;
//# sourceMappingURL=index.js.map