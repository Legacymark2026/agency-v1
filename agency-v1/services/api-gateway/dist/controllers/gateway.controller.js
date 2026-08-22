"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayController = void 0;
const gateway_service_1 = require("../services/gateway.service");
class GatewayController {
    /**
     * POST /api/gateway/verify-token
     */
    static async verifyToken(req, res, next) {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ valid: false, error: "Token required" });
            }
            const result = await gateway_service_1.GatewayService.verifyToken(token);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/gateway/services
     */
    static listServices(_req, res) {
        const services = ["auth", "crm", "project", "ai-engine", "finance", "agent-team", "notification", "analytics"];
        res.json({ success: true, services });
    }
}
exports.GatewayController = GatewayController;
//# sourceMappingURL=gateway.controller.js.map