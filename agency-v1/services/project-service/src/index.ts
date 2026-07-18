/**
 * Project Service — Kanban & Project Management Microservice
 * ─────────────────────────────────────────────────────────────────────────────
 * Port: 4018 (internal)
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { EventBus } from "@agency/events";
import Redis from "ioredis";

const app = express();
const PORT = parseInt(process.env.PORT || "4018", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Health & Readiness ───────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "project-service", version: "1.0.0", timestamp: new Date().toISOString() });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err) });
  }
});

// ── Kanban Projects ──────────────────────────────────────────────────────────

app.get("/api/projects", async (req, res) => {
  try {
    const { companyId, status, page = "1", limit = "20" } = req.query;
    if (!companyId) return res.status(400).json({ error: "companyId required" });

    const where: Record<string, unknown> = { companyId: String(companyId) };
    if (status) where.status = String(status);

    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));

    const [projects, total] = await Promise.all([
      prisma.kanbanProject.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: parseInt(String(limit)),
        skip,
        include: { swimlanes: true },
      }),
      prisma.kanbanProject.count({ where }),
    ]);

    // Get task counts per project
    const projectsWithCounts = await Promise.all(
      projects.map(async (p: typeof projects[number]) => {
        const taskCount = await prisma.kanbanTask.count({ where: { projectId: p.id } });
        return { ...p, taskCount };
      })
    );

    res.json({ projects: projectsWithCounts, total, page: parseInt(String(page)) });
  } catch (err) {
    console.error("[project-service] GET /api/projects error:", err);
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const { companyId, name, description, templateId } = req.body;

    const project = await prisma.kanbanProject.create({
      data: { companyId, name, description, status: "ACTIVE" },
    });

    // Create default swimlanes from template
    const lanes = templateId
      ? BOARD_TEMPLATES[templateId] || BOARD_TEMPLATES.kanban
      : BOARD_TEMPLATES.kanban;

    for (let i = 0; i < lanes.length; i++) {
      await prisma.kanbanSwimlane.create({
        data: { projectId: project.id, name: lanes[i], order: i },
      });
    }

    await eventBus.publish("project.created", {
      projectId: project.id,
      companyId,
      name,
    });

    res.status(201).json({ project });
  } catch (err) {
    console.error("[project-service] POST /api/projects error:", err);
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/projects/:id", async (req, res) => {
  try {
    const project = await prisma.kanbanProject.findUnique({
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

    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.patch("/api/projects/:id", async (req, res) => {
  try {
    const project = await prisma.kanbanProject.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Swimlanes (Columns) ─────────────────────────────────────────────────────

app.post("/api/kanban/swimlanes", async (req, res) => {
  try {
    const { projectId, name, order } = req.body;
    const swimlane = await prisma.kanbanSwimlane.create({
      data: { projectId, name, order: order || 0 },
    });
    res.status(201).json({ swimlane });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.patch("/api/kanban/swimlanes/:id", async (req, res) => {
  try {
    const swimlane = await prisma.kanbanSwimlane.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ swimlane });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.patch("/api/kanban/swimlanes/reorder", async (req, res) => {
  try {
    const { swimlanes } = req.body; // [{ id, order }]
    for (const lane of swimlanes) {
      await prisma.kanbanSwimlane.update({
        where: { id: lane.id },
        data: { order: lane.order },
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Kanban Tasks ─────────────────────────────────────────────────────────────

app.get("/api/tasks", async (req, res) => {
  try {
    const { projectId, assigneeId, status, priority, search, archived } = req.query;

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = String(projectId);
    if (assigneeId) where.assigneeId = String(assigneeId);
    if (status) where.status = String(status);
    if (priority) where.priority = String(priority);
    if (archived !== undefined) where.archived = archived === "true";
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const tasks = await prisma.kanbanTask.findMany({
      where,
      orderBy: { order: "asc" },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    res.json({ tasks, count: tasks.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { projectId, title, description, assigneeId, creatorId, priority, dueDate, swimlaneId, storyPoints } = req.body;

    // Get next order position
    const maxOrder = await prisma.kanbanTask.aggregate({
      where: { projectId },
      _max: { order: true },
    });

    const task = await prisma.kanbanTask.create({
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
  } catch (err) {
    console.error("[project-service] POST /api/tasks error:", err);
    res.status(500).json({ error: String(err) });
  }
});

app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const before = await prisma.kanbanTask.findUnique({ where: { id: req.params.id } });
    const task = await prisma.kanbanTask.update({
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
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.patch("/api/tasks/:id/archive", async (req, res) => {
  try {
    const task = await prisma.kanbanTask.update({
      where: { id: req.params.id },
      data: { archived: true, archivedAt: new Date() },
    });
    await createAuditEntry(task.id, task.creatorId, "ARCHIVED", null, null);
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Task Comments ────────────────────────────────────────────────────────────

app.get("/api/tasks/:id/comments", async (req, res) => {
  try {
    const comments = await prisma.kanbanComment.findMany({
      where: { taskId: req.params.id },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, name: true, image: true } } },
    });
    res.json({ comments });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/tasks/:id/comments", async (req, res) => {
  try {
    const comment = await prisma.kanbanComment.create({
      data: {
        taskId: req.params.id,
        authorId: req.body.authorId,
        content: req.body.content,
      },
    });
    res.status(201).json({ comment });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Board Templates ──────────────────────────────────────────────────────────

const BOARD_TEMPLATES: Record<string, string[]> = {
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
    const audit = await prisma.kanbanAuditLog.findMany({
      where: { taskId: req.params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { actor: { select: { id: true, name: true, image: true } } },
    });
    res.json({ audit });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

async function createAuditEntry(taskId: string, actorId: string, action: string, fromValue: string | null, toValue: string | null) {
  try {
    await prisma.kanbanAuditLog.create({
      data: { taskId, actorId, action, fromValue, toValue },
    });
  } catch (err) {
    console.error("[project-service] Audit entry creation failed:", err);
  }
}

// ── Project Stats ────────────────────────────────────────────────────────────

app.get("/api/projects/:id/stats", async (req, res) => {
  try {
    const projectId = req.params.id;

    const [totalTasks, completedTasks, overdueTasks, byPriority, byAssignee] = await Promise.all([
      prisma.kanbanTask.count({ where: { projectId, archived: false } }),
      prisma.kanbanTask.count({ where: { projectId, status: "DONE" } }),
      prisma.kanbanTask.count({
        where: { projectId, dueDate: { lt: new Date() }, status: { notIn: ["DONE"] }, archived: false },
      }),
      prisma.kanbanTask.groupBy({
        by: ["priority"],
        where: { projectId, archived: false },
        _count: true,
      }),
      prisma.kanbanTask.groupBy({
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
      byPriority: byPriority.map((p: typeof byPriority[number]) => ({ priority: p.priority, count: p._count })),
      byAssignee: byAssignee.map((a: typeof byAssignee[number]) => ({ assigneeId: a.assigneeId, count: a._count })),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Event Bus ────────────────────────────────────────────────────────────────

const eventBus = new EventBus(REDIS_URL, "project-service");
const redisClient = new Redis(REDIS_URL);
redisClient.on("error", (err) => console.error("[project-service] Redis client error:", err.message));

// Sync: when a deal stage changes, update linked tasks
eventBus.subscribe("deal.stage_changed", async (payload) => {
  try {
    const { dealId } = payload.data;
    if (!dealId) return;
    const project = await prisma.kanbanProject.findUnique({ where: { dealId: String(dealId) } });
    if (project) {
      console.log(`[project-service] Deal ${dealId} stage changed, project ${project.id} linked`);
    }
  } catch (err) {
    console.error("[project-service] deal.stage_changed handler error:", err);
  }
});


// ─── Portfolio Projects ───────────────────────────────────────────────────────
app.get('/api/portfolio/projects', async (req, res) => {
  try {
    const { companyId, status, categoryId, search, featured, page = '1', limit = '50' } = req.query;
    const where: any = {};
    if (companyId) where.companyId = String(companyId);
    if (status) where.status = String(status);
    if (categoryId) where.categoryId = String(categoryId);
    if (featured !== undefined) where.featured = featured === 'true';
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { client: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } }
      ];
    }
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    const projects = await (prisma as any).project.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
      take: parseInt(String(limit)),
      skip,
      include: { category: true, _count: { select: { views: true } } }
    });
    res.json({ projects });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.get('/api/portfolio/projects/public', async (req, res) => {
  try {
    const { categorySlug, limit } = req.query;
    const where: any = { status: 'published', published: true };
    if (categorySlug) where.category = { slug: String(categorySlug) };
    const projects = await (prisma as any).project.findMany({
      where,
      take: limit ? parseInt(String(limit)) : undefined,
      orderBy: [{ featured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: { category: true, _count: { select: { views: true } } }
    });
    res.json({ projects });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.get('/api/portfolio/projects/:id', async (req, res) => {
  try {
    const project = await (prisma as any).project.findUnique({
      where: { id: req.params.id },
      include: { category: true }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.post('/api/portfolio/projects', async (req, res) => {
  try {
    const project = await (prisma as any).project.create({ data: req.body });
    res.status(201).json({ success: true, project });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/portfolio/projects/bulk-status', async (req, res) => {
  try {
    const { ids, status, published } = req.body;
    if (!ids?.length) return res.status(400).json({ error: 'ids required' });
    await (prisma as any).project.updateMany({ where: { id: { in: ids } }, data: { status, published } });
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.post('/api/portfolio/projects/reorder', async (req, res) => {
  try {
    const { items } = req.body;
    const transaction = items.map((item: { id: string; displayOrder: number }) =>
      (prisma as any).project.update({ where: { id: item.id }, data: { displayOrder: item.displayOrder } })
    );
    await prisma.$transaction(transaction);
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/portfolio/projects/:id', async (req, res) => {
  try {
    const project = await (prisma as any).project.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, project });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/portfolio/projects/:id', async (req, res) => {
  try {
    await (prisma as any).project.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.post('/api/portfolio/projects/:id/duplicate', async (req, res) => {
  try {
    const project = await (prisma as any).project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const { id: _id, createdAt, updatedAt, slug, title, ...dataToCopy } = project;
    const newProject = await (prisma as any).project.create({
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
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.post('/api/portfolio/projects/:id/view', async (req, res) => {
  try {
    const { ipHash, userAgent, referer } = req.body;
    await (prisma as any).projectView.create({
      data: {
        projectId: req.params.id,
        ipHash,
        userAgent,
        referer
      }
    });
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ success: false }); }
});

app.get('/api/portfolio/projects/:id/views', async (req, res) => {
  try {
    const count = await (prisma as any).projectView.count({ where: { projectId: req.params.id } });
    res.json({ count });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ─── Portfolio Categories & Tags ──────────────────────────────────────────────
app.get('/api/portfolio/categories', async (req, res) => {
  try {
    const categories = await (prisma as any).projectCategory.findMany({ orderBy: { name: 'asc' } });
    res.json({ categories });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.post('/api/portfolio/categories', async (req, res) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const category = await (prisma as any).projectCategory.create({ data: { name, slug } });
    res.status(201).json({ success: true, category });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/portfolio/categories/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const category = await (prisma as any).projectCategory.update({ where: { id: req.params.id }, data: { name, slug } });
    res.json({ success: true, category });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/portfolio/categories/:id', async (req, res) => {
  try {
    await (prisma as any).projectCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: 'Cannot delete category. It may have projects attached.' }); }
});

app.get('/api/portfolio/tags', async (req, res) => {
  try {
    const tags = await (prisma as any).projectTag.findMany({ orderBy: { name: 'asc' }, select: { name: true } });
    res.json({ tags });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ─── CMS Posts ────────────────────────────────────────────────────────────────
app.get('/api/cms/posts', async (req, res) => {
  try {
    const posts = await (prisma as any).post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        categories: true,
        tags: true
      }
    });

    const authorIds = Array.from(new Set(posts.map((p: any) => p.authorId).filter(Boolean)));
    const users = authorIds.length ? await (prisma as any).user.findMany({
      where: { id: { in: authorIds as string[] } },
      select: { id: true, name: true, email: true }
    }) : [];

    const userMap = new Map(users.map((u: any) => [u.id, u]));

    const postsWithAuthors = posts.map((post: any) => ({
      ...post,
      author: userMap.get(post.authorId) || { name: 'LegacyMark User', email: '' }
    }));

    res.json(postsWithAuthors);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.get('/api/cms/posts/:id', async (req, res) => {
  try {
    const post = await (prisma as any).post.findUnique({
      where: { id: req.params.id },
      include: { categories: true, tags: true }
    });
    res.json(post);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.post('/api/cms/posts', async (req, res) => {
  try {
    const post = await (prisma as any).post.create({ data: req.body });
    res.status(201).json(post);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/cms/posts/:id', async (req, res) => {
  try {
    const post = await (prisma as any).post.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(post);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/cms/posts/:id', async (req, res) => {
  try {
    await (prisma as any).post.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ─── CMS Categories & Tags ────────────────────────────────────────────────────
app.get('/api/cms/categories', async (req, res) => {
  try {
    const categories = await (prisma as any).category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: true } } }
    });
    res.json(categories);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.post('/api/cms/categories', async (req, res) => {
  try {
    const category = await (prisma as any).category.create({ data: req.body });
    res.status(201).json(category);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/cms/categories/:id', async (req, res) => {
  try {
    const category = await (prisma as any).category.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(category);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/cms/categories/:id', async (req, res) => {
  try {
    await (prisma as any).category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.get('/api/cms/tags', async (req, res) => {
  try {
    const tags = await (prisma as any).tag.findMany({
      orderBy: { name: 'asc' },
      select: { name: true }
    });
    res.json(tags);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ─── Media Assets ─────────────────────────────────────────────────────────────
app.get('/api/cms/media', async (req, res) => {
  try {
    const { companyId, type } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const assets = await (prisma as any).mediaAsset.findMany({
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
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.get('/api/cms/media/:id', async (req, res) => {
  try {
    const { companyId } = req.query;
    const where: any = { id: req.params.id };
    if (companyId) where.companyId = String(companyId);
    const asset = await (prisma as any).mediaAsset.findFirst({ where });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.post('/api/cms/media', async (req, res) => {
  try {
    const asset = await (prisma as any).mediaAsset.create({ data: req.body });
    res.status(201).json(asset);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/cms/media/:id', async (req, res) => {
  try {
    const asset = await (prisma as any).mediaAsset.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(asset);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/cms/media/:id', async (req, res) => {
  try {
    await (prisma as any).mediaAsset.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.get('/api/cms/media-stats', async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) return res.status(400).json({ error: 'companyId required' });
    const assets = await (prisma as any).mediaAsset.findMany({
      where: { companyId: String(companyId) },
      select: { type: true, sizeBytes: true }
    });
    res.json(assets);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
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
  await prisma.$disconnect();
  process.exit(0);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;
