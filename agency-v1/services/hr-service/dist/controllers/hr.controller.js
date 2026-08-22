"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HrController = void 0;
const hr_service_1 = require("../services/hr.service");
class HrController {
    /**
     * GET /api/employees
     */
    static async getEmployees(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const result = await hr_service_1.HrService.getEmployees(companyId, req.query.department, req.query.page ? parseInt(req.query.page, 10) : 1, req.query.limit ? parseInt(req.query.limit, 10) : 25);
            res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/employees
     */
    static async createEmployee(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const employee = await hr_service_1.HrService.createEmployee({
                ...req.body,
                companyId
            });
            res.status(201).json({ success: true, employee });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.HrController = HrController;
//# sourceMappingURL=hr.controller.js.map