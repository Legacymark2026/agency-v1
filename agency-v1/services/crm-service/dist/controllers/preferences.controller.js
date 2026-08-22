"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesController = void 0;
const preferences_service_js_1 = require("../services/preferences.service.js");
class PreferencesController {
    /**
     * POST /api/v1/leads/unsubscribe
     */
    static async unsubscribe(req, res, next) {
        try {
            const { email, channel } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, error: "email is required" });
            }
            const targetChannel = channel || "ALL";
            const result = await preferences_service_js_1.PreferencesService.unsubscribeLead(String(email), targetChannel);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PreferencesController = PreferencesController;
//# sourceMappingURL=preferences.controller.js.map