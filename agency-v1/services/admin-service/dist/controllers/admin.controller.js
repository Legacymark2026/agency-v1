"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("../services/admin.service");
class AdminController {
    /**
     * GET /api/admin/kanban
     */
    static async getKanban(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const projects = await admin_service_1.AdminService.getAdminKanbanProjects(companyId);
            res.json({ success: true, projects });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/admin/overview
     */
    static async getOverview(_req, res, next) {
        try {
            const overview = await admin_service_1.AdminService.getSystemOverview();
            res.json({ success: true, overview });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=admin.controller.js.map