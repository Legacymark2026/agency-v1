import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";

const app = express();
const port = process.env.PORT || 4014;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'admin-service' });
});

// Kanban Routes migrated from Next.js
app.get('/api/admin/kanban', async (req, res) => {
  try {
    // In microservices, we expect the user/company context to be passed via headers or query parameters
    // since the gateway should validate the JWT.
    const companyId = req.headers['x-company-id'] as string || req.query.companyId as string;

    if (!companyId) {
      return res.status(400).json({ error: "companyId is required" });
    }

    const projects = await prisma.kanbanProject.findMany({
        where: { companyId: companyId },
        include: {
            kanbanTasks: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    priority: true,
                    order: true,
                    projectId: true,
                    assigneeId: true,
                    creatorId: true,
                    dueDate: true,
                    estimatedHours: true,
                    swimlaneId: true,
                    createdAt: true,
                    updatedAt: true,
                    assignee: { select: { id: true, name: true, image: true } },
                },
                orderBy: { order: "asc" },
            },
            swimlanes: { orderBy: { order: "asc" } },
            deal: { select: { id: true, title: true, value: true, stage: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    res.json(projects);
  } catch (error: any) {
    console.error("KANBAN_GET_ERROR", error?.message || error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post('/api/admin/kanban', async (req, res) => {
  try {
    const { name, description, companyId, dealId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "companyId is required" });
    }

    const newProject = await prisma.kanbanProject.create({
        data: {
            name: name,
            description: description,
            companyId: companyId,
            dealId: dealId || null,
        }
    });

    // Auto-create 3 default swimlanes
    await prisma.kanbanSwimlane.createMany({
        data: [
            { name: "Backlog", projectId: newProject.id, order: 0 },
            { name: "Sprint Activo", projectId: newProject.id, order: 1 },
            { name: "Revisión / Bloqueados", projectId: newProject.id, order: 2 },
        ]
    });

    res.status(201).json(newProject);
  } catch (error: any) {
    console.error("KANBAN_POST_ERROR", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Diagnostics and Debug placeholders
app.use('/api/diagnostics', (req, res) => { res.status(200).json({ message: '/api/diagnostics handled by admin-service' }); });
app.use('/api/debug', (req, res) => { res.status(200).json({ message: '/api/debug handled by admin-service' }); });
app.use('/api/admin', (req, res) => { res.status(200).json({ message: '/api/admin fallback handled by admin-service' }); });

app.listen(port, () => {
  console.log(`Admin Service listening at http://localhost:${port}`);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default app as any;
