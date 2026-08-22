"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationController = void 0;
const integration_service_1 = require("../services/integration.service");
class IntegrationController {
    /**
     * GET /api/integrations
     */
    static async getIntegrations(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.query.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const integrations = await integration_service_1.IntegrationService.getIntegrations(companyId);
            res.json({ success: true, integrations });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/integrations
     */
    static async connectIntegration(req, res, next) {
        try {
            const companyId = String(req.headers["x-company-id"] || req.body.companyId || "");
            if (!companyId) {
                return res.status(400).json({ success: false, error: "companyId is required" });
            }
            const integration = await integration_service_1.IntegrationService.connectIntegration({
                ...req.body,
                companyId
            });
            res.status(201).json({ success: true, integration });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.IntegrationController = IntegrationController;
//# sourceMappingURL=integration.controller.js.map