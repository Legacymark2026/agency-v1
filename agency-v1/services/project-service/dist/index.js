"use strict";
/**
 * Project Service — Kanban & Project Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Port: 4018 (internal)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const ioredis_1 = __importDefault(require("ioredis"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || "4018", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "5mb" }));
// ── Health & Readiness ───────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "project-service", version: "1.0.0", timestamp: new Date().toISOString() });
});
app.get("/ready", async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ready", db: "connected" });
    }
    catch (err) {
        res.status(503).json({ status: "not_ready", error: String(err) });
    }
});
// ── Kanban Projects ──────────────────────────────────────────────────────────
app.get("/api/projects", async (req, res) => {
    try {
        const { companyId, status, page = "1", limit = "20" } = req.query;
        if (!companyId)
            return res.status(400).json({ error: "companyId required" });
        const where = { companyId: String(companyId) };
        if (status)
            where.status = String(status);
        const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
        const [projects, total] = await Promise.all([
            database_1.prisma.kanbanProject.findMany({
                where,
                orderBy: { updatedAt: "desc" },
                take: parseInt(String(limit)),
                skip,
                include: { swimlanes: true },
            }),
            database_1.prisma.kanbanProject.count({ where }),
        ]);
        // Get task counts per project
        const projectsWithCounts = await Promise.all(projects.map(async (p) => {
            const taskCount = await database_1.prisma.kanbanTask.count({ where: { projectId: p.id } });
            return { ...p, taskCount };
        }));
        res.json({ projects: projectsWithCounts, total, page: parseInt(String(page)) });
    }
    catch (err) {
        console.error("[project-service] GET /api/projects error:", err);
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/projects", async (req, res) => {
    try {
        const { companyId, name, description, templateId } = req.body;
        const project = await database_1.prisma.kanbanProject.create({
            data: { companyId, name, description, status: "ACTIVE" },
        });
        // Create default swimlanes from template
        const lanes = templateId
            ? BOARD_TEMPLATES[templateId] || BOARD_TEMPLATES.kanban
            : BOARD_TEMPLATES.kanban;
        for (let i = 0; i < lanes.length; i++) {
            await database_1.prisma.kanbanSwimlane.create({
                data: { projectId: project.id, name: lanes[i], order: i },
            });
        }
        await eventBus.publish("project.created", {
            projectId: project.id,
            companyId,
            name,
        });
        res.status(201).json({ project });
    }
    catch (err) {
        console.error("[project-service] POST /api/projects error:", err);
        res.status(500).json({ error: String(err) });
    }
});
app.get("/api/projects/:id", async (req, res) => {
    try {
        const project = await database_1.prisma.kanbanProject.findUnique({
            where: { id: req.params.id },
            include: {
                swimlanes: { orderBy: { order: "asc" } },
                kanbanTasks: {
                    orderBy: { order: "asc" },
                    include: {
                        assignee: { select: { id: true, name: true, image: true } },
                        comments: { select: { id: true } },
                    },
                },
            },
        });
        if (!project)
            return res.status(404).json({ error: "Project not found" });
        res.json({ project });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.patch("/api/projects/:id", async (req, res) => {
    try {
        const project = await database_1.prisma.kanbanProject.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json({ project });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Swimlanes (Columns) ─────────────────────────────────────────────────────
app.post("/api/kanban/swimlanes", async (req, res) => {
    try {
        const { projectId, name, order } = req.body;
        const swimlane = await database_1.prisma.kanbanSwimlane.create({
            data: { projectId, name, order: order || 0 },
        });
        res.status(201).json({ swimlane });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.patch("/api/kanban/swimlanes/:id", async (req, res) => {
    try {
        const swimlane = await database_1.prisma.kanbanSwimlane.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json({ swimlane });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.patch("/api/kanban/swimlanes/reorder", async (req, res) => {
    try {
        const { swimlanes } = req.body; // [{ id, order }]
        for (const lane of swimlanes) {
            await database_1.prisma.kanbanSwimlane.update({
                where: { id: lane.id },
                data: { order: lane.order },
            });
        }
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Kanban Tasks ─────────────────────────────────────────────────────────────
app.get("/api/tasks", async (req, res) => {
    try {
        const { projectId, assigneeId, status, priority, search, archived } = req.query;
        const where = {};
        if (projectId)
            where.projectId = String(projectId);
        if (assigneeId)
            where.assigneeId = String(assigneeId);
        if (status)
            where.status = String(status);
        if (priority)
            where.priority = String(priority);
        if (archived !== undefined)
            where.archived = archived === "true";
        if (search) {
            where.OR = [
                { title: { contains: String(search), mode: "insensitive" } },
                { description: { contains: String(search), mode: "insensitive" } },
            ];
        }
        const tasks = await database_1.prisma.kanbanTask.findMany({
            where,
            orderBy: { order: "asc" },
            include: {
                assignee: { select: { id: true, name: true, image: true } },
                creator: { select: { id: true, name: true } },
            },
        });
        res.json({ tasks, count: tasks.length });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/tasks", async (req, res) => {
    try {
        const { projectId, title, description, assigneeId, creatorId, priority, dueDate, swimlaneId, storyPoints } = req.body;
        // Get next order position
        const maxOrder = await database_1.prisma.kanbanTask.aggregate({
            where: { projectId },
            _max: { order: true },
        });
        const task = await database_1.prisma.kanbanTask.create({
            data: {
                projectId,
                title,
                description,
                assigneeId,
                creatorId,
                priority: priority || "MEDIUM",
                dueDate: dueDate ? new Date(dueDate) : undefined,
                swimlaneId,
                storyPoints,
                order: (maxOrder._max.order || 0) + 1,
                status: "TODO",
            },
        });
        await eventBus.publish("task.created", {
            taskId: task.id,
            projectId,
            title,
            assigneeId,
        });
        res.status(201).json({ task });
    }
    catch (err) {
        console.error("[project-service] POST /api/tasks error:", err);
        res.status(500).json({ error: String(err) });
    }
});
app.patch("/api/tasks/:id", async (req, res) => {
    try {
        const before = await database_1.prisma.kanbanTask.findUnique({ where: { id: req.params.id } });
        const task = await database_1.prisma.kanbanTask.update({
            where: { id: req.params.id },
            data: req.body,
        });
        // Audit: track swimlane (column) moves
        if (req.body.swimlaneId && before?.swimlaneId !== req.body.swimlaneId) {
            await createAuditEntry(task.id, before?.creatorId || "system", "MOVED", before?.swimlaneId || null, req.body.swimlaneId);
            await eventBus.publish("task.moved", {
                taskId: task.id,
                fromSwimlane: before?.swimlaneId,
                toSwimlane: req.body.swimlaneId,
                projectId: task.projectId,
            });
        }
        // Audit: track status changes
        if (req.body.status && before?.status !== req.body.status) {
            await createAuditEntry(task.id, before?.creatorId || "system", "STATUS_CHANGED", before?.status || null, req.body.status);
        }
        // Audit: track assignee changes
        if (req.body.assigneeId && before?.assigneeId !== req.body.assigneeId) {
            await createAuditEntry(task.id, before?.creatorId || "system", "REASSIGNED", before?.assigneeId || null, req.body.assigneeId);
        }
        res.json({ task });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.patch("/api/tasks/:id/archive", async (req, res) => {
    try {
        const task = await database_1.prisma.kanbanTask.update({
            where: { id: req.params.id },
            data: { archived: true, archivedAt: new Date() },
        });
        await createAuditEntry(task.id, task.creatorId, "ARCHIVED", null, null);
        res.json({ task });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Task Comments ────────────────────────────────────────────────────────────
app.get("/api/tasks/:id/comments", async (req, res) => {
    try {
        const comments = await database_1.prisma.kanbanComment.findMany({
            where: { taskId: req.params.id },
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, name: true, image: true } } },
        });
        res.json({ comments });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/api/tasks/:id/comments", async (req, res) => {
    try {
        const comment = await database_1.prisma.kanbanComment.create({
            data: {
                taskId: req.params.id,
                authorId: req.body.authorId,
                content: req.body.content,
            },
        });
        res.status(201).json({ comment });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Board Templates ──────────────────────────────────────────────────────────
const BOARD_TEMPLATES = {
    agile: ["Backlog", "Sprint", "In Progress", "Code Review", "QA", "Done"],
    sales: ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"],
    content: ["Ideas", "Research", "Writing", "Editing", "Design", "Published"],
    support: ["New", "Triaged", "In Progress", "Waiting Customer", "Resolved"],
    kanban: ["To Do", "In Progress", "Done"],
    marketing: ["Briefing", "Creative", "Approval", "Scheduling", "Live", "Reporting"],
};
app.get("/api/kanban/templates", (_req, res) => {
    res.json({
        templates: Object.entries(BOARD_TEMPLATES).map(([id, columns]) => ({
            id,
            name: id.charAt(0).toUpperCase() + id.slice(1),
            columns,
            columnCount: columns.length,
        })),
    });
});
// ── Audit Trail ──────────────────────────────────────────────────────────────
app.get("/api/tasks/:id/audit", async (req, res) => {
    try {
        const audit = await database_1.prisma.kanbanAuditLog.findMany({
            where: { taskId: req.params.id },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: { actor: { select: { id: true, name: true, image: true } } },
        });
        res.json({ audit });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
async function createAuditEntry(taskId, actorId, action, fromValue, toValue) {
    try {
        await database_1.prisma.kanbanAuditLog.create({
            data: { taskId, actorId, action, fromValue, toValue },
        });
    }
    catch (err) {
        console.error("[project-service] Audit entry creation failed:", err);
    }
}
// ── Project Stats ────────────────────────────────────────────────────────────
app.get("/api/projects/:id/stats", async (req, res) => {
    try {
        const projectId = req.params.id;
        const [totalTasks, completedTasks, overdueTasks, byPriority, byAssignee] = await Promise.all([
            database_1.prisma.kanbanTask.count({ where: { projectId, archived: false } }),
            database_1.prisma.kanbanTask.count({ where: { projectId, status: "DONE" } }),
            database_1.prisma.kanbanTask.count({
                where: { projectId, dueDate: { lt: new Date() }, status: { notIn: ["DONE"] }, archived: false },
            }),
            database_1.prisma.kanbanTask.groupBy({
                by: ["priority"],
                where: { projectId, archived: false },
                _count: true,
            }),
            database_1.prisma.kanbanTask.groupBy({
                by: ["assigneeId"],
                where: { projectId, archived: false },
                _count: true,
            }),
        ]);
        res.json({
            totalTasks,
            completedTasks,
            overdueTasks,
            completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) + "%" : "0%",
            byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
            byAssignee: byAssignee.map((a) => ({ assigneeId: a.assigneeId, count: a._count })),
        });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// ── Event Bus ────────────────────────────────────────────────────────────────
const eventBus = new events_1.EventBus(REDIS_URL, "project-service");
const redisClient = new ioredis_1.default(REDIS_URL);
// Sync: when a deal stage changes, update linked tasks
eventBus.subscribe("deal.stage_changed", async (payload) => {
    try {
        const { dealId } = payload.data;
        if (!dealId)
            return;
        const project = await database_1.prisma.kanbanProject.findUnique({ where: { dealId: String(dealId) } });
        if (project) {
            console.log(`[project-service] Deal ${dealId} stage changed, project ${project.id} linked`);
        }
    }
    catch (err) {
        console.error("[project-service] deal.stage_changed handler error:", err);
    }
});
// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
    console.log(`📋 Project Service running on port ${PORT}`);
    console.log(`   Models: KanbanProject, KanbanTask, KanbanSwimlane, KanbanComment, KanbanAuditLog`);
    console.log(`   Templates: ${Object.keys(BOARD_TEMPLATES).join(", ")}`);
});
process.on("SIGTERM", async () => {
    await eventBus.disconnect();
    await redisClient.quit();
    await database_1.prisma.$disconnect();
    process.exit(0);
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.default = app;
//# sourceMappingURL=index.js.map