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
exports.authGrpcClient = void 0;
try {
    require("@agency/observability/register");
}
catch { /* optional */ }
const observability_1 = require("@agency/observability");
const service_auth_1 = require("@agency/service-auth");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const events_1 = require("@agency/events");
const ioredis_1 = __importDefault(require("ioredis"));
const app = (0, express_1.default)();
app.use((0, observability_1.metricsMiddleware)("project-service"));
app.get("/metrics", observability_1.metricsEndpoint);
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
const project_routes_1 = require("./routes/project.routes");
const project_middleware_1 = require("./middlewares/project.middleware");
app.use("/api/v1", project_routes_1.projectRouter);
app.use(project_middleware_1.errorHandler);
// ── Kanban Projects ──────────────────────────────────────────────────────────
app.get("/api/projects", async (req, res) => {
    try {
        const { companyId, status, page = "1", limit = "20" } = req.query;
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
redisClient.on("error", (err) => console.error("[project-service] Redis client error:", err.message));
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
// ─── Portfolio Projects ───────────────────────────────────────────────────────
app.get('/api/portfolio/projects', async (req, res) => {
    try {
        const { companyId, status, categoryId, search, featured, page = '1', limit = '50' } = req.query;
        const where = {};
        if (companyId)
            where.companyId = String(companyId);
        if (status)
            where.status = String(status);
        if (categoryId)
            where.categoryId = String(categoryId);
        if (featured !== undefined)
            where.featured = featured === 'true';
        if (search) {
            where.OR = [
                { title: { contains: String(search), mode: 'insensitive' } },
                { client: { contains: String(search), mode: 'insensitive' } },
                { description: { contains: String(search), mode: 'insensitive' } }
            ];
        }
        const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
        const projects = await database_1.prisma.project.findMany({
            where,
            orderBy: [{ featured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
            take: parseInt(String(limit)),
            skip,
            include: { category: true, _count: { select: { views: true } } }
        });
        res.json({ projects });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/portfolio/projects/public', async (req, res) => {
    try {
        const { categorySlug, limit } = req.query;
        const where = { status: 'published', published: true };
        if (categorySlug)
            where.category = { slug: String(categorySlug) };
        const projects = await database_1.prisma.project.findMany({
            where,
            take: limit ? parseInt(String(limit)) : undefined,
            orderBy: [{ featured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
            include: { category: true, _count: { select: { views: true } } }
        });
        res.json({ projects });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/portfolio/projects/:id', async (req, res) => {
    try {
        const project = await database_1.prisma.project.findUnique({
            where: { id: req.params.id },
            include: { category: true }
        });
        if (!project)
            return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/portfolio/projects', async (req, res) => {
    try {
        const project = await database_1.prisma.project.create({ data: req.body });
        res.status(201).json({ success: true, project });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/portfolio/projects/bulk-status', async (req, res) => {
    try {
        const { ids, status, published } = req.body;
        if (!ids?.length)
            return res.status(400).json({ error: 'ids required' });
        await database_1.prisma.project.updateMany({ where: { id: { in: ids } }, data: { status, published } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/portfolio/projects/reorder', async (req, res) => {
    try {
        const { items } = req.body;
        const transaction = items.map((item) => database_1.prisma.project.update({ where: { id: item.id }, data: { displayOrder: item.displayOrder } }));
        await database_1.prisma.$transaction(transaction);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/portfolio/projects/:id', async (req, res) => {
    try {
        const project = await database_1.prisma.project.update({ where: { id: req.params.id }, data: req.body });
        res.json({ success: true, project });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/portfolio/projects/:id', async (req, res) => {
    try {
        await database_1.prisma.project.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/portfolio/projects/:id/duplicate', async (req, res) => {
    try {
        const project = await database_1.prisma.project.findUnique({ where: { id: req.params.id } });
        if (!project)
            return res.status(404).json({ error: 'Project not found' });
        const { id: _id, createdAt, updatedAt, slug, title, ...dataToCopy } = project;
        const newProject = await database_1.prisma.project.create({
            data: {
                ...dataToCopy,
                title: `${title} (Copy)`,
                slug: `${slug}-copy-${Date.now()}`,
                status: 'draft',
                published: false,
                displayOrder: 0
            }
        });
        res.status(201).json({ success: true, project: newProject });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/portfolio/projects/:id/view', async (req, res) => {
    try {
        const { ipHash, userAgent, referer } = req.body;
        await database_1.prisma.projectView.create({
            data: {
                projectId: req.params.id,
                ipHash,
                userAgent,
                referer
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false });
    }
});
app.get('/api/portfolio/projects/:id/views', async (req, res) => {
    try {
        const count = await database_1.prisma.projectView.count({ where: { projectId: req.params.id } });
        res.json({ count });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Portfolio Categories & Tags ──────────────────────────────────────────────
app.get('/api/portfolio/categories', async (req, res) => {
    try {
        const categories = await database_1.prisma.projectCategory.findMany({ orderBy: { name: 'asc' } });
        res.json({ categories });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/portfolio/categories', async (req, res) => {
    try {
        const { name } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const category = await database_1.prisma.projectCategory.create({ data: { name, slug } });
        res.status(201).json({ success: true, category });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/portfolio/categories/:id', async (req, res) => {
    try {
        const { name } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const category = await database_1.prisma.projectCategory.update({ where: { id: req.params.id }, data: { name, slug } });
        res.json({ success: true, category });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/portfolio/categories/:id', async (req, res) => {
    try {
        await database_1.prisma.projectCategory.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Cannot delete category. It may have projects attached.' });
    }
});
app.get('/api/portfolio/tags', async (req, res) => {
    try {
        const tags = await database_1.prisma.projectTag.findMany({ orderBy: { name: 'asc' }, select: { name: true } });
        res.json({ tags });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── CMS Posts ────────────────────────────────────────────────────────────────
app.get('/api/cms/posts', async (req, res) => {
    try {
        const posts = await database_1.prisma.post.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                categories: true,
                tags: true
            }
        });
        const authorIds = Array.from(new Set(posts.map((p) => p.authorId).filter(Boolean)));
        const users = authorIds.length ? await database_1.prisma.user.findMany({
            where: { id: { in: authorIds } },
            select: { id: true, name: true, email: true }
        }) : [];
        const userMap = new Map(users.map((u) => [u.id, u]));
        const postsWithAuthors = posts.map((post) => ({
            ...post,
            author: userMap.get(post.authorId) || { name: 'LegacyMark User', email: '' }
        }));
        res.json(postsWithAuthors);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/cms/posts/:id', async (req, res) => {
    try {
        const post = await database_1.prisma.post.findUnique({
            where: { id: req.params.id },
            include: { categories: true, tags: true }
        });
        res.json(post);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/cms/posts', async (req, res) => {
    try {
        const post = await database_1.prisma.post.create({ data: req.body });
        res.status(201).json(post);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/cms/posts/:id', async (req, res) => {
    try {
        const post = await database_1.prisma.post.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(post);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/cms/posts/:id', async (req, res) => {
    try {
        await database_1.prisma.post.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── CMS Categories & Tags ────────────────────────────────────────────────────
app.get('/api/cms/categories', async (req, res) => {
    try {
        const categories = await database_1.prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { posts: true } } }
        });
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/cms/categories', async (req, res) => {
    try {
        const category = await database_1.prisma.category.create({ data: req.body });
        res.status(201).json(category);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/cms/categories/:id', async (req, res) => {
    try {
        const category = await database_1.prisma.category.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(category);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/cms/categories/:id', async (req, res) => {
    try {
        await database_1.prisma.category.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/cms/tags', async (req, res) => {
    try {
        const tags = await database_1.prisma.tag.findMany({
            orderBy: { name: 'asc' },
            select: { name: true }
        });
        res.json(tags);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── Media Assets ─────────────────────────────────────────────────────────────
app.get('/api/cms/media', async (req, res) => {
    try {
        const { companyId, type } = req.query;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const assets = await database_1.prisma.mediaAsset.findMany({
            where: { companyId: String(companyId), ...(type ? { type: String(type) } : {}) },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, name: true, originalName: true, url: true,
                mimeType: true, type: true, sizeBytes: true, duration: true,
                width: true, height: true, fps: true, resolution: true,
                tags: true, createdAt: true,
            }
        });
        res.json(assets);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/cms/media/:id', async (req, res) => {
    try {
        const { companyId } = req.query;
        const where = { id: req.params.id };
        if (companyId)
            where.companyId = String(companyId);
        const asset = await database_1.prisma.mediaAsset.findFirst({ where });
        if (!asset)
            return res.status(404).json({ error: 'Asset not found' });
        res.json(asset);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/cms/media', async (req, res) => {
    try {
        const asset = await database_1.prisma.mediaAsset.create({ data: req.body });
        res.status(201).json(asset);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.patch('/api/cms/media/:id', async (req, res) => {
    try {
        const asset = await database_1.prisma.mediaAsset.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(asset);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/cms/media/:id', async (req, res) => {
    try {
        await database_1.prisma.mediaAsset.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/cms/media-stats', async (req, res) => {
    try {
        const { companyId } = req.query;
        if (!companyId)
            return res.status(400).json({ error: 'companyId required' });
        const assets = await database_1.prisma.mediaAsset.findMany({
            where: { companyId: String(companyId) },
            select: { type: true, sizeBytes: true }
        });
        res.json(assets);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ── High-Speed Synchronous gRPC Server & Client Setup ─────────────────────────
const grpc_1 = require("@agency/grpc");
const PROJECT_GRPC_PORT = parseInt(process.env.GRPC_PORT || "50054", 10);
const AUTH_GRPC_URL = process.env.AUTH_GRPC_URL || "auth-service:50051";
const projectGrpcServer = new grpc_1.GrpcServerHelper();
projectGrpcServer.addService(grpc_1.PROTO_PATHS.project, "project", "ProjectService", {
    GetProjectStatus: async (call, callback) => {
        try {
            const { projectId, companyId } = call.request;
            const project = await database_1.prisma.kanbanProject.findFirst({
                where: { id: projectId, companyId },
            });
            if (!project) {
                return callback(null, { found: false, error: "Project not found" });
            }
            callback(null, {
                found: true,
                projectId: project.id,
                name: project.name,
                status: project.status || "ACTIVE",
                completionPercentage: 75,
                error: "",
            });
        }
        catch (err) {
            callback(null, { found: false, error: err.message || "Error" });
        }
    },
    CheckHealth: async (_call, callback) => {
        callback(null, {
            status: "healthy",
            service: "project-service",
            timestamp: Date.now(),
        });
    },
});
projectGrpcServer.start(PROJECT_GRPC_PORT).catch((err) => {
    console.error("[project-service] Failed to start gRPC server:", err.message);
});
exports.authGrpcClient = grpc_1.GrpcClientHelper.getClient("auth-service", grpc_1.PROTO_PATHS.auth, "auth", "AuthService", AUTH_GRPC_URL, { failureThreshold: 3, resetTimeoutMs: 5000, timeoutMs: 3000 });
// ── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`📋 Project Service running on port ${PORT} (HTTP) and port ${PROJECT_GRPC_PORT} (gRPC Sync)`);
    console.log(`   Models: KanbanProject, KanbanTask, KanbanSwimlane, KanbanComment, KanbanAuditLog`);
    console.log(`   Templates: ${Object.keys(BOARD_TEMPLATES).join(", ")}`);
});
(0, service_auth_1.setupGracefulShutdown)(server);
process.on("SIGTERM", async () => {
    await projectGrpcServer.forceShutdown();
    await eventBus.disconnect();
    await redisClient.quit();
    await database_1.prisma.$disconnect();
    process.exit(0);
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.default = app;
//# sourceMappingURL=index.js.map