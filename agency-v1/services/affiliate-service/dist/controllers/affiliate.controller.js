"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AffiliateController = void 0;
const affiliate_service_1 = require("../services/affiliate.service");
class AffiliateController {
    /**
     * GET /api/affiliates/profile
     */
    static async getProfile(req, res, next) {
        try {
            const userId = String(req.headers["x-user-id"] || req.query.userId || "");
            if (!userId) {
                return res.status(400).json({ success: false, error: "userId is required" });
            }
            const profile = await affiliate_service_1.AffiliateService.getProfile(userId);
            res.json({ success: true, profile });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /r/:code
     */
    static async trackClick(req, res, next) {
        try {
            const codeStr = Array.isArray(req.params.code) ? req.params.code[0] : String(req.params.code || "");
            const rawIp = req.headers["x-forwarded-for"] || req.ip;
            const ipAddress = Array.isArray(rawIp) ? rawIp[0] : String(rawIp || "127.0.0.1");
            const rawUa = req.headers["user-agent"];
            const userAgent = rawUa ? (Array.isArray(rawUa) ? rawUa[0] : String(rawUa)) : undefined;
            const result = await affiliate_service_1.AffiliateService.trackClick(codeStr, ipAddress, userAgent);
            res.redirect(result.targetUrl || "/");
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AffiliateController = AffiliateController;
//# sourceMappingURL=affiliate.controller.js.map