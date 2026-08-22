"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicApiController = void 0;
const public_api_service_1 = require("../services/public-api.service");
class PublicApiController {
    /**
     * GET /api/v1/status
     */
    static async getStatus(_req, res, next) {
        try {
            const status = await public_api_service_1.PublicApiService.getPublicStatus();
            res.json({ success: true, ...status });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PublicApiController = PublicApiController;
//# sourceMappingURL=public-api.controller.js.map