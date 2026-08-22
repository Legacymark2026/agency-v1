"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoldneezController = void 0;
const goldneez_service_1 = require("../services/goldneez.service");
class GoldneezController {
    /**
     * GET /api/rewards/points
     */
    static async getPoints(req, res, next) {
        try {
            const customerId = String(req.headers["x-customer-id"] || req.query.customerId || "");
            if (!customerId) {
                return res.status(400).json({ success: false, error: "customerId is required" });
            }
            const points = await goldneez_service_1.GoldneezService.getPoints(customerId);
            res.json({ success: true, customerId, points });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/rewards/redeem
     */
    static async redeemReward(req, res, next) {
        try {
            const customerId = String(req.headers["x-customer-id"] || req.body.customerId || "");
            const { rewardId, pointsCost } = req.body;
            if (!customerId || !rewardId || pointsCost === undefined) {
                return res.status(400).json({ success: false, error: "customerId, rewardId and pointsCost are required" });
            }
            const result = await goldneez_service_1.GoldneezService.redeemReward(customerId, rewardId, Number(pointsCost));
            res.status(201).json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.GoldneezController = GoldneezController;
//# sourceMappingURL=goldneez.controller.js.map