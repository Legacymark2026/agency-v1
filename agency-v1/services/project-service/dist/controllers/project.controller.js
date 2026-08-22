"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectController = void 0;
const project_service_1 = require("../services/project.service");
class ProjectController {
    /**
     * GET /api/projects
     */
    static async getProjects(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const result = await project_service_1.ProjectService.getProjects(companyId, req.query.status, req.query.page ? parseInt(req.query.page, 10) : 1, req.query.limit ? parseInt(req.query.limit, 10) : 20);
            res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/projects
     */
    static async createProject(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const project = await project_service_1.ProjectService.createProject({
                ...req.body,
                companyId
            });
            res.status(201).json({ success: true, project });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ProjectController = ProjectController;
//# sourceMappingURL=project.controller.js.map