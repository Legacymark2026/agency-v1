"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const observability_1 = require("@agency/observability");
const express_1 = __importDefault(require("express"));
// Observability registration — must be first
try {
    require("@agency/observability/register");
}
catch { /* observability optional */ }
const service_auth_1 = require("@agency/service-auth");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("@agency/database");
const app = (0, express_1.default)();
app.use((0, observability_1.metricsMiddleware)("admin-service"));
app.get("/metrics", observability_1.metricsEndpoint);
const port = process.env.PORT || 4014;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'admin-service' });
});
const admin_routes_1 = require("./routes/admin.routes");
const admin_middleware_1 = require("./middlewares/admin.middleware");
app.use("/api/v1", admin_routes_1.adminRouter);
app.use(admin_middleware_1.errorHandler);
// Kanban Routes migrated from Next.js
app.get('/api/admin/kanban', async (req, res) => {
    try {
        // In microservices, we expect the user/company context to be passed via headers or query parameters
        // since the gateway should validate the JWT.
        const companyId = req.headers['x-company-id'] || req.query.companyId;
        if (!companyId) {
            return res.status(400).json({ error: "companyId is required" });
        }
        const projects = await database_1.prisma.kanbanProject.findMany({
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
    }
    catch (error) {
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
        const newProject = await database_1.prisma.kanbanProject.create({
            data: {
                name: name,
                description: description,
                companyId: companyId,
                dealId: dealId || null,
            }
        });
        // Auto-create 3 default swimlanes
        await database_1.prisma.kanbanSwimlane.createMany({
            data: [
                { name: "Backlog", projectId: newProject.id, order: 0 },
                { name: "Sprint Activo", projectId: newProject.id, order: 1 },
                { name: "Revisión / Bloqueados", projectId: newProject.id, order: 2 },
            ]
        });
        res.status(201).json(newProject);
    }
    catch (error) {
        console.error("KANBAN_POST_ERROR", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// Diagnostics and Debug placeholders
app.use('/api/diagnostics', (req, res) => { res.status(200).json({ message: '/api/diagnostics handled by admin-service' }); });
app.use('/api/debug', (req, res) => { res.status(200).json({ message: '/api/debug handled by admin-service' }); });
app.use('/api/admin', (req, res) => { res.status(200).json({ message: '/api/admin fallback handled by admin-service' }); });
const server = app.listen(port, () => {
    console.log(`Admin Service listening at http://localhost:${port}`);
});
(0, service_auth_1.setupGracefulShutdown)(server);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.default = app;
//# sourceMappingURL=index.js.map