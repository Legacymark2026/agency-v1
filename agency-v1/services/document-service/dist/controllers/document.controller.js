"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = void 0;
const document_service_1 = require("../services/document.service");
class DocumentController {
    /**
     * GET /api/proposals
     */
    static async getProposals(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const proposals = await document_service_1.DocumentService.getProposals(companyId);
            res.json({ success: true, proposals });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/proposals
     */
    static async createProposal(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const proposal = await document_service_1.DocumentService.createProposal({
                ...req.body,
                companyId
            });
            res.status(201).json({ success: true, proposal });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DocumentController = DocumentController;
//# sourceMappingURL=document.controller.js.map