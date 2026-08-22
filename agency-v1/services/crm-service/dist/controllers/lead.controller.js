"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadController = void 0;
const lead_service_1 = require("../services/lead.service");
class LeadController {
    /**
     * GET /api/leads
     */
    static async getLeads(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const result = await lead_service_1.LeadService.getLeads({
                companyId,
                status: req.query.status,
                source: req.query.source,
                scoreMin: req.query.scoreMin ? parseInt(req.query.scoreMin, 10) : undefined,
                scoreMax: req.query.scoreMax ? parseInt(req.query.scoreMax, 10) : undefined,
                search: req.query.search,
                page: req.query.page ? parseInt(req.query.page, 10) : 1,
                pageSize: req.query.pageSize ? parseInt(req.query.pageSize, 10) : 20,
                sortBy: req.query.sortBy || "createdAt",
                sortOrder: req.query.sortOrder || "desc",
                syncDealId: req.query.syncDealId,
                syncEmail: req.query.syncEmail,
            });
            res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/leads/:id
     */
    static async getLeadById(req, res, next) {
        try {
            const id = String(req.params.id || "");
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const lead = await lead_service_1.LeadService.getLeadById(id, companyId);
            res.json({ success: true, lead });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/leads
     */
    static async createLead(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const lead = await lead_service_1.LeadService.createLead({
                ...req.body,
                companyId
            });
            res.status(201).json({ success: true, lead });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.LeadController = LeadController;
//# sourceMappingURL=lead.controller.js.map